import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { validate, pakasirPaymentSchema } from "@/lib/validation";
import { createPakasirTransaction, isPakasirConfigured } from "@/lib/pakasir";

/**
 * @swagger
 * /api/payment/pakasir/create:
 *   post:
 *     description: Create a Pakasir payment transaction
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment URL returned
 *       404:
 *         description: Order not found
 *       503:
 *         description: Payment gateway not configured
 */
export async function POST(request: Request) {
  try {
    // Check if Pakasir is configured
    if (!isPakasirConfigured()) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`payment:pakasir:${ip}`, RATE_LIMITS.ORDER_CREATE);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = validate(pakasirPaymentSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { orderId } = validation.data!;
    const client = await clientPromise;
    const db = client.db();

    // Get order
    const order = await db.collection<Order>("orders").findOne({
      _id: new ObjectId(orderId),
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json({ error: "Order is not pending payment" }, { status: 400 });
    }

    // Get product details
    const product = await db.collection<Product>("products").findOne({
      _id: order.productId,
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create transaction with Pakasir
    // We use the URL integration method so we just need to return the URL
    // No need to persist a token like in Midtrans as we just use orderID
    const quantity = order.quantity || 1;
    const totalAmount = product.priceIdr * quantity;

    const transactionResult = await createPakasirTransaction({
      order_id: orderId,
      amount: totalAmount,
    });

    if (!transactionResult.success || !transactionResult.payment_url) {
      console.error("Pakasir transaction creation failed:", transactionResult.error);
      return NextResponse.json(
        { error: transactionResult.error || "Failed to create payment" },
        { status: 500 }
      );
    }

    // Store transaction info in order (to know it was initiated via Pakasir)
    await db.collection<Order>("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          updatedAt: new Date(),
          paymentMetadata: {
            provider: "pakasir",
            transaction_ref: orderId, // Pakasir uses order_id as key ref
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      payment_url: transactionResult.payment_url,
    });
  } catch (error) {
    console.error("Pakasir payment error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
