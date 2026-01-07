import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { Product, Order } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { validate, createOrderSchema, updateOrderContactSchema } from "@/lib/validation";

/**
 * @swagger
 * /api/orders:
 *   post:
 *     description: Create a new order for a product
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slug
 *             properties:
 *               slug:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order created
 *       404:
 *         description: Product not found
 *       410:
 *         description: Product already sold
 *   patch:
 *     description: Update order with customer contact info
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - contact
 *             properties:
 *               orderId:
 *                 type: string
 *               contact:
 *                 type: string
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Invalid input
 */

export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`order:create:${ip}`, RATE_LIMITS.ORDER_CREATE);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetAt.toString(),
          },
        }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = validate(createOrderSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { slug } = validation.data!;

    const client = await clientPromise;
    const db = client.db();

    // Additional DB-based rate limit (global safety cap)
    const recentOrders = await db.collection<Order>("orders").countDocuments({
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) },
      status: "PENDING",
    });

    if (recentOrders > 50) {
      return NextResponse.json({ error: "System busy. Try again later." }, { status: 429 });
    }

    // Get Product (only active, check sold status in code to avoid second query)
    const product = await db.collection<Product>("products").findOne({ slug, isActive: true });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check if product is sold (avoids second DB query)
    if (product.isSold) {
      return NextResponse.json({ error: "Product has already been sold" }, { status: 410 });
    }

    // Create Order (PENDING)
    const gateway = (process.env.PAYMENT_GATEWAY || "MOCK") as "MOCK" | "VERIPAY";
    const newOrder: Order = {
      productId: product._id!,
      status: "PENDING",
      amountPaid: 0,
      paymentGateway: gateway,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection<Order>("orders").insertOne(newOrder);

    return NextResponse.json(
      {
        success: true,
        orderId: result.insertedId.toString(),
      },
      {
        headers: {
          "X-RateLimit-Limit": rateLimitResult.limit.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        },
      }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Rate limiting (use same as order creation)
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`order:update:${ip}`, RATE_LIMITS.ORDER_CREATE);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = validate(updateOrderContactSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { orderId, contact } = validation.data!;

    const client = await clientPromise;
    const db = client.db();

    await db
      .collection<Order>("orders")
      .updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { customerContact: contact || undefined } }
      );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
