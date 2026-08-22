/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";

const mockProcessQrisPaymentEvent = vi.fn();

vi.mock("@/lib/orders", () => ({
  processQrisPaymentEvent: (...args: unknown[]) => mockProcessQrisPaymentEvent(...args),
}));

vi.mock("@/lib/db", () => ({
  getMongoClient: vi.fn(async () => ({ db: () => ({}) })),
}));

import { POST } from "@/app/api/webhooks/qris/route";

const HMAC_KEY = "test-webhook-hmac";
const originalEnv = { ...process.env };

function sign(rawBody: string): string {
  return crypto.createHmac("sha256", HMAC_KEY).update(rawBody).digest("hex");
}

function webhookRequest(
  rawBody: string,
  options: { signature?: string | null; url?: string } = {}
): Request {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (options.signature !== null) {
    headers.set("x-signature", options.signature ?? sign(rawBody));
  }
  return new Request(options.url ?? "http://localhost/api/webhooks/qris", {
    method: "POST",
    headers,
    body: rawBody,
  });
}

// Mirrors the real Qris/Gopay paid-webhook shape: numeric epoch-ms paid_at,
// no paid_amount in the event body (settlement amount lives on the REST record).
const PAID_BODY = JSON.stringify({
  payment_id: "pay_abc",
  payment_status: "paid",
  amount: 25123,
  created_at: 1735689500000,
  paid_at: 1735689600000,
  provider_transaction: {
    acquirer: "gopay",
    transaction_time: "2025-01-01T00:00:01.000Z",
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.QRIS_API_BASE_URL = "https://qris.example.com";
  process.env.QRIS_API_KEY = "test-key";
  process.env.QRIS_WEBHOOK_HMAC_KEY = HMAC_KEY;
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("POST /api/webhooks/qris", () => {
  it("rejects a missing signature with 401", async () => {
    const res = await POST(webhookRequest(PAID_BODY, { signature: null }));
    expect(res.status).toBe(401);
    expect(mockProcessQrisPaymentEvent).not.toHaveBeenCalled();
  });

  it("rejects an invalid signature with 401", async () => {
    const res = await POST(webhookRequest(PAID_BODY, { signature: "0".repeat(64) }));
    expect(res.status).toBe(401);
    expect(mockProcessQrisPaymentEvent).not.toHaveBeenCalled();
  });

  it("rejects a signature that does not cover the exact raw body", async () => {
    const signed = sign(PAID_BODY);
    const tampered = PAID_BODY.replace("25123", "25000");
    const res = await POST(webhookRequest(tampered, { signature: signed }));
    expect(res.status).toBe(401);
  });

  it("bounds the raw body size before parsing", async () => {
    const huge = " ".repeat(17 * 1024);
    const res = await POST(webhookRequest(huge));
    expect(res.status).toBe(413);
  });

  it("rejects malformed JSON with 400 when the signature is valid", async () => {
    const body = "not json";
    const res = await POST(webhookRequest(body));
    expect(res.status).toBe(400);
  });

  it("rejects a signed body that fails schema validation", async () => {
    const body = JSON.stringify({ payment_id: "pay_abc", payment_status: "pending", amount: 1 });
    const res = await POST(webhookRequest(body));
    expect(res.status).toBe(400);
    expect(mockProcessQrisPaymentEvent).not.toHaveBeenCalled();
  });

  it("rejects a signed webhook that declares a non-IDR currency", async () => {
    const body = JSON.stringify({
      payment_id: "pay_abc",
      payment_status: "paid",
      amount: 25123,
      currency: "USD",
    });

    const res = await POST(webhookRequest(body));

    expect(res.status).toBe(400);
    expect(mockProcessQrisPaymentEvent).not.toHaveBeenCalled();
  });

  it("routes a valid paid event through the shared processor with the attempt nonce", async () => {
    mockProcessQrisPaymentEvent.mockResolvedValueOnce("paid");

    const res = await POST(
      webhookRequest(PAID_BODY, {
        url: "http://localhost/api/webhooks/qris?attempt=nonce-1",
      })
    );

    expect(res.status).toBe(200);
    expect(mockProcessQrisPaymentEvent).toHaveBeenCalledWith(
      {
        paymentId: "pay_abc",
        status: "paid",
        amount: 25123,
        paidAmount: undefined,
        paidAt: 1735689600000,
        expiresAt: undefined,
        providerCreatedAt: 1735689500000,
        providerTransactionTime: 1735689601000,
        attempt: "nonce-1",
      },
      expect.anything()
    );
  });

  it("accepts a paid webhook that omits paid_amount (matches Gopay payload)", async () => {
    mockProcessQrisPaymentEvent.mockResolvedValueOnce("paid");

    const res = await POST(webhookRequest(PAID_BODY));

    expect(res.status).toBe(200);
    expect(mockProcessQrisPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: "paid", paidAmount: undefined }),
      expect.anything()
    );
  });

  it("acknowledges but ignores a paid webhook with a historical transaction", async () => {
    const body = JSON.stringify({
      payment_id: "pay_abc",
      payment_status: "paid",
      amount: 25123,
      created_at: "2026-08-22T13:08:41.000Z",
      paid_at: "2026-08-22T13:08:45.000Z",
      provider_transaction: {
        transaction_time: "2026-08-22T08:32:02+07:00",
      },
    });

    const res = await POST(webhookRequest(body));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true, result: "ignored" });
    expect(mockProcessQrisPaymentEvent).not.toHaveBeenCalled();
  });

  it("normalizes epoch-second expires_at values to milliseconds", async () => {
    mockProcessQrisPaymentEvent.mockResolvedValueOnce("expired");

    const body = JSON.stringify({
      payment_id: "pay_abc",
      payment_status: "expired",
      amount: 25123,
      expires_at: 1735689600,
    });

    const res = await POST(webhookRequest(body));

    expect(res.status).toBe(200);
    expect(mockProcessQrisPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: "expired", expiresAt: 1735689600 * 1000 }),
      expect.anything()
    );
  });

  it("returns 2xx for duplicates, stale IDs, and amount mismatches", async () => {
    for (const result of ["already_paid", "already_expired", "ignored", "expired", "paid"]) {
      mockProcessQrisPaymentEvent.mockResolvedValueOnce(result);
      const res = await POST(webhookRequest(PAID_BODY));
      expect(res.status).toBe(200);
    }
  });

  it("returns 5xx only when the processor cannot safely determine the result", async () => {
    mockProcessQrisPaymentEvent.mockResolvedValueOnce("error");
    const res = await POST(webhookRequest(PAID_BODY));
    expect(res.status).toBe(500);
  });

  it("ignores the advisory X-Event header for routing", async () => {
    mockProcessQrisPaymentEvent.mockResolvedValueOnce("expired");

    const body = JSON.stringify({
      payment_id: "pay_abc",
      payment_status: "expired",
      amount: 25123,
    });

    const headers = new Headers({
      "Content-Type": "application/json",
      "x-signature": sign(body),
      "x-event": "payment.paid",
    });

    const res = await POST(
      new Request("http://localhost/api/webhooks/qris", {
        method: "POST",
        headers,
        body,
      })
    );

    expect(res.status).toBe(200);
    // Routed by the signed payment_status field, not the unsigned header
    expect(mockProcessQrisPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ status: "expired" }),
      expect.anything()
    );
  });

  it("returns 503 when the webhook HMAC key is not configured", async () => {
    process.env.QRIS_WEBHOOK_HMAC_KEY = "";
    const res = await POST(webhookRequest(PAID_BODY, { signature: "0".repeat(64) }));
    expect(res.status).toBe(503);
  });
});
