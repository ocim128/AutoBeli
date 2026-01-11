import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { generateAccessToken } from "@/lib/tokens";
import { validate, pakasirWebhookSchema } from "@/lib/validation";
import { getPakasirTransactionStatus } from "@/lib/pakasir";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";
import { invalidateProductCache } from "@/lib/products";

/**
 * @swagger
 * /api/webhooks/pakasir:
 *   post:
 *     description: Handle Pakasir HTTP notification (webhook)
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Notification processed
 *       404:
 *         description: Order not found
 */
export async function POST(request: Request) {
  try {
    // Parse and validate body
    const body = await request.json();
    const validation = validate(pakasirWebhookSchema, body);

    if (!validation.success) {
      console.error("Pakasir webhook validation error:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      order_id,
      amount,
      // status, // Unused
      payment_method,
      completed_at,
    } = validation.data!;

    // Verify transaction status with Pakasir API to be safe
    const verification = await getPakasirTransactionStatus(order_id, amount);

    if (!verification.success || !verification.data) {
      console.error("Pakasir webhook: Transaction verification failed");
      // We accept the webhook 200 to stop retries, but log error
      return NextResponse.json({ success: true, message: "Verification failed" });
    }

    const verifiedStatus = verification.data.transaction.status;

    if (verifiedStatus !== "completed") {
      return NextResponse.json({ success: true, message: "Not completed" });
    }

    const client = await clientPromise;
    const db = client.db();

    // Find order by ID
    let orderId: ObjectId;
    try {
      orderId = new ObjectId(order_id);
    } catch {
      return NextResponse.json({ error: "Invalid order ID format" }, { status: 400 });
    }

    const order = await db.collection<Order>("orders").findOne({ _id: orderId });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency: if already paid, return success
    if (order.status === "PAID") {
      return NextResponse.json({ success: true, message: "Already paid" });
    }

    // Update order to PAID
    await db.collection<Order>("orders").updateOne(
      { _id: orderId },
      {
        $set: {
          status: "PAID",
          amountPaid: amount,
          paidAt: new Date(),
          updatedAt: new Date(),
          paymentMetadata: {
            ...order.paymentMetadata,
            provider: "pakasir",
            payment_method: payment_method,
            payment_time: completed_at || new Date().toISOString(),
          },
        },
      }
    );

    // Mark product/stock item as sold
    const product = await db.collection<Product>("products").findOne({ _id: order.productId });

    if (product?.stockItems && product.stockItems.length > 0) {
      // Stock-based product: Find the N unsold stock items
      const quantityToSell = order.quantity || 1;
      const unsoldIndices = product.stockItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !item.isSold)
        .slice(0, quantityToSell)
        .map(({ index }) => index);

      if (unsoldIndices.length > 0) {
        const soldStockItemIds: string[] = [];
        const updateSet: Record<string, boolean | Date | ObjectId> = { updatedAt: new Date() };

        unsoldIndices.forEach((index) => {
          const stockItem = product.stockItems![index];
          soldStockItemIds.push(stockItem.id);
          updateSet[`stockItems.${index}.isSold`] = true;
          updateSet[`stockItems.${index}.soldAt`] = new Date();
          updateSet[`stockItems.${index}.orderId`] = orderId;
        });

        await db
          .collection<Product>("products")
          .updateOne({ _id: order.productId }, { $set: updateSet });

        await db.collection<Order>("orders").updateOne(
          { _id: orderId },
          {
            $set: {
              stockItemId: soldStockItemIds[0],
              stockItemIds: soldStockItemIds,
            },
          }
        );

        const totalStock = product.stockItems.length;
        const previousSold = product.stockItems.filter((i) => i.isSold).length;
        const nowSold = previousSold + unsoldIndices.length;

        if (nowSold >= totalStock) {
          await db
            .collection<Product>("products")
            .updateOne({ _id: order.productId }, { $set: { isSold: true } });
        }
      }
    } else {
      // Legacy product
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

    // Invalidate product cache
    invalidateProductCache();

    // Generate access token for content
    await generateAccessToken(order_id);

    // Send order confirmation email
    if (order.customerContact && product) {
      try {
        await sendOrderConfirmationEmail({
          orderId: order_id,
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

        // Mark email as sent
        await db
          .collection<Order>("orders")
          .updateOne({ _id: orderId }, { $set: { emailSent: true } });
      } catch (emailError) {
        console.error("Failed to send order confirmation email:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pakasir webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
