/**
 * @vitest-environment node
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import { getPaymentGateway } from "@/lib/paymentGateway";

// `process.env.NODE_ENV` is typed read-only; assign through a cast helper so
// the prod/dev branches of getPaymentGateway() can be exercised deterministically.
function setEnv(key: string, value: string | undefined) {
  (process.env as Record<string, string | undefined>)[key] = value;
}

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
  vi.unstubAllEnvs();
});

function configureQris() {
  setEnv("QRIS_API_BASE_URL", "https://qris.example.com");
  setEnv("QRIS_API_KEY", "key");
  setEnv("QRIS_WEBHOOK_HMAC_KEY", "hmac");
}

describe("getPaymentGateway", () => {
  it("defaults to MOCK outside production when unset", () => {
    setEnv("PAYMENT_GATEWAY", undefined);
    setEnv("NODE_ENV", "development");
    expect(getPaymentGateway()).toBe("MOCK");
  });

  it("parses QRIS case-insensitively", () => {
    setEnv("PAYMENT_GATEWAY", "qris");
    setEnv("NODE_ENV", "development");
    expect(getPaymentGateway()).toBe("QRIS");
  });

  it("parses PAKASIR", () => {
    setEnv("PAYMENT_GATEWAY", "PAKASIR");
    setEnv("NODE_ENV", "development");
    expect(getPaymentGateway()).toBe("PAKASIR");
  });

  it("falls back to MOCK for invalid values outside production", () => {
    setEnv("PAYMENT_GATEWAY", "stripe");
    setEnv("NODE_ENV", "development");
    expect(getPaymentGateway()).toBe("MOCK");
  });

  it("rejects MOCK in production", () => {
    setEnv("PAYMENT_GATEWAY", "MOCK");
    setEnv("NODE_ENV", "production");
    expect(() => getPaymentGateway()).toThrow(/MOCK/);
  });

  it("rejects a missing gateway in production", () => {
    setEnv("PAYMENT_GATEWAY", undefined);
    setEnv("NODE_ENV", "production");
    expect(() => getPaymentGateway()).toThrow();
  });

  it("rejects an invalid gateway in production", () => {
    setEnv("PAYMENT_GATEWAY", "stripe");
    setEnv("NODE_ENV", "production");
    expect(() => getPaymentGateway()).toThrow();
  });

  it("accepts QRIS in production when fully configured", () => {
    setEnv("PAYMENT_GATEWAY", "QRIS");
    setEnv("NODE_ENV", "production");
    configureQris();
    expect(getPaymentGateway()).toBe("QRIS");
  });

  it("rejects QRIS in production when Qris is not configured", () => {
    setEnv("PAYMENT_GATEWAY", "QRIS");
    setEnv("NODE_ENV", "production");
    setEnv("QRIS_API_BASE_URL", undefined);
    setEnv("QRIS_API_KEY", undefined);
    setEnv("QRIS_WEBHOOK_HMAC_KEY", undefined);
    expect(() => getPaymentGateway()).toThrow(/QRIS/);
  });

  it("rejects QRIS in production when the base URL is not HTTPS", () => {
    setEnv("PAYMENT_GATEWAY", "QRIS");
    setEnv("NODE_ENV", "production");
    setEnv("QRIS_API_BASE_URL", "http://qris.example.com");
    setEnv("QRIS_API_KEY", "key");
    setEnv("QRIS_WEBHOOK_HMAC_KEY", "hmac");
    expect(() => getPaymentGateway()).toThrow(/QRIS/);
  });

  it("rejects PAKASIR for new orders in production", () => {
    setEnv("PAYMENT_GATEWAY", "PAKASIR");
    setEnv("NODE_ENV", "production");
    expect(() => getPaymentGateway()).toThrow(/PAKASIR/);
  });

  it("still allows PAKASIR outside production for testing", () => {
    setEnv("PAYMENT_GATEWAY", "PAKASIR");
    setEnv("NODE_ENV", "development");
    expect(getPaymentGateway()).toBe("PAKASIR");
  });
});
