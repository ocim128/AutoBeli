import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";
import { decryptContent } from "@/lib/crypto";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/recent-sales
 * Fetches the most recent paid orders for the admin dashboard.
 * Returns up to 5 recent sales with product info and decrypted content.
 */
export async function GET(request: Request) {
  // Rate limit
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`admin:recent-sales:${ip}`, RATE_LIMITS.API_GENERAL);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db();

    // Fetch only PAID orders, sorted by paidAt (most recent first)
    const recentSales = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            status: "PAID",
            customerContact: { $exists: true, $ne: null, $type: "string", $regex: "@" },
            "paymentMetadata.transaction_ref": { $ne: "test_ref" },
          },
        },
        { $sort: { paidAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1,
            amountPaid: 1,
            paidAt: 1,
            createdAt: 1,
            customerContact: 1,
            paymentGateway: 1,
            quantity: 1,
            stockItemId: 1,
            stockItemIds: 1,
            "product.title": 1,
            "product.contentEncrypted": 1,
            "product.stockItems": 1,
            "product.priceIdr": 1,
          },
        },
      ])
      .toArray();

    // Decrypt content for admin viewing
    const salesWithDecryptedContent = recentSales.map((sale) => {
      const contents: string[] = [];

      if (sale.stockItemIds && sale.stockItemIds.length > 0 && sale.product?.stockItems) {
        // Multi-stock order: find and decrypt all relevant items
        const itemIds = sale.stockItemIds;
        const purchasedItems = sale.product.stockItems.filter(
          (item: { id: string; contentEncrypted?: string }) => itemIds.includes(item.id)
        );
        purchasedItems.forEach((item: { contentEncrypted?: string }) => {
          if (item.contentEncrypted) {
            try {
              contents.push(decryptContent(item.contentEncrypted));
            } catch {
              contents.push("[Failed to decrypt]");
            }
          }
        });
      } else if (sale.stockItemId && sale.product?.stockItems) {
        // Single-stock order: find the specific stock item
        const stockItem = sale.product.stockItems.find(
          (item: { id: string; contentEncrypted: string }) => item.id === sale.stockItemId
        );
        if (stockItem?.contentEncrypted) {
          try {
            contents.push(decryptContent(stockItem.contentEncrypted));
          } catch {
            contents.push("[Failed to decrypt]");
          }
        }
      } else if (sale.product?.contentEncrypted) {
        // Legacy product
        try {
          contents.push(decryptContent(sale.product.contentEncrypted));
        } catch {
          contents.push("[Failed to decrypt]");
        }
      }

      return {
        ...sale,
        product: {
          title: sale.product?.title,
          priceIdr: sale.product?.priceIdr,
          content: contents.join("\n\n---\n\n"),
        },
      };
    });

    return NextResponse.json({ sales: salesWithDecryptedContent });
  } catch (error) {
    console.error("Failed to fetch recent sales:", error);
    return NextResponse.json({ error: "Failed to fetch recent sales" }, { status: 500 });
  }
}
