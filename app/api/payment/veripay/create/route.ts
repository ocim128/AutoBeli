import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { validate, veripayPaymentSchema } from "@/lib/validation";
import { createPaymentRequest, isVeripayConfigured } from "@/lib/veripay";

export async function POST(request: Request) {
  try {
    // Check if Veripay is configured
    if (!isVeripayConfigured()) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 });
    }

    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`payment:veripay:${ip}`, RATE_LIMITS.ORDER_CREATE);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = validate(veripayPaymentSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { orderId } = validation.data!;
    const client = await clientPromise;
    const db = client.db();

    // Get order with product info
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

    // Build customer detail - Veripay requires name, phone, AND email
    // Customer provides email as contact; we use default phone since Veripay requires it
    const customerDetail = {
      name: "Customer", // Default name (required by Veripay)
      email: order.customerContact || `${orderId}@akunlama.com`, // Customer email or fallback
      phone: "08000000000", // Default phone (required by Veripay)
    };

    // Create payment with Veripay
    const paymentResponse = await createPaymentRequest({
      order_id: orderId,
      amount: product.priceIdr,
      description: `Payment for ${product.title}`,
      return_url: returnUrl,
      product_detail: [
        {
          name: product.title,
          price: product.priceIdr,
          qty: 1,
        },
      ],
      customer_detail: customerDetail,
    });

    if (!paymentResponse.success || !paymentResponse.data) {
      console.error("Veripay payment creation failed:", paymentResponse);
      return NextResponse.json(
        { error: paymentResponse.message || "Failed to create payment" },
        { status: 500 }
      );
    }

    // Store transaction reference in order
    await db.collection<Order>("orders").updateOne(
      { _id: new ObjectId(orderId) },
      {
        $set: {
          updatedAt: new Date(),
          paymentMetadata: {
            provider: "veripay",
            transaction_ref: paymentResponse.data.transaction_ref,
          },
        },
      }
    );

    return NextResponse.json({
      success: true,
      payment_url: paymentResponse.data.payment_url,
      transaction_ref: paymentResponse.data.transaction_ref,
    });
  } catch (error) {
    console.error("Veripay payment error:", error);
    return NextResponse.json({ error: "Payment creation failed" }, { status: 500 });
  }
}
