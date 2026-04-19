import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import {
  productHasAvailableStock,
  resolveBroadcastProduct,
  sendProductBroadcast,
} from "@/lib/broadcast";
import { getSession } from "@/lib/auth";
import { broadcastLiveSchema, validate } from "@/lib/validation";
import { checkRateLimit, getClientIP, RATE_LIMITS, verifyAdminPassword } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`admin:broadcast:live:${ip}`, RATE_LIMITS.BROADCAST_LIVE);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = validate(broadcastLiveSchema, body);

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    if (!verifyAdminPassword(validationResult.data!.adminPassword)) {
      return NextResponse.json({ error: "Invalid admin password" }, { status: 403 });
    }

    const client = await getMongoClient();
    const db = client.db();
    const product = await resolveBroadcastProduct(validationResult.data!, db);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: "Broadcast is only allowed for active products" },
        { status: 400 }
      );
    }

    if (!productHasAvailableStock(product)) {
      return NextResponse.json(
        { error: "Broadcast is blocked for sold-out products" },
        { status: 400 }
      );
    }

    const result = await sendProductBroadcast({
      product,
      teaser: validationResult.data!.teaser.trim(),
      db,
    });

    if (result.status === "FAILED") {
      const statusCode =
        result.error?.includes("Recipient count") || result.error?.includes("No eligible")
          ? 400
          : 502;
      return NextResponse.json(
        { error: result.error || "Broadcast failed" },
        { status: statusCode }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Broadcast API] Failed to send live broadcast:", error);
    return NextResponse.json({ error: "Failed to send live broadcast" }, { status: 500 });
  }
}
