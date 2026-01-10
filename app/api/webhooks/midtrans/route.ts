import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { generateAccessToken } from "@/lib/tokens";
import { validate, midtransNotificationSchema } from "@/lib/validation";
import { verifyNotificationSignature } from "@/lib/midtrans";
import { sendOrderConfirmationEmail } from "@/lib/mailgun";
import { invalidateProductCache } from "@/lib/products";

/**
 * @swagger
 * /api/webhooks/midtrans:
 *   post:
 *     description: Handle Midtrans HTTP notification (webhook)
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
 *       401:
 *         description: Invalid signature
 *       404:
 *         description: Order not found
 */
export async function POST(request: Request) {
  try {
    // Parse and validate body
    const body = await request.json();
    const validation = validate(midtransNotificationSchema, body);

    if (!validation.success) {
      console.error("Midtrans webhook validation error:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const {
      order_id,
      transaction_status,
      gross_amount,
      signature_key,
      status_code,
      payment_type,
      transaction_time,
      fraud_status,
    } = validation.data!;

    // Verify signature
    if (!verifyNotificationSignature(order_id, status_code, gross_amount, signature_key)) {
      console.error("Midtrans webhook: Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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

    // Handle different transaction statuses
    // For card transactions with fraud detection: capture + accept = success
    // For other payment types: settlement = success
    const isPaid =
      transaction_status === "settlement" ||
      (transaction_status === "capture" && fraud_status === "accept");

    const isExpired = ["expire", "cancel", "deny", "failure"].includes(transaction_status);

    if (isPaid) {
      // Parse gross amount to number
      const amount = parseFloat(gross_amount);

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
              provider: "midtrans",
              payment_method: payment_type,
              payment_time: transaction_time,
            },
          },
        }
      );

      // Mark product/stock item as sold
      const product = await db.collection<Product>("products").findOne({ _id: order.productId });

      if (product?.stockItems && product.stockItems.length > 0) {
        // Stock-based product
        const unsoldItemIndex = product.stockItems.findIndex((item) => !item.isSold);

        if (unsoldItemIndex !== -1) {
          const stockItemId = product.stockItems[unsoldItemIndex].id;

          await db.collection<Product>("products").updateOne(
            { _id: order.productId },
            {
              $set: {
                [`stockItems.${unsoldItemIndex}.isSold`]: true,
                [`stockItems.${unsoldItemIndex}.soldAt`]: new Date(),
                [`stockItems.${unsoldItemIndex}.orderId`]: orderId,
                updatedAt: new Date(),
              },
            }
          );

          await db
            .collection<Order>("orders")
            .updateOne({ _id: orderId }, { $set: { stockItemId } });

          const remainingStock = product.stockItems.filter(
            (item, idx) => idx !== unsoldItemIndex && !item.isSold
          ).length;

          if (remainingStock === 0) {
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
        } catch (emailError) {
          console.error("Failed to send order confirmation email:", emailError);
        }
      }

      return NextResponse.json({ success: true });
    } else if (isExpired) {
      // Update order to EXPIRED
      await db.collection<Order>("orders").updateOne(
        { _id: orderId },
        {
          $set: {
            status: "EXPIRED",
            updatedAt: new Date(),
          },
        }
      );

      return NextResponse.json({ success: true });
    }

    // For PENDING or other statuses, just acknowledge
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Midtrans webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
