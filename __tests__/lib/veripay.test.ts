import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock crypto module
vi.mock("crypto", () => ({
  default: {
    createHmac: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => Buffer.from("test-signature")),
    })),
    timingSafeEqual: vi.fn((a, b) => a.toString() === b.toString()),
  },
}));

// Mock environment variables
const originalEnv = process.env;

describe("Veripay Library", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      VERIPAY_API_KEY: "test-api-key",
      VERIPAY_SECRET_KEY: "test-secret-key",
      VERIPAY_BASE_URL: "https://veripay.site/api/v1",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("generateSignature", () => {
    it("should generate a base64 encoded signature", async () => {
      const { generateSignature } = await import("@/lib/veripay");
      const timestamp = 1704067200;
      const signature = generateSignature(timestamp);

      expect(typeof signature).toBe("string");
      expect(signature.length).toBeGreaterThan(0);
    });

    it("should produce consistent signatures for same input", async () => {
      const { generateSignature } = await import("@/lib/veripay");
      const timestamp = 1704067200;

      const sig1 = generateSignature(timestamp);
      const sig2 = generateSignature(timestamp);

      expect(sig1).toBe(sig2);
    });

    it("should produce different signatures for different timestamps", async () => {
      // Reset mocks to use real crypto
      vi.unmock("crypto");
      vi.resetModules();

      process.env.VERIPAY_API_KEY = "test-key";
      process.env.VERIPAY_SECRET_KEY = "test-secret";

      const { generateSignature } = await import("@/lib/veripay");

      const sig1 = generateSignature(1704067200);
      const sig2 = generateSignature(1704067300);

      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("should return true for valid signature", async () => {
      const { verifyWebhookSignature, generateSignature } = await import("@/lib/veripay");
      const timestamp = "1704067200";
      const validSignature = generateSignature(parseInt(timestamp, 10));

      const result = verifyWebhookSignature(validSignature, timestamp);

      expect(result).toBe(true);
    });

    it("should return false for invalid signature", async () => {
      const { verifyWebhookSignature } = await import("@/lib/veripay");

      const result = verifyWebhookSignature("invalid-signature", "1704067200");

      expect(result).toBe(false);
    });

    it("should return false for mismatched timestamp", async () => {
      const { verifyWebhookSignature, generateSignature } = await import("@/lib/veripay");
      const signature = generateSignature(1704067200);

      const result = verifyWebhookSignature(signature, "1704067300");

      expect(result).toBe(false);
    });
  });

  describe("getAuthHeaders", () => {
    it("should return all required headers", async () => {
      const { getAuthHeaders } = await import("@/lib/veripay");
      const headers = getAuthHeaders();

      expect(headers).toHaveProperty("Authorization");
      expect(headers).toHaveProperty("x-api-key");
      expect(headers).toHaveProperty("x-timestamp");
      expect(headers).toHaveProperty("x-signature");
      expect(headers).toHaveProperty("Content-Type");
    });

    it("should include Bearer token in Authorization", async () => {
      const { getAuthHeaders } = await import("@/lib/veripay");
      const headers = getAuthHeaders();

      expect(headers["Authorization"]).toMatch(/^Bearer /);
    });

    it("should include API key in x-api-key", async () => {
      const { getAuthHeaders } = await import("@/lib/veripay");
      const headers = getAuthHeaders();

      expect(headers["x-api-key"]).toBe("test-api-key");
    });

    it("should include valid timestamp", async () => {
      const { getAuthHeaders } = await import("@/lib/veripay");
      const beforeCall = Math.floor(Date.now() / 1000);
      const headers = getAuthHeaders();
      const afterCall = Math.floor(Date.now() / 1000);

      const timestamp = parseInt(headers["x-timestamp"], 10);
      expect(timestamp).toBeGreaterThanOrEqual(beforeCall);
      expect(timestamp).toBeLessThanOrEqual(afterCall);
    });
  });

  describe("isVeripayConfigured", () => {
    it("should return true when both keys are set", async () => {
      const { isVeripayConfigured } = await import("@/lib/veripay");

      expect(isVeripayConfigured()).toBe(true);
    });

    it("should return false when API key is missing", async () => {
      process.env.VERIPAY_API_KEY = "";
      vi.resetModules();

      const { isVeripayConfigured } = await import("@/lib/veripay");

      expect(isVeripayConfigured()).toBe(false);
    });

    it("should return false when secret key is missing", async () => {
      process.env.VERIPAY_SECRET_KEY = "";
      vi.resetModules();

      const { isVeripayConfigured } = await import("@/lib/veripay");

      expect(isVeripayConfigured()).toBe(false);
    });
  });

  describe("createPaymentRequest", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it("should call Veripay API with correct payload", async () => {
      const mockResponse = {
        success: true,
        data: {
          order_id: "ORD-123",
          transaction_ref: "PY-123",
          payment_url: "https://pay.veripay.site/123",
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { createPaymentRequest } = await import("@/lib/veripay");

      const result = await createPaymentRequest({
        order_id: "ORD-123",
        amount: 50000,
        description: "Test payment",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://veripay.site/api/v1/merchant/payments",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"order_id":"ORD-123"'),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data?.payment_url).toBe("https://pay.veripay.site/123");
    });

    it("should handle API error response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          message: "Invalid request",
          errors: { amount: ["Amount is required"] },
        }),
      });

      const { createPaymentRequest } = await import("@/lib/veripay");

      const result = await createPaymentRequest({
        order_id: "ORD-123",
        amount: 0,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid request");
    });
  });

  describe("getPaymentStatus", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it("should fetch payment status by transaction ref", async () => {
      const mockResponse = {
        success: true,
        data: {
          status: "PAID",
          amount: 50000,
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { getPaymentStatus } = await import("@/lib/veripay");

      const result = await getPaymentStatus("PY-123");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://veripay.site/api/v1/merchant/payments/PY-123",
        expect.objectContaining({
          method: "GET",
        })
      );

      expect(result.success).toBe(true);
    });
  });
});
