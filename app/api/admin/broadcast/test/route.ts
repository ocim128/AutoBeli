import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { sendProductBroadcastTest, resolveBroadcastProduct } from "@/lib/broadcast";
import { normalizeEmail } from "@/lib/audience";
import { broadcastTestSchema, validate } from "@/lib/validation";
import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`admin:broadcast:test:${ip}`, RATE_LIMITS.BROADCAST_TEST);

  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validationResult = validate(broadcastTestSchema, body);

    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db();
    const product = await resolveBroadcastProduct(validationResult.data!, db);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const result = await sendProductBroadcastTest({
      product,
      teaser: validationResult.data!.teaser.trim(),
      targetEmail: normalizeEmail(validationResult.data!.targetEmail),
      db,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send test email" },
        { status: 502 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[Broadcast API] Failed to send test broadcast:", error);
    return NextResponse.json({ error: "Failed to send test broadcast" }, { status: 500 });
  }
}
