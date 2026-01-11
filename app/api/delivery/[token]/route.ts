import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { AccessToken, Product, Order } from "@/lib/definitions";
import { decryptContent } from "@/lib/crypto";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  // IP-based Rate Limiting (Lightweight protection)
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`delivery:${ip}`, RATE_LIMITS.DELIVERY);

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

  try {
    const client = await clientPromise;
    const db = client.db();

    // 1. Validate Token
    const tokenDoc = await db.collection<AccessToken>("tokens").findOne({ token });

    if (!tokenDoc) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
    }

    // 2. Rate Limiting (Basic)
    // In a real app, use Redis. Here, we check lastAccessedAt inside DB.
    const now = new Date();
    if (tokenDoc.lastAccessedAt) {
      const timeDiff = now.getTime() - new Date(tokenDoc.lastAccessedAt).getTime();
      if (timeDiff < 2000) {
        // 2 seconds cooldown
        return NextResponse.json({ error: "Rate limit exceeded. Please wait." }, { status: 429 });
      }
    }

    // 3. Get Order & Product
    const order = await db.collection<Order>("orders").findOne({ _id: tokenDoc.orderId });
    if (!order || order.status !== "PAID") {
      return NextResponse.json({ error: "Payment not confirmed" }, { status: 403 });
    }

    const product = await db.collection<Product>("products").findOne({ _id: order.productId });
    if (!product) {
      return NextResponse.json({ error: "Content unavailable" }, { status: 404 });
    }

    // 4. Decrypt Content - handle both stock items (multi & single) and legacy content
    let content = "";
    try {
      const contents: string[] = [];

      // Check for multi-item order first
      if (order.stockItemIds && order.stockItemIds.length > 0 && product.stockItems) {
        // Retrieve and decrypt each purchased item
        const itemIds = order.stockItemIds;
        const purchasedItems = product.stockItems.filter((item) => itemIds.includes(item.id));
        purchasedItems.forEach((item) => {
          if (item.contentEncrypted) {
            contents.push(decryptContent(item.contentEncrypted));
          }
        });
      }
      // Check for single stock item (legacy or fallback)
      else if (order.stockItemId && product.stockItems) {
        const stockItem = product.stockItems.find((item) => item.id === order.stockItemId);
        if (stockItem && stockItem.contentEncrypted) {
          contents.push(decryptContent(stockItem.contentEncrypted));
        }
      }
      // Check for legacy product content
      else if (product.contentEncrypted) {
        contents.push(decryptContent(product.contentEncrypted));
      }

      if (contents.length === 0) {
        return NextResponse.json({ error: "Content unavailable" }, { status: 404 });
      }

      // Format final content with template if exists
      const decryptedContent = contents.join("\n\n---\n\n");

      if (product.postPurchaseTemplate) {
        const template = product.postPurchaseTemplate.replace(/{productTitle}/g, product.title);
        content = `${template}\n\n${decryptedContent}`;
      } else {
        content = decryptedContent;
      }
    } catch (e) {
      console.error("Decryption failed", e);
      return NextResponse.json({ error: "Decryption error" }, { status: 500 });
    }

    // 5. Update Usage Metrics
    await db.collection<AccessToken>("tokens").updateOne(
      { _id: tokenDoc._id },
      {
        $inc: { usageCount: 1 },
        $set: { lastAccessedAt: now },
      }
    );

    // 6. Return Content via Secure Headers
    return new NextResponse(JSON.stringify({ content }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }
}
