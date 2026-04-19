import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { Order, Product } from "@/lib/definitions";
import { ObjectId } from "mongodb";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { validate, searchOrderSchema } from "@/lib/validation";

/**
 * POST /api/orders/search
 *
 * Search for orders by order ID or customer email.
 * Returns order details for paid orders only (for security).
 *
 * This endpoint is rate-limited to prevent enumeration attacks.
 */
export async function POST(request: Request) {
  try {
    // Rate limiting (stricter for search to prevent enumeration)
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`order:search:${ip}`, RATE_LIMITS.ORDER_SEARCH);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // Validate input
    const body = await request.json();
    const validation = validate(searchOrderSchema, body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { orderId, email } = validation.data!;
    const client = await getMongoClient();
    const db = client.db();

    const orders: Array<Order & { product?: Product }> = [];

    if (orderId) {
      // Search by order ID - exact match only
      const order = await db.collection<Order>("orders").findOne({
        _id: new ObjectId(orderId),
        status: "PAID", // Only return paid orders
      });

      if (order) {
        // Get product info
        const product = await db.collection<Product>("products").findOne({
          _id: order.productId,
        });

        if (product) {
          orders.push({
            ...order,
            product: {
              ...product,
              contentEncrypted: "", // Never expose encrypted content
            },
          });
        }
      }
    } else if (email) {
      // Search by email - find all matching paid orders
      const matchingOrders = await db
        .collection<Order>("orders")
        .find({
          customerContact: email.toLowerCase().trim(),
          status: "PAID",
        })
        .sort({ createdAt: -1 })
        .limit(10) // Limit results for security
        .toArray();

      // Batch product lookup instead of per-order query
      const productIds = Array.from(
        new Set<string>(matchingOrders.map((o) => o.productId.toString()))
      );
      const productsArr = await db
        .collection<Product>("products")
        .find({ _id: { $in: productIds.map((id) => new ObjectId(id)) } })
        .project<Pick<Product, keyof Product>>({
          contentEncrypted: 0,
          "stockItems.contentEncrypted": 0,
        })
        .toArray();
      const productMap = new Map<string, Product>(
        productsArr.map((p) => [p._id?.toString() ?? "", p])
      );

      for (const order of matchingOrders) {
        const product = productMap.get(order.productId.toString());

        if (product) {
          orders.push({
            ...order,
            product,
          });
        }
      }
    }

    if (orders.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No paid orders found. Please check your order ID or email address.",
          orders: [],
        },
        { status: 404 }
      );
    }

    // Return sanitized order data
    const sanitizedOrders = orders.map((order) => ({
      orderId: order._id?.toString(),
      productTitle: order.product?.title,
      productSlug: order.product?.slug,
      amountPaid: order.amountPaid,
      paidAt: order.updatedAt,
      createdAt: order.createdAt,
    }));

    return NextResponse.json({
      success: true,
      message: `Found ${orders.length} order(s)`,
      orders: sanitizedOrders,
    });
  } catch (error) {
    console.error("Order search error:", error);
    return NextResponse.json({ error: "Search failed. Please try again." }, { status: 500 });
  }
}
