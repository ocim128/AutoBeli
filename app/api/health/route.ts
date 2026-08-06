import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { getPaymentGateway } from "@/lib/paymentGateway";
import { isQrisConfigured } from "@/lib/qris";

import { checkRateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

export async function GET(request: Request) {
  // Basic protection against health check spam
  const ip = getClientIP(request);
  const rateLimitResult = checkRateLimit(`health:${ip}`, RATE_LIMITS.API_GENERAL);

  if (!rateLimitResult.success) {
    return NextResponse.json({ status: "busy" }, { status: 429 });
  }

  // Surface gateway configuration status so misconfigurations are visible at
  // the health endpoint (no secrets are exposed). In production, an invalid or
  // partially-configured gateway throws here.
  let gateway: { configured: boolean; gateway: string; error?: string };
  let gatewayMisconfigured = false;
  try {
    const resolved = getPaymentGateway();
    const configured = resolved !== "QRIS" || isQrisConfigured();
    gateway = { configured, gateway: resolved };
  } catch (e) {
    gatewayMisconfigured = true;
    gateway = {
      configured: false,
      gateway: process.env.PAYMENT_GATEWAY?.trim().toUpperCase() || "unset",
      error: e instanceof Error ? e.message : "Gateway configuration invalid",
    };
  }

  try {
    const client = await getMongoClient();
    // Just a quick ping to see if we can talk to the server
    await client.db("admin").command({ ping: 1 });

    // In production, a misconfigured gateway makes the deployment unusable for
    // new orders even if the database is reachable. Report 503 so the host
    // (e.g. Render) does not mark an unusable deployment healthy.
    const httpStatus = process.env.NODE_ENV === "production" && gatewayMisconfigured ? 503 : 200;
    return NextResponse.json(
      { status: gatewayMisconfigured ? "degraded" : "ok", database: "connected", gateway },
      { status: httpStatus }
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { status: "error", database: "disconnected", gateway },
      { status: 500 }
    );
  }
}
