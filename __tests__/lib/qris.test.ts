/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  createQrisPayment,
  fetchQrisQrImage,
  getQrisPayment,
  isQrisBaseAmountSupported,
  isQrisConfigured,
  readBodyWithTimeout,
  verifyQrisWebhookSignature,
  QRIS_MAX_BASE_AMOUNT,
  QRIS_MIN_BASE_AMOUNT,
} from "@/lib/qris";

const originalEnv = { ...process.env };

const mockFetch = vi.fn();
global.fetch = mockFetch as unknown as typeof fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.QRIS_API_BASE_URL = "https://qris.example.com";
  process.env.QRIS_API_KEY = "test-qris-key";
  process.env.QRIS_WEBHOOK_HMAC_KEY = "test-hmac-key";
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.useRealTimers();
});

describe("isQrisConfigured", () => {
  it("returns true when all settings are present", () => {
    expect(isQrisConfigured()).toBe(true);
  });

  it("returns false when the API key is missing", () => {
    process.env.QRIS_API_KEY = "";
    expect(isQrisConfigured()).toBe(false);
  });

  it("returns false when the webhook HMAC key is missing", () => {
    process.env.QRIS_WEBHOOK_HMAC_KEY = "";
    expect(isQrisConfigured()).toBe(false);
  });

  it("returns false for a malformed base URL", () => {
    process.env.QRIS_API_BASE_URL = "not a url";
    expect(isQrisConfigured()).toBe(false);
  });

  it("rejects a non-HTTPS base URL in production", () => {
    process.env.QRIS_API_BASE_URL = "http://qris.example.com";
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    expect(isQrisConfigured()).toBe(false);
  });

  it("allows a non-HTTPS base URL outside production", () => {
    process.env.QRIS_API_BASE_URL = "http://localhost:9000";
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    expect(isQrisConfigured()).toBe(true);
  });
});

describe("isQrisBaseAmountSupported", () => {
  it("enforces the supported range", () => {
    expect(isQrisBaseAmountSupported(QRIS_MIN_BASE_AMOUNT - 1)).toBe(false);
    expect(isQrisBaseAmountSupported(QRIS_MIN_BASE_AMOUNT)).toBe(true);
    expect(isQrisBaseAmountSupported(QRIS_MAX_BASE_AMOUNT)).toBe(true);
    expect(isQrisBaseAmountSupported(QRIS_MAX_BASE_AMOUNT + 1)).toBe(false);
    expect(isQrisBaseAmountSupported(25000.5)).toBe(false);
  });
});

describe("createQrisPayment", () => {
  const params = {
    baseAmount: 25000,
    timeout: 300000,
    webhookUrl: "https://autobeli.example.com/api/webhooks/qris?attempt=nonce-1",
    timezone: "Asia/Jakarta",
  };

  it("sends the server-managed payload with a bearer key", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_123",
        payment_status: "pending",
        amount: 25123,
        expires_at: 1735689600,
      })
    );

    const result = await createQrisPayment(params);

    expect(result.success).toBe(true);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("https://qris.example.com/payment");
    expect(init.method).toBe("POST");
    expect(init.headers.Authorization).toBe("Bearer test-qris-key");
    expect(JSON.parse(init.body as string)).toEqual({
      mode: "server_managed",
      base_amount: 25000,
      timeout: 300000,
      tolerance: 0,
      webhook_url: params.webhookUrl,
      tz: "Asia/Jakarta",
    });

    if (result.success) {
      expect(result.data.paymentId).toBe("pay_123");
      expect(result.data.amount).toBe(25123);
      // epoch seconds normalized to milliseconds
      expect(result.data.expiresAt).toBe(1735689600 * 1000);
    }
  });

  it("rejects an out-of-range base amount without calling the provider", async () => {
    const result = await createQrisPayment({ ...params, baseAmount: 500 });
    expect(result).toMatchObject({ success: false, indeterminate: false });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("treats a 4xx as a known-safe provider rejection", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "bad request" }, 400));
    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: false });
  });

  it("maps a known Qris error_code to a safe user-facing message", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error_code: "INVALID_BASE_AMOUNT", message: "rejected" }, 400)
    );
    const result = await createQrisPayment(params);
    expect(result).toMatchObject({
      success: false,
      code: "INVALID_BASE_AMOUNT",
      error: "Order total is outside the supported payment range.",
      indeterminate: false,
    });
  });

  it("falls back to a generic message for an unknown error_code", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error_code: "NEW_FUTURE_CODE" }, 400));
    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, code: "NEW_FUTURE_CODE" });
    if (!result.success) {
      expect(result.error).not.toContain("NEW_FUTURE_CODE");
    }
  });

  it("treats a 5xx as indeterminate", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "boom" }, 500));
    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: true });
  });

  it("treats a network failure as indeterminate", async () => {
    mockFetch.mockRejectedValueOnce(new Error("socket hangup"));
    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: true });
  });

  it("treats a timeout as indeterminate", async () => {
    vi.useFakeTimers();
    mockFetch.mockImplementation(
      (_input, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
        })
    );

    const promise = createQrisPayment(params);
    const assertion = expect(promise).resolves.toMatchObject({
      success: false,
      indeterminate: true,
    });
    await vi.advanceTimersByTimeAsync(11000);
    await assertion;
  });

  it("treats malformed JSON as indeterminate", async () => {
    mockFetch.mockResolvedValueOnce(new Response("not json", { status: 200 }));
    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: true });
  });

  it("rejects a response missing the payment id", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ payment_status: "pending", amount: 25123, expires_at: 1735689600000 })
    );
    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: true });
  });

  it("rejects a response missing expires_at", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ payment_id: "pay_123", payment_status: "pending", amount: 25123 })
    );
    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: true });
  });

  it("rejects a provider final amount below the server-managed base amount", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_123",
        payment_status: "pending",
        amount: 1,
        expires_at: 1735689600000,
      })
    );

    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: true });
  });

  it("rejects a provider response in a non-IDR currency", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_123",
        payment_status: "pending",
        amount: 25123,
        currency: "USD",
        expires_at: 1735689600000,
      })
    );

    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: true });
  });

  it("rejects a provider suffix above the allowed 0-999 range", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_123",
        payment_status: "pending",
        amount: 26000,
        expires_at: 1735689600000,
      })
    );

    const result = await createQrisPayment(params);
    expect(result).toMatchObject({ success: false, indeterminate: true });
  });

  it("rejects a paid payment whose paid_amount differs from amount", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_123",
        payment_status: "paid",
        amount: 25123,
        paid_amount: 25000,
        paid_at: 1735689600000,
        expires_at: 1735689600000,
      })
    );
    const result = await createQrisPayment(params);
    expect(result.success).toBe(false);
  });

  it("rejects a paid REST record missing paid_amount", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_123",
        payment_status: "paid",
        amount: 25123,
        paid_at: 1735689600000,
        expires_at: 1735689600000,
      })
    );
    const result = await createQrisPayment(params);
    expect(result.success).toBe(false);
  });

  it("rejects a paid REST record missing paid_at", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_123",
        payment_status: "paid",
        amount: 25123,
        paid_amount: 25123,
        expires_at: 1735689600000,
      })
    );
    const result = await createQrisPayment(params);
    expect(result.success).toBe(false);
  });
});

describe("getQrisPayment", () => {
  it("fetches and validates a payment", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_123",
        payment_status: "paid",
        amount: 25123,
        paid_amount: 25123,
        paid_at: "2026-01-01T00:00:00Z",
        expires_at: "2026-01-01T00:05:00Z",
      })
    );

    const result = await getQrisPayment("pay_123");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://qris.example.com/payment/pay_123",
      expect.objectContaining({
        method: "GET",
        headers: { Authorization: "Bearer test-qris-key" },
      })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("paid");
      expect(result.data.paidAmount).toBe(25123);
      expect(result.data.expiresAt).toBe(Date.parse("2026-01-01T00:05:00Z"));
    }
  });

  it("returns an error for non-2xx responses", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ error: "not found" }, 404));
    const result = await getQrisPayment("pay_missing");
    expect(result.success).toBe(false);
  });

  it("returns an error for malformed bodies", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ hello: "world" }));
    const result = await getQrisPayment("pay_123");
    expect(result.success).toBe(false);
  });

  it("rejects a valid-looking response for a different payment ID", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        payment_id: "pay_other",
        payment_status: "paid",
        amount: 25123,
        paid_amount: 25123,
        paid_at: "2026-01-01T00:00:00Z",
        expires_at: "2026-01-01T00:05:00Z",
      })
    );

    const result = await getQrisPayment("pay_123");
    expect(result.success).toBe(false);
  });

  it("returns an error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("dns failure"));
    const result = await getQrisPayment("pay_123");
    expect(result.success).toBe(false);
  });
});

describe("readBodyWithTimeout", () => {
  it("rejects when the response body stalls past the timeout", async () => {
    // A Response whose body stream never produces chunks or closes; without
    // the body-read timeout this would hang indefinitely.
    const stalled = new Response(
      new ReadableStream({
        start() {
          // never enqueue or close
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

    await expect(readBodyWithTimeout(stalled, 50)).rejects.toThrow(/timed out/);
  });

  it("resolves the body when the stream completes within the timeout", async () => {
    const response = new Response('{"ok":true}', {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    await expect(readBodyWithTimeout(response, 1000)).resolves.toBe('{"ok":true}');
  });
});

describe("fetchQrisQrImage", () => {
  it("returns the PNG bytes", async () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    mockFetch.mockResolvedValueOnce(
      new Response(new Uint8Array(png), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      })
    );

    const result = await fetchQrisQrImage("pay_123");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://qris.example.com/payment/pay_123/qris.png",
      expect.objectContaining({ method: "GET" })
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(Buffer.compare(result.image, png)).toBe(0);
    }
  });

  it("rejects non-PNG content types", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("<html></html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      })
    );
    const result = await fetchQrisQrImage("pay_123");
    expect(result.success).toBe(false);
  });

  it("rejects oversized images via content-length", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(new Uint8Array(8), {
        status: 200,
        headers: { "Content-Type": "image/png", "Content-Length": String(2 * 1024 * 1024) },
      })
    );
    const result = await fetchQrisQrImage("pay_123");
    expect(result.success).toBe(false);
  });

  it("rejects a streamed oversized image without buffering it completely", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new Uint8Array(1024 * 1024));
            controller.enqueue(new Uint8Array(1));
            controller.close();
          },
        }),
        { status: 200, headers: { "Content-Type": "image/png" } }
      )
    );

    const result = await fetchQrisQrImage("pay_123");
    expect(result.success).toBe(false);
  });
});

describe("verifyQrisWebhookSignature", () => {
  function sign(body: string | Buffer, key = "test-hmac-key"): string {
    return crypto.createHmac("sha256", key).update(body).digest("hex");
  }

  it("accepts a valid lowercase-hex HMAC over the exact raw body", () => {
    const body = JSON.stringify({ payment_id: "pay_1", payment_status: "paid", amount: 25123 });
    expect(verifyQrisWebhookSignature(body, sign(body))).toBe(true);
  });

  it("accepts a signature computed over a Buffer body", () => {
    const body = Buffer.from('{"a":1}', "utf8");
    expect(verifyQrisWebhookSignature(body, sign(body))).toBe(true);
  });

  it("rejects a signature for a tampered body", () => {
    const body = JSON.stringify({ payment_id: "pay_1", amount: 25123 });
    const tampered = JSON.stringify({ payment_id: "pay_1", amount: 1000 });
    expect(verifyQrisWebhookSignature(tampered, sign(body))).toBe(false);
  });

  it("rejects an uppercase-hex signature", () => {
    const body = "payload";
    expect(verifyQrisWebhookSignature(body, sign(body).toUpperCase())).toBe(false);
  });

  it("rejects a missing or malformed signature", () => {
    expect(verifyQrisWebhookSignature("payload", null)).toBe(false);
    expect(verifyQrisWebhookSignature("payload", "not-hex")).toBe(false);
  });

  it("rejects a signature made with the wrong key", () => {
    const body = "payload";
    expect(verifyQrisWebhookSignature(body, sign(body, "other-key"))).toBe(false);
  });

  it("rejects everything when the HMAC key is not configured", () => {
    process.env.QRIS_WEBHOOK_HMAC_KEY = "";
    const body = "payload";
    expect(verifyQrisWebhookSignature(body, sign(body))).toBe(false);
  });

  it("a replayed signature still verifies; idempotency is handled upstream", () => {
    const body = JSON.stringify({ payment_id: "pay_1", payment_status: "paid", amount: 25123 });
    const signature = sign(body);
    expect(verifyQrisWebhookSignature(body, signature)).toBe(true);
    expect(verifyQrisWebhookSignature(body, signature)).toBe(true);
  });
});
