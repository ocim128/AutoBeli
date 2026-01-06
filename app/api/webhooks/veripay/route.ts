import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { Order } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { generateAccessToken } from "@/lib/tokens";
import { validate, veripayWebhookSchema } from "@/lib/validation";
import { verifyWebhookSignature } from "@/lib/veripay";

export async function POST(request: Request) {
  try {
    // Get signature from headers
    const timestamp = request.headers.get("x-timestamp");
    const signature = request.headers.get("x-signature");

    if (!timestamp || !signature) {
      return NextResponse.json({ error: "Missing authentication headers" }, { status: 401 });
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(signature, timestamp)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse and validate body
    const body = await request.json();
    const validation = validate(veripayWebhookSchema, body);

    if (!validation.success) {
      console.error("Veripay webhook validation error:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { order_id, status, amount, payment_method, payment_time } = validation.data!;

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

    // Handle different statuses
    if (status === "PAID") {
      // Update order to PAID
      await db.collection<Order>("orders").updateOne(
        { _id: orderId },
        {
          $set: {
            status: "PAID",
            amountPaid: amount,
            updatedAt: new Date(),
            paymentMetadata: {
              ...order.paymentMetadata,
              provider: "veripay",
              payment_method,
              payment_time,
            },
          },
        }
      );

      // Generate access token for content
      await generateAccessToken(order_id);

      return NextResponse.json({ success: true });
    } else if (status === "EXPIRED" || status === "FAILED") {
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

    // For PENDING status, just acknowledge
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Veripay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
