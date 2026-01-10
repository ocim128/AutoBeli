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
            stockItemId: 1,
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
      let decryptedContent = "";

      if (sale.stockItemId && sale.product?.stockItems) {
        // Stock-based order: find the specific stock item
        const stockItem = sale.product.stockItems.find(
          (item: { id: string; contentEncrypted: string }) => item.id === sale.stockItemId
        );
        if (stockItem?.contentEncrypted) {
          try {
            decryptedContent = decryptContent(stockItem.contentEncrypted);
          } catch {
            decryptedContent = "[Failed to decrypt]";
          }
        }
      } else if (sale.product?.contentEncrypted) {
        // Legacy product
        try {
          decryptedContent = decryptContent(sale.product.contentEncrypted);
        } catch {
          decryptedContent = "[Failed to decrypt]";
        }
      }

      return {
        ...sale,
        product: {
          title: sale.product?.title,
          priceIdr: sale.product?.priceIdr,
          content: decryptedContent,
        },
      };
    });

    return NextResponse.json({ sales: salesWithDecryptedContent });
  } catch (error) {
    console.error("Failed to fetch recent sales:", error);
    return NextResponse.json({ error: "Failed to fetch recent sales" }, { status: 500 });
  }
}
