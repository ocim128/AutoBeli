import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { validate, midtransPaymentSchema } from "@/lib/validation";
import { createTransaction, isMidtransConfigured } from "@/lib/midtrans";

/**
 * @swagger
 * /api/payment/midtrans/create:
 *   post:
 *     description: Create a Midtrans Snap payment transaction
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
    // Check if Midtrans is configured
    if (!isMidtransConfigured()) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`payment:midtrans:${ip}`, RATE_LIMITS.ORDER_CREATE);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = validate(midtransPaymentSchema, body);

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

    // Build return URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const returnUrl = `${baseUrl}/order/${orderId}`;

    // Create transaction with Midtrans
    const transactionResult = await createTransaction({
      order_id: orderId,
      gross_amount: product.priceIdr,
      item_details: [
        {
          id: product.slug,
          name: product.title,
          price: product.priceIdr,
          quantity: 1,
        },
      ],
      customer_details: {
        email: order.customerContact || `${orderId}@customer.local`,
        first_name: "Customer",
      },
      callbacks: {
        finish: returnUrl,
      },
    });

    if (!transactionResult.success || !transactionResult.data) {
      console.error("Midtrans transaction creation failed:", transactionResult.error);
      return NextResponse.json(
        { error: transactionResult.error || "Failed to create payment" },
        { status: 500 }
      );
    }

    // Store transaction info in order
    await db.collection<Order>("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          updatedAt: new Date(),
          paymentMetadata: {
            provider: "midtrans",
            transaction_ref: transactionResult.data.token,
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      payment_url: transactionResult.data.redirect_url,
      token: transactionResult.data.token,
    });
  } catch (error) {
    console.error("Midtrans payment error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
