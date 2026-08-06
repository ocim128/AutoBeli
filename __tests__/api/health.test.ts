/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetPaymentGateway = vi.fn();
const mockIsQrisConfigured = vi.fn();
const mockGetMongoClient = vi.fn();

vi.mock("@/lib/paymentGateway", () => ({
  getPaymentGateway: () => mockGetPaymentGateway(),
}));

vi.mock("@/lib/qris", () => ({
  isQrisConfigured: () => mockIsQrisConfigured(),
}));

vi.mock("@/lib/db", () => ({
  getMongoClient: () => mockGetMongoClient(),
}));

vi.mock("@/lib/rateLimit", () => ({
  RATE_LIMITS: { API_GENERAL: { limit: 60, windowMs: 60_000 } },
  getClientIP: () => "test-ip",
  checkRateLimit: () => ({ success: true }),
}));

import { GET } from "@/app/api/health/route";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.NODE_ENV = "production";
  mockGetPaymentGateway.mockReset();
  mockIsQrisConfigured.mockReset();
  mockGetMongoClient.mockReset();
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("GET /api/health", () => {
  it("returns 503 when production gateway configuration is invalid", async () => {
    mockGetPaymentGateway.mockImplementation(() => {
      throw new Error("PAYMENT_GATEWAY=QRIS is invalid");
    });
    const command = vi.fn();
    mockGetMongoClient.mockResolvedValue({ db: () => ({ command }) });

    const response = await GET(new Request("http://localhost/api/health"));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      status: "degraded",
      database: "connected",
      gateway: { configured: false },
    });
    expect(command).toHaveBeenCalledWith({ ping: 1 });
  });

  it("returns 200 when the production gateway and database are healthy", async () => {
    mockGetPaymentGateway.mockReturnValue("QRIS");
    mockIsQrisConfigured.mockReturnValue(true);
    const command = vi.fn().mockResolvedValue({ ok: 1 });
    mockGetMongoClient.mockResolvedValue({ db: () => ({ command }) });

    const response = await GET(new Request("http://localhost/api/health"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      database: "connected",
      gateway: { configured: true, gateway: "QRIS" },
    });
    expect(command).toHaveBeenCalledWith({ ping: 1 });
  });
});
