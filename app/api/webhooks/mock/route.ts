import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { handleSuccessfulPayment } from "@/lib/orders";

export async function POST(request: Request) {
  // Disable in production for security
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Mock gateway disabled in production" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { orderId, signature } = body;

    // 1. Verify Mock Signature
    // For simplicity, let's say signature must be "MOCK-SIG-{orderId}"
    if (signature !== `MOCK-SIG-${orderId}`) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const client = await getMongoClient();
    const db = client.db();
    const _id = new ObjectId(orderId);

    // 2. Check Order Status
    const order = await db.collection<Order>("orders").findOne({ _id });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency check: if already paid, just return success
    if (order.status === "PAID") {
      return NextResponse.json({ success: true, message: "Already paid" });
    }

    // Get Product
    const product = await db.collection<Product>("products").findOne({ _id: order.productId });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 3. Use shared completion logic
    // This handles order status, stock marking, cache, tokens, and emails
    await handleSuccessfulPayment({
      orderId,
      order,
      product,
      amount: 10000, // Fixed mock amount
      db,
      isTest: true,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
