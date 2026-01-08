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
        { $match: { status: "PAID" } },
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
            "product.title": 1,
            "product.contentEncrypted": 1,
            "product.priceIdr": 1,
          },
        },
      ])
      .toArray();

    // Decrypt content for admin viewing
    const salesWithDecryptedContent = recentSales.map((sale) => {
      let decryptedContent = "";
      if (sale.product?.contentEncrypted) {
        try {
          decryptedContent = decryptContent(sale.product.contentEncrypted);
        } catch {
          decryptedContent = "[Failed to decrypt]";
        }
      }
      return {
        ...sale,
        product: {
          ...sale.product,
          content: decryptedContent,
          contentEncrypted: undefined, // Remove encrypted content from response
        },
      };
    });

    return NextResponse.json({ sales: salesWithDecryptedContent });
  } catch (error) {
    console.error("Failed to fetch recent sales:", error);
    return NextResponse.json({ error: "Failed to fetch recent sales" }, { status: 500 });
  }
}
