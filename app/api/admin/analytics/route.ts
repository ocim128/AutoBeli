import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics
 * Returns daily revenue and top products for the admin dashboard.
 */
export async function GET(request: Request) {
  // Rate limit
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`admin:analytics:${ip}`, RATE_LIMITS.API_GENERAL);

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

    // Calculate dates for the last 7 days
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Base filter to exclude test orders
    const testOrderFilter = {
      status: "PAID",
      customerContact: {
        $exists: true,
        $ne: null,
        $type: "string",
        $regex: "@",
        $nin: ["customer@example.com"],
      },
      "paymentMetadata.transaction_ref": { $ne: "test_ref" },
    };

    // 1. Daily Revenue (Last 7 Days)
    const dailyRevenue = await db
      .collection("orders")
      .aggregate([
        {
          $match: {
            ...testOrderFilter,
            paidAt: { $gte: sevenDaysAgo, $lte: today },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$paidAt" } },
            revenue: { $sum: "$amountPaid" },
            orders: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Fill in missing days with zero revenue
    const filledDailyRevenue = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const existing = dailyRevenue.find((r) => r._id === dateStr);
      filledDailyRevenue.push({
        date: dateStr,
        revenue: existing ? existing.revenue : 0,
        orders: existing ? existing.orders : 0,
      });
    }

    // 2. Top Products by Revenue
    const topProducts = await db
      .collection("orders")
      .aggregate([
        {
          $match: testOrderFilter,
        },
        {
          $group: {
            _id: "$productId",
            revenue: { $sum: "$amountPaid" },
            quantity: { $sum: { $ifNull: ["$quantity", 1] } },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 0,
            productId: "$_id",
            title: "$product.title",
            revenue: 1,
            quantity: 1,
            orderCount: 1,
          },
        },
      ])
      .toArray();

    // 3. Summary Stats
    const summary = await db
      .collection("orders")
      .aggregate([
        {
          $match: testOrderFilter,
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amountPaid" },
            totalOrders: { $sum: 1 },
            avgOrderValue: { $avg: "$amountPaid" },
          },
        },
      ])
      .toArray();

    const statsSummary =
      summary.length > 0
        ? summary[0]
        : {
            totalRevenue: 0,
            totalOrders: 0,
            avgOrderValue: 0,
          };

    return NextResponse.json({
      dailyRevenue: filledDailyRevenue,
      topProducts,
      summary: {
        totalRevenue: statsSummary.totalRevenue,
        totalOrders: statsSummary.totalOrders,
        avgOrderValue: Math.round(statsSummary.avgOrderValue),
      },
    });
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
