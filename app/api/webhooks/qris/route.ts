import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/db";
import { validate, qrisWebhookSchema } from "@/lib/validation";
import {
  isQrisSettlementTimestampValid,
  isQrisWebhookConfigured,
  normalizeQrisTimestamp,
  verifyQrisWebhookSignature,
} from "@/lib/qris";
import { processQrisPaymentEvent } from "@/lib/orders";

/**
 * @swagger
 * /api/webhooks/qris:
 *   post:
 *     description: Handle a signed Qris payment status notification (webhook)
 *     tags: [Webhooks]
 *     parameters:
 *       - in: header
 *         name: X-Signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Lowercase-hex HMAC-SHA256 over the raw request body
 *       - in: query
 *         name: attempt
 *         required: false
 *         schema:
 *           type: string
 *         description: Opaque creation-attempt nonce set at payment creation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_id
 *               - payment_status
 *               - amount
 *             properties:
 *               payment_id:
 *                 type: string
 *               payment_status:
 *                 type: string
 *                 enum: [paid, expired]
 *               amount:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Notification processed (including duplicates and stale IDs)
 *       400:
 *         description: Signed body failed validation
 *       401:
 *         description: Missing or invalid signature
 *       413:
 *         description: Request body too large
 *       500:
 *         description: Transient processing failure; the provider may retry
 */

const MAX_BODY_BYTES = 16 * 1024;

async function readRawBody(request: Request, maxBytes: number): Promise<Buffer> {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("PAYLOAD_TOO_LARGE");
  }

  if (!request.body) return Buffer.alloc(0);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error("PAYLOAD_TOO_LARGE");
    }
    chunks.push(value);
  }

  return Buffer.concat(chunks);
}

function normalizeExpiresAt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value < 1e12 ? Math.round(value * 1000) : Math.round(value);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

export async function POST(request: Request) {
  try {
    if (!isQrisWebhookConfigured()) {
      console.error("[Qris] Webhook received but QRIS_WEBHOOK_HMAC_KEY is not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
    }

    // Read the raw bytes before any parsing; the signature covers them exactly.
    let rawBody: Buffer;
    try {
      rawBody = await readRawBody(request, MAX_BODY_BYTES);
    } catch {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const signature = request.headers.get("x-signature");
    if (!verifyQrisWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let parsedBody: unknown;
    try {
      parsedBody = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
    }

    // X-Event is advisory and unsigned; only the signed payment_status field
    // is used for authorization and routing.
    const validation = validate(qrisWebhookSchema, parsedBody);
    if (!validation.success) {
      console.error("[Qris] Webhook body failed validation:", validation.error);
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { payment_id, payment_status, amount, paid_amount } = validation.data!;
    const providerCreatedAt = normalizeQrisTimestamp(validation.data!.created_at);
    const providerTransactionTime = normalizeQrisTimestamp(
      validation.data!.provider_transaction?.transaction_time
    );

    if (
      payment_status === "paid" &&
      !isQrisSettlementTimestampValid(
        providerCreatedAt,
        providerTransactionTime,
        validation.data!.paid_at
      )
    ) {
      console.error("[Qris] Rejected paid webhook with stale or missing provider transaction time");
      return NextResponse.json({ success: true, result: "ignored" });
    }

    const attempt = new URL(request.url).searchParams.get("attempt") || undefined;

    const client = await getMongoClient();
    const db = client.db();

    // Await the settlement update; a serverless route must not fire-and-forget.
    const result = await processQrisPaymentEvent(
      {
        paymentId: payment_id,
        status: payment_status,
        amount,
        paidAmount: paid_amount,
        paidAt: normalizeExpiresAt(validation.data!.paid_at),
        expiresAt: normalizeExpiresAt(validation.data!.expires_at),
        providerCreatedAt,
        providerTransactionTime,
        attempt,
      },
      db
    );

    if (result === "error") {
      // Transient: AutoBeli could not safely determine the outcome.
      return NextResponse.json({ error: "Processing failed, please retry" }, { status: 500 });
    }

    // Duplicates, unknown/stale payment IDs, and rejected amount mismatches are
    // permanent data conditions: acknowledge so Qris does not retry them.
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Qris webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
