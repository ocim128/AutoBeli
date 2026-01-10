import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock crypto module
vi.mock("crypto", () => ({
  default: {
    createHash: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn(() => "test-signature-hash"),
    })),
    timingSafeEqual: vi.fn((a, b) => a.toString() === b.toString()),
  },
}));

// Mock environment variables
const originalEnv = process.env;

describe("Midtrans Library", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      MIDTRANS_SERVER_KEY: "SB-Mid-server-test-key",
      MIDTRANS_CLIENT_KEY: "SB-Mid-client-test-key",
      MIDTRANS_IS_PRODUCTION: "false",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("isMidtransConfigured", () => {
    it("should return true when server key is set", async () => {
      const { isMidtransConfigured } = await import("@/lib/midtrans");

      expect(isMidtransConfigured()).toBe(true);
    });

    it("should return false when server key is missing", async () => {
      process.env.MIDTRANS_SERVER_KEY = "";
      vi.resetModules();

      const { isMidtransConfigured } = await import("@/lib/midtrans");

      expect(isMidtransConfigured()).toBe(false);
    });
  });

  describe("getClientKey", () => {
    it("should return the client key", async () => {
      const { getClientKey } = await import("@/lib/midtrans");

      expect(getClientKey()).toBe("SB-Mid-client-test-key");
    });
  });

  describe("isProductionMode", () => {
    it("should return false in sandbox mode", async () => {
      const { isProductionMode } = await import("@/lib/midtrans");

      expect(isProductionMode()).toBe(false);
    });

    it("should return true in production mode", async () => {
      process.env.MIDTRANS_IS_PRODUCTION = "true";
      vi.resetModules();

      const { isProductionMode } = await import("@/lib/midtrans");

      expect(isProductionMode()).toBe(true);
    });
  });

  describe("verifyNotificationSignature", () => {
    it("should return true for valid signature", async () => {
      const { verifyNotificationSignature } = await import("@/lib/midtrans");

      // The mock returns "test-signature-hash" for any input
      const result = verifyNotificationSignature(
        "order-123",
        "200",
        "50000.00",
        "test-signature-hash"
      );

      expect(result).toBe(true);
    });

    it("should return false for invalid signature", async () => {
      const { verifyNotificationSignature } = await import("@/lib/midtrans");

      const result = verifyNotificationSignature(
        "order-123",
        "200",
        "50000.00",
        "invalid-signature"
      );

      expect(result).toBe(false);
    });
  });

  describe("createTransaction", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it("should call Midtrans Snap API with correct payload", async () => {
      const mockResponse = {
        token: "snap-token-123",
        redirect_url: "https://app.sandbox.midtrans.com/snap/v2/vtweb/snap-token-123",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { createTransaction } = await import("@/lib/midtrans");

      const result = await createTransaction({
        order_id: "ORD-123",
        gross_amount: 50000,
        item_details: [
          {
            id: "product-1",
            name: "Test Product",
            price: 50000,
            quantity: 1,
          },
        ],
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://app.sandbox.midtrans.com/snap/v1/transactions",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining('"order_id":"ORD-123"'),
        })
      );

      expect(result.success).toBe(true);
      expect(result.data?.token).toBe("snap-token-123");
      expect(result.data?.redirect_url).toContain("sandbox.midtrans.com");
    });

    it("should handle API error response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error_messages: ["Invalid order_id format"],
        }),
      });

      const { createTransaction } = await import("@/lib/midtrans");

      const result = await createTransaction({
        order_id: "",
        gross_amount: 50000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid order_id format");
    });

    it("should handle network errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Network error"));

      const { createTransaction } = await import("@/lib/midtrans");

      const result = await createTransaction({
        order_id: "ORD-123",
        gross_amount: 50000,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to connect to Midtrans");
    });
  });

  describe("getTransactionStatus", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it("should fetch transaction status by order ID", async () => {
      const mockResponse = {
        status_code: "200",
        status_message: "Success, transaction found",
        transaction_id: "tx-123",
        order_id: "ORD-123",
        gross_amount: "50000.00",
        payment_type: "bank_transfer",
        transaction_time: "2024-01-10 12:00:00",
        transaction_status: "settlement",
        signature_key: "test-signature",
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { getTransactionStatus } = await import("@/lib/midtrans");

      const result = await getTransactionStatus("ORD-123");

      expect(global.fetch).toHaveBeenCalledWith(
        "https://api.sandbox.midtrans.com/v2/ORD-123/status",
        expect.objectContaining({
          method: "GET",
        })
      );

      expect(result.success).toBe(true);
      expect(result.data?.transaction_status).toBe("settlement");
    });

    it("should handle not found response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          status_code: "404",
          status_message: "Transaction not found",
        }),
      });

      const { getTransactionStatus } = await import("@/lib/midtrans");

      const result = await getTransactionStatus("INVALID-ID");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });
});
