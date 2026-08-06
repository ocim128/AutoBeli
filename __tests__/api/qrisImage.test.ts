/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import type { Order } from "@/lib/definitions";

const mockFetchQrisQrImage = vi.fn();
const mockIsQrisConfigured = vi.fn(() => true);

vi.mock("@/lib/qris", () => ({
  fetchQrisQrImage: (...args: unknown[]) => mockFetchQrisQrImage(...args),
  isQrisConfigured: () => mockIsQrisConfigured(),
}));

const mockGetMongoClient = vi.fn();

vi.mock("@/lib/db", () => ({
  getMongoClient: () => mockGetMongoClient(),
}));

import { GET } from "@/app/api/payment/qris/image/route";

const ORDER_ID = "64b64c7f9f1b2c0012345700";
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    _id: new ObjectId(ORDER_ID),
    productId: new ObjectId("64b64c7f9f1b2c0012345701"),
    status: "PENDING",
    amountPaid: 0,
    paymentGateway: "QRIS",
    paymentMetadata: { provider: "qris", transaction_ref: "pay_abc", amount: 25123 },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

function createDb(order: Order | null) {
  return {
    collection: vi.fn(() => ({
      findOne: vi.fn(async () => order),
    })),
  };
}

function imageRequest(query: string): Request {
  return new Request(`http://localhost/api/payment/qris/image?${query}`, { method: "GET" });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsQrisConfigured.mockReturnValue(true);
});

describe("GET /api/payment/qris/image", () => {
  it("streams the PNG for a pending Qris order", async () => {
    mockGetMongoClient.mockResolvedValue({ db: () => createDb(makeOrder()) });
    mockFetchQrisQrImage.mockResolvedValueOnce({ success: true, image: PNG });

    const res = await GET(imageRequest(`orderId=${ORDER_ID}`));

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("image/png");
    expect(res.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mockFetchQrisQrImage).toHaveBeenCalledWith("pay_abc");
  });

  it("rejects a non-ObjectId orderId", async () => {
    const res = await GET(imageRequest("orderId=not-an-id"));
    expect(res.status).toBe(400);
    expect(mockFetchQrisQrImage).not.toHaveBeenCalled();
  });

  it("returns 404 when no query is provided", async () => {
    const res = await GET(imageRequest(""));
    expect(res.status).toBe(400);
  });

  it("returns 404 for an order with no pending Qris payment", async () => {
    mockGetMongoClient.mockResolvedValue({
      db: () => createDb(makeOrder({ status: "PAID" })),
    });
    const res = await GET(imageRequest(`orderId=${ORDER_ID}`));
    expect(res.status).toBe(404);
    expect(mockFetchQrisQrImage).not.toHaveBeenCalled();
  });

  it("returns 404 for a non-Qris order", async () => {
    mockGetMongoClient.mockResolvedValue({
      db: () => createDb(makeOrder({ paymentGateway: "PAKASIR", paymentMetadata: undefined })),
    });
    const res = await GET(imageRequest(`orderId=${ORDER_ID}`));
    expect(res.status).toBe(404);
    expect(mockFetchQrisQrImage).not.toHaveBeenCalled();
  });

  it("never accepts a provider URL or payment ID from the client", async () => {
    mockGetMongoClient.mockResolvedValue({ db: () => createDb(makeOrder()) });
    mockFetchQrisQrImage.mockResolvedValueOnce({ success: true, image: PNG });

    // Only the orderId query is honored; a client-supplied URL is ignored and
    // the route fetches via the server-stored transaction ref only.
    await GET(
      imageRequest(`url=https://qris.example.com/payment/pay_abc/qris.png&orderId=${ORDER_ID}`)
    );

    expect(mockFetchQrisQrImage).toHaveBeenCalledWith("pay_abc");
    expect(mockFetchQrisQrImage).not.toHaveBeenCalledWith(expect.stringContaining("url="));
  });

  it("returns 502 when the QR image fetch fails", async () => {
    mockGetMongoClient.mockResolvedValue({ db: () => createDb(makeOrder()) });
    mockFetchQrisQrImage.mockResolvedValueOnce({ success: false, error: "boom" });

    const res = await GET(imageRequest(`orderId=${ORDER_ID}`));
    expect(res.status).toBe(502);
  });

  it("returns 404 when Qris is not configured", async () => {
    mockIsQrisConfigured.mockReturnValue(false);
    const res = await GET(imageRequest(`orderId=${ORDER_ID}`));
    expect(res.status).toBe(404);
    expect(mockFetchQrisQrImage).not.toHaveBeenCalled();
  });
});
