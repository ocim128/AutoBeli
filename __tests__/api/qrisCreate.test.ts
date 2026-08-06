/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import type { Order, Product } from "@/lib/definitions";

const mockCreateQrisPayment = vi.fn();
const mockGetQrisPayment = vi.fn();
const mockIsQrisConfigured = vi.fn(() => true);

vi.mock("@/lib/qris", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/qris")>();
  return {
    ...original,
    createQrisPayment: (...args: unknown[]) => mockCreateQrisPayment(...args),
    getQrisPayment: (...args: unknown[]) => mockGetQrisPayment(...args),
    isQrisConfigured: () => mockIsQrisConfigured(),
  };
});

const mockProcessQrisPaymentEvent = vi.fn();

vi.mock("@/lib/orders", () => ({
  processQrisPaymentEvent: (...args: unknown[]) => mockProcessQrisPaymentEvent(...args),
}));

vi.mock("@/lib/rateLimit", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/rateLimit")>();
  return {
    ...original,
    getClientIP: () => "test-ip",
    checkRateLimit: () => ({ success: true, limit: 10, remaining: 9, resetAt: Date.now() + 60000 }),
  };
});

const mockGetMongoClient = vi.fn();

vi.mock("@/lib/db", () => ({
  getMongoClient: () => mockGetMongoClient(),
}));

import { POST } from "@/app/api/payment/qris/create/route";

const originalEnv = { ...process.env };

function idMatches(a: unknown, b: unknown): boolean {
  return a?.toString() === b?.toString();
}

function setNested(doc: Record<string, unknown>, key: string, value: unknown) {
  const parts = key.split(".");
  let target = doc;
  for (const part of parts.slice(0, -1)) {
    if (typeof target[part] !== "object" || target[part] === null) target[part] = {};
    target = target[part] as Record<string, unknown>;
  }
  target[parts[parts.length - 1]] = value;
}

function applyUpdate(
  doc: Record<string, unknown>,
  update: { $set?: Record<string, unknown>; $unset?: Record<string, unknown> }
) {
  for (const [key, value] of Object.entries(update.$set || {})) {
    setNested(doc, key, value);
  }
  for (const key of Object.keys(update.$unset || {})) {
    delete doc[key];
  }
}

function matchesOrderFilter(order: Order, filter: Record<string, unknown>): boolean {
  if (filter._id && !idMatches(filter._id, order._id)) return false;
  if (typeof filter.status === "string" && order.status !== filter.status) return false;
  if (
    filter.paymentCreationAttempt &&
    order.paymentCreationAttempt !== filter.paymentCreationAttempt
  ) {
    return false;
  }

  const txRefFilter = filter["paymentMetadata.transaction_ref"];
  if (
    typeof txRefFilter === "object" &&
    txRefFilter !== null &&
    (txRefFilter as { $exists?: boolean }).$exists === false &&
    order.paymentMetadata?.transaction_ref !== undefined
  ) {
    return false;
  }

  if (Array.isArray(filter.$or)) {
    const ok = (filter.$or as Record<string, { $exists?: boolean; $lt?: Date }>[]).some(
      (clause) => {
        const [field, condition] = Object.entries(clause)[0] ?? [];
        if (!field || !condition) return false;
        const value = (order as unknown as Record<string, unknown>)[field];
        if (condition.$exists === false) return value === undefined;
        if (condition.$lt instanceof Date)
          return value !== undefined && new Date(value as Date) < condition.$lt;
        return false;
      }
    );
    if (!ok) return false;
  }

  return true;
}

function createFakeDb(order: Order, product: Product) {
  const orders = {
    findOne: vi.fn(async (filter: { _id: ObjectId }) =>
      idMatches(filter._id, order._id) ? order : null
    ),
    updateOne: vi.fn(
      async (
        filter: Record<string, unknown>,
        update: { $set?: Record<string, unknown>; $unset?: Record<string, unknown> }
      ) => {
        if (!matchesOrderFilter(order, filter)) return { modifiedCount: 0, matchedCount: 0 };
        applyUpdate(order as unknown as Record<string, unknown>, update);
        return { modifiedCount: 1, matchedCount: 1 };
      }
    ),
  };

  const products = {
    findOne: vi.fn(async (filter: { _id: ObjectId }) =>
      idMatches(filter._id, product._id) ? product : null
    ),
  };

  return {
    collection: vi.fn((name: string) => {
      if (name === "orders") return orders;
      if (name === "products") return products;
      throw new Error(`Unexpected collection: ${name}`);
    }),
  };
}

const ORDER_ID = "64b64c7f9f1b2c0012345700";
const PRODUCT_ID = "64b64c7f9f1b2c0012345701";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    _id: new ObjectId(ORDER_ID),
    productId: new ObjectId(PRODUCT_ID),
    quantity: 1,
    status: "PENDING",
    amountPaid: 0,
    paymentGateway: "QRIS",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: new ObjectId(PRODUCT_ID),
    title: "Stock Product",
    slug: "stock-product",
    description: "",
    priceIdr: 25000,
    isActive: true,
    stockItems: [
      { id: "stock-1", contentEncrypted: "encrypted", isSold: false },
      { id: "stock-2", contentEncrypted: "encrypted", isSold: false },
    ],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/payment/qris/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockIsQrisConfigured.mockReturnValue(true);
  process.env.NEXT_PUBLIC_BASE_URL = "https://autobeli.example.com";
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("POST /api/payment/qris/create", () => {
  it("returns 503 when Qris is not configured", async () => {
    mockIsQrisConfigured.mockReturnValue(false);
    const res = await POST(createRequest({ orderId: ORDER_ID }));
    expect(res.status).toBe(503);
  });

  it("rejects an invalid order ID", async () => {
    const order = makeOrder();
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    const res = await POST(createRequest({ orderId: "nope" }));
    expect(res.status).toBe(400);
  });

  it("rejects orders stored under a different gateway", async () => {
    const order = makeOrder({ paymentGateway: "MOCK" });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    const res = await POST(createRequest({ orderId: ORDER_ID }));
    expect(res.status).toBe(400);
    expect(mockCreateQrisPayment).not.toHaveBeenCalled();
  });

  it("requires retry:true for an expired order", async () => {
    const order = makeOrder({ status: "EXPIRED" });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    const res = await POST(createRequest({ orderId: ORDER_ID }));
    expect(res.status).toBe(400);
    expect(mockCreateQrisPayment).not.toHaveBeenCalled();
  });

  it("rejects a base amount below the supported range", async () => {
    const order = makeOrder();
    mockGetMongoClient.mockResolvedValue({
      db: () => createFakeDb(order, makeProduct({ priceIdr: 500 })),
    });
    const res = await POST(createRequest({ orderId: ORDER_ID }));
    expect(res.status).toBe(400);
    expect(mockCreateQrisPayment).not.toHaveBeenCalled();
  });

  it("rejects a base amount above the supported range", async () => {
    const order = makeOrder();
    mockGetMongoClient.mockResolvedValue({
      db: () => createFakeDb(order, makeProduct({ priceIdr: 10_000_000 })),
    });
    const res = await POST(createRequest({ orderId: ORDER_ID }));
    expect(res.status).toBe(400);
    expect(mockCreateQrisPayment).not.toHaveBeenCalled();
  });

  it("reuses the stored payment for a pending order with a valid expiry", async () => {
    const expiresAt = Date.now() + 240000;
    const order = makeOrder({
      paymentMetadata: {
        provider: "qris",
        transaction_ref: "pay_existing",
        amount: 25123,
        expires_at: expiresAt,
      },
    });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });

    const res = await POST(createRequest({ orderId: ORDER_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      paymentId: "pay_existing",
      amount: 25123,
      expiresAt,
    });
    expect(mockCreateQrisPayment).not.toHaveBeenCalled();
    expect(mockGetQrisPayment).not.toHaveBeenCalled();
  });

  it("reconciles a stale stored payment and transitions the order to EXPIRED", async () => {
    const order = makeOrder({
      paymentMetadata: {
        provider: "qris",
        transaction_ref: "pay_stale",
        amount: 25123,
        expires_at: Date.now() - 1000,
      },
    });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    mockGetQrisPayment.mockResolvedValueOnce({
      success: true,
      data: { paymentId: "pay_stale", status: "expired", amount: 25123 },
    });
    mockProcessQrisPaymentEvent.mockResolvedValueOnce("expired");

    const res = await POST(createRequest({ orderId: ORDER_ID }));

    expect(res.status).toBe(410);
    expect(mockProcessQrisPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "pay_stale", status: "expired" }),
      expect.anything()
    );
    expect(mockCreateQrisPayment).not.toHaveBeenCalled();
  });

  it("settles a stale stored payment that the provider reports as paid", async () => {
    const order = makeOrder({
      paymentMetadata: {
        provider: "qris",
        transaction_ref: "pay_stale",
        amount: 25123,
        expires_at: Date.now() - 1000,
      },
    });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    mockGetQrisPayment.mockResolvedValueOnce({
      success: true,
      data: { paymentId: "pay_stale", status: "paid", amount: 25123, paidAmount: 25123 },
    });
    mockProcessQrisPaymentEvent.mockResolvedValueOnce("paid");

    const res = await POST(createRequest({ orderId: ORDER_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true, alreadyPaid: true });
    expect(mockProcessQrisPaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: "pay_stale", status: "paid", amount: 25123 }),
      expect.anything()
    );
  });

  it("keeps reusing the provider payment when it is still pending with a fresh expiry", async () => {
    const freshExpiry = Date.now() + 200000;
    const order = makeOrder({
      paymentMetadata: {
        provider: "qris",
        transaction_ref: "pay_stale",
        amount: 25123,
        expires_at: Date.now() - 1000,
      },
    });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    mockGetQrisPayment.mockResolvedValueOnce({
      success: true,
      data: { paymentId: "pay_stale", status: "pending", amount: 25123, expiresAt: freshExpiry },
    });

    const res = await POST(createRequest({ orderId: ORDER_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.paymentId).toBe("pay_stale");
    expect(body.expiresAt).toBe(freshExpiry);
    expect(order.paymentMetadata?.expires_at).toBe(freshExpiry);
    expect(mockCreateQrisPayment).not.toHaveBeenCalled();
  });

  it("creates a new payment, persists metadata, and clears the lease", async () => {
    const order = makeOrder();
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    mockCreateQrisPayment.mockResolvedValueOnce({
      success: true,
      data: { paymentId: "pay_new", status: "pending", amount: 25321, expiresAt: 1735689600000 },
    });

    const res = await POST(createRequest({ orderId: ORDER_ID }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({
      success: true,
      paymentId: "pay_new",
      amount: 25321,
      expiresAt: 1735689600000,
    });

    const createArgs = mockCreateQrisPayment.mock.calls[0][0];
    expect(createArgs.baseAmount).toBe(25000);
    expect(createArgs.timeout).toBe(300000);
    expect(createArgs.webhookUrl).toMatch(
      /^https:\/\/autobeli\.example\.com\/api\/webhooks\/qris\?attempt=.+/
    );

    expect(order.paymentMetadata).toEqual({
      provider: "qris",
      transaction_ref: "pay_new",
      amount: 25321,
      expires_at: 1735689600000,
    });
    expect(order.paymentCreationStartedAt).toBeUndefined();
    expect(order.paymentCreationAttempt).toBeUndefined();
  });

  it("returns 409 for an active creation lease instead of creating a second payment", async () => {
    const order = makeOrder({ paymentCreationStartedAt: new Date() });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });

    const res = await POST(createRequest({ orderId: ORDER_ID }));

    expect(res.status).toBe(409);
    expect(mockCreateQrisPayment).not.toHaveBeenCalled();
  });

  it("allows creation when the lease is stale", async () => {
    const order = makeOrder({
      paymentCreationStartedAt: new Date(Date.now() - 11 * 60 * 1000),
      paymentCreationAttempt: "old-nonce",
    });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    mockCreateQrisPayment.mockResolvedValueOnce({
      success: true,
      data: { paymentId: "pay_new", status: "pending", amount: 25100, expiresAt: 1735689600000 },
    });

    const res = await POST(createRequest({ orderId: ORDER_ID }));

    expect(res.status).toBe(200);
    expect(mockCreateQrisPayment).toHaveBeenCalledTimes(1);
    expect(order.paymentMetadata?.transaction_ref).toBe("pay_new");
  });

  it("keeps the lease and returns 504 for an indeterminate provider outcome", async () => {
    const order = makeOrder();
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    mockCreateQrisPayment.mockResolvedValueOnce({
      success: false,
      error: "Qris request failed",
      indeterminate: true,
    });

    const res = await POST(createRequest({ orderId: ORDER_ID }));

    expect(res.status).toBe(504);
    expect(order.paymentCreationStartedAt).toBeDefined();
    expect(order.paymentCreationAttempt).toBeDefined();
    expect(order.paymentMetadata).toBeUndefined();
  });

  it("clears the lease and returns 502 for a known-safe provider rejection", async () => {
    const order = makeOrder();
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    mockCreateQrisPayment.mockResolvedValueOnce({
      success: false,
      error: "Order total is outside the supported payment range.",
      code: "INVALID_BASE_AMOUNT",
      indeterminate: false,
    });

    const res = await POST(createRequest({ orderId: ORDER_ID }));
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.error).toBe("Order total is outside the supported payment range.");
    expect(order.paymentCreationStartedAt).toBeUndefined();
    expect(order.paymentCreationAttempt).toBeUndefined();
    expect(order.paymentMetadata).toBeUndefined();
  });

  it("clears old metadata and creates a new payment for a retried expired order", async () => {
    const order = makeOrder({
      status: "EXPIRED",
      paymentMetadata: {
        provider: "qris",
        transaction_ref: "pay_old",
        amount: 25123,
        expires_at: Date.now() - 60000,
      },
    });
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });
    mockCreateQrisPayment.mockResolvedValueOnce({
      success: true,
      data: { paymentId: "pay_retry", status: "pending", amount: 25444, expiresAt: 1735689600000 },
    });

    const res = await POST(createRequest({ orderId: ORDER_ID, retry: true }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.paymentId).toBe("pay_retry");
    expect(order.status).toBe("PENDING");
    expect(order.paymentMetadata?.transaction_ref).toBe("pay_retry");
  });

  it("creates exactly one provider payment for concurrent create attempts", async () => {
    const order = makeOrder();
    mockGetMongoClient.mockResolvedValue({ db: () => createFakeDb(order, makeProduct()) });

    let resolveCreate: ((value: unknown) => void) | undefined;
    mockCreateQrisPayment.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve;
        })
    );

    const first = POST(createRequest({ orderId: ORDER_ID }));
    // Let the first request acquire the lease before the second arrives
    await new Promise((resolve) => setTimeout(resolve, 10));
    const second = await POST(createRequest({ orderId: ORDER_ID }));

    expect(second.status).toBe(409);

    resolveCreate!({
      success: true,
      data: { paymentId: "pay_once", status: "pending", amount: 25999, expiresAt: 1735689600000 },
    });
    const firstRes = await first;

    expect(firstRes.status).toBe(200);
    expect(mockCreateQrisPayment).toHaveBeenCalledTimes(1);
    expect(order.paymentMetadata?.transaction_ref).toBe("pay_once");
  });
});
