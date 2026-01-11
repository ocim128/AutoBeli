import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock environment variables
const originalEnv = process.env;

describe("Pakasir Library", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      PAKASIR_API_KEY: "test-pakasir-key",
      PAKASIR_PROJECT_SLUG: "test-project",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("isPakasirConfigured", () => {
    it("should return true when API key and project slug are set", async () => {
      const { isPakasirConfigured } = await import("@/lib/pakasir");
      expect(isPakasirConfigured()).toBe(true);
    });

    it("should return false when missing keys", async () => {
      process.env.PAKASIR_API_KEY = "";
      vi.resetModules();
      const { isPakasirConfigured } = await import("@/lib/pakasir");
      expect(isPakasirConfigured()).toBe(false);
    });
  });

  describe("createPakasirTransaction", () => {
    it("should generate correct payment URL", async () => {
      const { createPakasirTransaction } = await import("@/lib/pakasir");

      const result = await createPakasirTransaction({
        order_id: "ORD-123",
        amount: 50000,
      });

      expect(result.success).toBe(true);
      expect(result.payment_url).toBe(
        "https://app.pakasir.com/pay/test-project/50000?order_id=ORD-123"
      );
    });

    it("should handle decimal amounts by rounding up", async () => {
      const { createPakasirTransaction } = await import("@/lib/pakasir");

      const result = await createPakasirTransaction({
        order_id: "ORD-123",
        amount: 50000.5,
      });

      expect(result.success).toBe(true);
      // Math.ceil(50000.50) = 50001
      expect(result.payment_url).toContain("/50001?");
    });
  });

  describe("getPakasirTransactionStatus", () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it("should fetch transaction status correctly", async () => {
      const mockResponse = {
        transaction: {
          amount: 50000,
          order_id: "ORD-123",
          project: "test-project",
          status: "completed",
          payment_method: "qris",
          completed_at: "2024-01-01T10:00:00Z",
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { getPakasirTransactionStatus } = await import("@/lib/pakasir");
      const result = await getPakasirTransactionStatus("ORD-123", 50000);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "transactiondetail?project=test-project&amount=50000&order_id=ORD-123&api_key=test-pakasir-key"
        ),
        expect.objectContaining({ method: "GET" })
      );

      expect(result.success).toBe(true);
      expect(result.data?.transaction.status).toBe("completed");
    });

    it("should handle errors", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Not found" }),
      });

      const { getPakasirTransactionStatus } = await import("@/lib/pakasir");
      const result = await getPakasirTransactionStatus("ORD-123", 50000);

      expect(result.success).toBe(false);
    });
  });
});
