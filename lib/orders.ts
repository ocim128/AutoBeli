import { getMongoClient } from "@/lib/db";
import { ObjectId, Db } from "mongodb";
import { Order, Product } from "@/lib/definitions";
import { invalidateProductCache } from "@/lib/products";
import { getPakasirTransactionStatus } from "@/lib/pakasir";
import { ensureAccessToken } from "@/lib/tokens";
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
      { $project: { "product.contentEncrypted": 0, "product.stockItems": 0 } },
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

interface StockAssignmentResult {
  success: boolean;
  stockItemId?: string;
  stockItemIds?: string[];
  error?: string;
  product?: Product;
}

const PAYMENT_COMPLETION_LOCK_TIMEOUT_MS = 5 * 60 * 1000;

function getUnsoldStockItems(product: Product) {
  return (product.stockItems || []).filter((item) => !item.isSold);
}

function getStockItemsAssignedToOrder(product: Product, orderId: ObjectId) {
  const orderIdString = orderId.toString();
  return (product.stockItems || []).filter((item) => item.orderId?.toString() === orderIdString);
}

async function assignStockForPaidOrder(params: {
  orderId: ObjectId;
  product: Product;
  quantity: number;
  db: Db;
  isTestOrder: boolean;
}): Promise<StockAssignmentResult> {
  const { orderId, quantity, db, isTestOrder } = params;
  const productCollection = db.collection<Product>("products");

  if (!params.product._id) {
    return { success: false, error: "Product is missing an ID" };
  }

  for (let attempt = 0; attempt < 2; attempt++) {
    const product = isTestOrder
      ? params.product
      : ((await productCollection.findOne({ _id: params.product._id })) ?? params.product);

    if (product.stockItems && product.stockItems.length > 0) {
      const alreadyAssignedItems = getStockItemsAssignedToOrder(product, orderId).slice(
        0,
        quantity
      );

      if (alreadyAssignedItems.length >= quantity) {
        const stockItemIds = alreadyAssignedItems.map((item) => item.id);
        return {
          success: true,
          stockItemId: stockItemIds[0],
          stockItemIds,
          product,
        };
      }

      const selectedItems = getUnsoldStockItems(product).slice(0, quantity);

      if (selectedItems.length < quantity) {
        return {
          success: false,
          error: "Not enough stock available during payment completion",
          product,
        };
      }

      const stockItemIds = selectedItems.map((item) => item.id);

      if (isTestOrder) {
        return {
          success: true,
          stockItemId: stockItemIds[0],
          stockItemIds,
          product,
        };
      }

      const now = new Date();
      const result = await productCollection.updateOne(
        {
          _id: product._id,
          $and: stockItemIds.map((id) => ({
            stockItems: { $elemMatch: { id, isSold: { $ne: true } } },
          })),
        },
        {
          $set: {
            "stockItems.$[item].isSold": true,
            "stockItems.$[item].soldAt": now,
            "stockItems.$[item].orderId": orderId,
            updatedAt: now,
          },
        },
        {
          arrayFilters: [{ "item.id": { $in: stockItemIds }, "item.isSold": { $ne: true } }],
        }
      );

      if (result.modifiedCount > 0) {
        await productCollection.updateOne(
          {
            _id: product._id,
            stockItems: { $not: { $elemMatch: { isSold: { $ne: true } } } },
          },
          { $set: { isSold: true, updatedAt: now } }
        );

        return {
          success: true,
          stockItemId: stockItemIds[0],
          stockItemIds,
          product,
        };
      }

      continue;
    }

    if (isTestOrder) {
      return { success: true, product };
    }

    if (product.isSold && product.soldOrderId?.toString() === orderId.toString()) {
      return { success: true, product };
    }

    const result = await productCollection.updateOne(
      {
        _id: product._id,
        $or: [{ isSold: { $exists: false } }, { isSold: false }],
      },
      {
        $set: {
          isSold: true,
          soldOrderId: orderId,
          updatedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount > 0) {
      return { success: true, product };
    }
  }

  return {
    success: false,
    error: "Stock assignment conflict during payment completion",
  };
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
  const orderCollection = db.collection<Order>("orders");

  // Auto-detect test orders if not explicitly set
  const isTestOrder = isTest || order.paymentMetadata?.transaction_ref === "test_ref";

  const lockStartedAt = new Date();
  const staleLockBefore = new Date(Date.now() - PAYMENT_COMPLETION_LOCK_TIMEOUT_MS);
  const lockResult = await orderCollection.updateOne(
    {
      _id: objectId,
      status: { $ne: "PAID" },
      $or: [
        { paymentCompletionStartedAt: { $exists: false } },
        { paymentCompletionStartedAt: { $lt: staleLockBefore } },
      ],
    },
    {
      $set: {
        paymentCompletionStartedAt: lockStartedAt,
        updatedAt: lockStartedAt,
      },
      $unset: { paymentCompletionError: "" },
    }
  );

  if (lockResult.modifiedCount === 0) {
    const currentOrder = await orderCollection.findOne({ _id: objectId });
    if (currentOrder?.status === "PAID") {
      await ensureAccessToken(orderId, db);
    }

    return false;
  }

  let productForSideEffects = product;

  try {
    const stockAssignment = await assignStockForPaidOrder({
      orderId: objectId,
      product,
      quantity: quantityToSell,
      db,
      isTestOrder,
    });

    if (!stockAssignment.success) {
      await orderCollection.updateOne(
        { _id: objectId },
        {
          $set: {
            paymentCompletionError:
              stockAssignment.error || "Payment completion failed during stock assignment",
            updatedAt: new Date(),
          },
          $unset: { paymentCompletionStartedAt: "" },
        }
      );
      console.error("[Orders] Payment completed but stock assignment failed:", {
        orderId,
        productId: order.productId.toString(),
        error: stockAssignment.error,
      });
      return false;
    }

    productForSideEffects = stockAssignment.product || product;

    const paidAt = new Date();
    const orderUpdateSet: Partial<Order> & {
      status: "PAID";
      amountPaid: number;
      paidAt: Date;
      updatedAt: Date;
      stockItemId?: string;
      stockItemIds?: string[];
    } = {
      status: "PAID",
      amountPaid: amount,
      paidAt,
      updatedAt: paidAt,
    };

    if (stockAssignment.stockItemId) {
      orderUpdateSet.stockItemId = stockAssignment.stockItemId;
    }

    if (stockAssignment.stockItemIds) {
      orderUpdateSet.stockItemIds = stockAssignment.stockItemIds;
    }

    const paidResult = await orderCollection.updateOne(
      { _id: objectId, status: { $ne: "PAID" } },
      {
        $set: orderUpdateSet,
        $unset: {
          paymentCompletionStartedAt: "",
          paymentCompletionError: "",
        },
      }
    );

    if (paidResult.modifiedCount === 0) {
      await ensureAccessToken(orderId, db);
      return false;
    }
  } catch (error) {
    await orderCollection.updateOne(
      { _id: objectId },
      {
        $set: {
          paymentCompletionError:
            error instanceof Error ? error.message : "Payment completion failed",
          updatedAt: new Date(),
        },
        $unset: { paymentCompletionStartedAt: "" },
      }
    );
    throw error;
  }

  invalidateProductCache(productForSideEffects.slug);

  await ensureAccessToken(orderId, db);

  // Attempt order confirmation email (SKIP IF TEST)
  if (order.customerContact && !isTestOrder) {
    try {
      const emailResult = await sendOrderConfirmationEmail({
        orderId: orderId,
        productTitle: productForSideEffects.title,
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
        await orderCollection.updateOne({ _id: objectId }, { $set: { emailSent: true } });
      } else {
        console.warn("Order confirmation email not sent:", emailResult.error);
      }
    } catch (emailError) {
      console.error("Failed to send order confirmation email:", emailError);
    }
  }

  // Auto-sync audience from paid order
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
      await ensureAccessToken(orderId, db);
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
