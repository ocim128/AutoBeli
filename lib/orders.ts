import { getMongoClient } from "@/lib/db";
import { ObjectId, Db } from "mongodb";
import { Order, Product, AccessToken } from "@/lib/definitions";
import { invalidateProductCache } from "@/lib/products";
import { getPakasirTransactionStatus } from "@/lib/pakasir";
import { generateAccessToken } from "@/lib/tokens";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { upsertAudienceFromPaidOrder } from "@/lib/audience";

export type OrderWithProduct = Order & { product: Product };

export async function getOrderWithProduct(orderId: string): Promise<OrderWithProduct | null> {
  if (!ObjectId.isValid(orderId)) return null;

  try {
    const client = await getMongoClient();
    const db = client.db();

    // Aggregation to join Order with Product
    const pipeline = [
      { $match: { _id: new ObjectId(orderId) } },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      // Exclude sensitive content
      { $project: { "product.contentEncrypted": 0 } },
    ];

    const result = await db.collection<Order>("orders").aggregate(pipeline).toArray();

    if (result.length === 0) return null;
    return result[0] as OrderWithProduct;
  } catch (e) {
    console.error(e);
    return null;
  }
}

// ============================================
// Shared Payment Completion Logic
// ============================================

export interface PaymentCompletionParams {
  orderId: string;
  order: Order;
  product: Product;
  amount: number;
  db: Db;
  isTest?: boolean;
}

/**
 * Handles all the side effects when a payment is successfully completed:
 * 1. Update order status to PAID
 * 2. Mark stock items as sold (skipped if isTest is true)
 * 3. Invalidate product cache
 * 4. Generate access token
 * 5. Attempt best-effort confirmation email (skipped if isTest is true)
 */
export async function handleSuccessfulPayment({
  orderId,
  order,
  product,
  amount,
  db,
  isTest = false,
}: PaymentCompletionParams): Promise<boolean> {
  const objectId = new ObjectId(orderId);
  const quantityToSell = order.quantity || 1;

  // Auto-detect test orders if not explicitly set
  const isTestOrder =
    isTest ||
    order.customerContact === "customer@example.com" ||
    order.paymentMetadata?.transaction_ref === "test_ref";

  // 1. Update Order Status
  await db.collection<Order>("orders").updateOne(
    { _id: objectId },
    {
      $set: {
        status: "PAID",
        amountPaid: amount,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  // 2. Mark stock items as sold
  if (product.stockItems && product.stockItems.length > 0) {
    // Stock-based product: Find the N unsold stock items
    const unsoldIndices = product.stockItems
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !item.isSold)
      .slice(0, quantityToSell)
      .map(({ index }) => index);

    if (unsoldIndices.length > 0) {
      const soldStockItemIds: string[] = [];
      const updateSet: Record<string, boolean | Date | ObjectId> = { updatedAt: new Date() };

      // Prepare update for all sold items
      unsoldIndices.forEach((index) => {
        const stockItem = product.stockItems![index];
        soldStockItemIds.push(stockItem.id);
        updateSet[`stockItems.${index}.isSold`] = true;
        updateSet[`stockItems.${index}.soldAt`] = new Date();
        updateSet[`stockItems.${index}.orderId`] = objectId;
      });

      // Mark items as sold (SKIP IF TEST)
      if (!isTestOrder) {
        await db
          .collection<Product>("products")
          .updateOne({ _id: order.productId }, { $set: updateSet });
      }

      // Store stock item IDs in order
      await db.collection<Order>("orders").updateOne(
        { _id: objectId },
        {
          $set: {
            stockItemId: soldStockItemIds[0], // Primary item for legacy compat
            stockItemIds: soldStockItemIds,
          },
        }
      );

      // Check if all stock items are now sold
      const totalStock = product.stockItems.length;
      const previousSold = product.stockItems.filter((i) => i.isSold).length;
      const nowSold = previousSold + unsoldIndices.length;

      if (nowSold >= totalStock && !isTestOrder) {
        await db
          .collection<Product>("products")
          .updateOne({ _id: order.productId }, { $set: { isSold: true } });
      }
    }
  } else {
    // Legacy product: mark entire product as sold (SKIP IF TEST)
    if (!isTestOrder) {
      await db.collection<Product>("products").updateOne(
        { _id: order.productId },
        {
          $set: {
            isSold: true,
            updatedAt: new Date(),
          },
        }
      );
    }
  }

  // 3. Invalidate product cache so the store reflects the sold status
  invalidateProductCache();

  // 4. Ensure Access Token Exists
  const existingToken = await db.collection<AccessToken>("tokens").findOne({
    orderId: objectId,
  });

  if (!existingToken) {
    await generateAccessToken(orderId);
  }

  // 5. Attempt order confirmation email (SKIP IF TEST)
  if (order.customerContact && !isTestOrder) {
    try {
      const emailResult = await sendOrderConfirmationEmail({
        orderId: orderId,
        productTitle: product.title,
        amountPaid: amount,
        orderDate: new Date().toLocaleString("en-GB", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        customerEmail: order.customerContact,
      });

      if (emailResult.success) {
        await db
          .collection<Order>("orders")
          .updateOne({ _id: objectId }, { $set: { emailSent: true } });
      } else {
        console.warn("Order confirmation email not sent:", emailResult.error);
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }
  }

  // 6. Auto-sync audience from paid order
  if (order.customerContact && !isTestOrder) {
    try {
      await upsertAudienceFromPaidOrder(order.customerContact, db);
    } catch (audienceError) {
      console.error("[Audience] Failed to sync audience from paid order:", audienceError);
    }
  }

  return true;
}

/**
 * Attempts to send an email for an already-paid order that didn't get one
 */
async function retrySendingEmail(orderId: string, order: Order, db: Db): Promise<void> {
  if (!order.emailSent && order.customerContact) {
    try {
      const product = await db.collection<Product>("products").findOne({ _id: order.productId });

      if (product) {
        const emailResult = await sendOrderConfirmationEmail({
          orderId: orderId,
          productTitle: product.title,
          amountPaid: order.amountPaid,
          orderDate: new Date(order.paidAt || order.createdAt).toLocaleString("en-GB", {
            day: "numeric",
            month: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          customerEmail: order.customerContact,
        });

        if (emailResult.success) {
          await db
            .collection<Order>("orders")
            .updateOne(
              { _id: new ObjectId(orderId) },
              { $set: { emailSent: true, updatedAt: new Date() } }
            );
        } else {
          console.warn("Order confirmation email retry skipped:", emailResult.error);
        }
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email on sync:", emailError);
    }
  }
}

// ============================================
// Main Payment Sync Function
// ============================================

export async function syncOrderPaymentStatus(orderId: string): Promise<boolean> {
  if (!ObjectId.isValid(orderId)) return false;

  try {
    const client = await getMongoClient();
    const db = client.db();

    const order = await db.collection<Order>("orders").findOne({ _id: new ObjectId(orderId) });

    if (!order || !order.paymentMetadata?.transaction_ref) {
      return false;
    }

    // Only skip if fully synced (PAID and has correct amount AND email was sent)
    if (order.status === "PAID" && order.amountPaid > 0) {
      // If payment is complete but email wasn't sent, try to send it now
      await retrySendingEmail(orderId, order, db);
      return false;
    }

    // Handle Pakasir provider
    if (order.paymentMetadata.provider === "pakasir") {
      const product = await db.collection<Product>("products").findOne({ _id: order.productId });
      if (!product) return false;

      // Calculate total amount based on quantity for Pakasir status check
      const orderQuantity = order.quantity || 1;
      const amount = product.priceIdr * orderQuantity;
      const statusCheck = await getPakasirTransactionStatus(orderId, amount);

      if (statusCheck.success && statusCheck.data) {
        const txStatus = statusCheck.data.transaction.status;

        if (txStatus === "completed") {
          return await handleSuccessfulPayment({
            orderId,
            order,
            product,
            amount,
            db,
          });
        }
      }
    }

    // Handle Mock provider (for development/testing)
    if (order.paymentMetadata.provider === "mock") {
      // Mock payments are typically processed immediately via webhook
      // This sync is just a fallback - check if order is already marked paid
      return false;
    }

    return false;
  } catch (e) {
    console.error("Failed to sync order status:", e);
    return false;
  }
}
