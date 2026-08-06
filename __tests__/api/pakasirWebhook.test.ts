/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import type { Order, Product } from "@/lib/definitions";

const mockGetMongoClient = vi.fn();
const mockGetPakasirTransactionStatus = vi.fn();
const mockHandleSuccessfulPayment = vi.fn();

vi.mock("@/lib/db", () => ({
  getMongoClient: () => mockGetMongoClient(),
}));

vi.mock("@/lib/pakasir", () => ({
  getPakasirTransactionStatus: (...args: unknown[]) => mockGetPakasirTransactionStatus(...args),
}));

vi.mock("@/lib/orders", () => ({
  handleSuccessfulPayment: (...args: unknown[]) => mockHandleSuccessfulPayment(...args),
}));

import { POST } from "@/app/api/webhooks/pakasir/route";

const ORDER_ID = "64b64c7f9f1b2c0012345700";
const PRODUCT_ID = "64b64c7f9f1b2c0012345701";
const originalEnv = { ...process.env };

function makeOrder(paymentGateway: Order["paymentGateway"]): Order {
  return {
    _id: new ObjectId(ORDER_ID),
    productId: new ObjectId(PRODUCT_ID),
    quantity: 1,
    status: "PENDING",
    amountPaid: 0,
    paymentGateway,
    paymentMetadata:
      paymentGateway === "PAKASIR" ? { provider: "pakasir", transaction_ref: ORDER_ID } : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const product: Product = {
  _id: new ObjectId(PRODUCT_ID),
  title: "Test product",
  slug: "test-product",
  description: "",
  priceIdr: 25000,
  contentEncrypted: "encrypted",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createRequest(body: unknown): Request {
  return new Request("http://localhost/api/webhooks/pakasir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function setDatabase(order: Order) {
  mockGetMongoClient.mockResolvedValue({
    db: () => ({
      collection: (name: string) => ({
        findOne: vi.fn(async () => (name === "orders" ? order : product)),
      }),
    }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NODE_ENV = "test";
  mockGetPakasirTransactionStatus.mockResolvedValue({
    success: true,
    data: {
      transaction: {
        amount: 25000,
        order_id: ORDER_ID,
        project: "configured-project",
        status: "pending",
        payment_method: "qris",
      },
    },
  });
});

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("POST /api/webhooks/pakasir", () => {
  it("cannot settle a QRIS order through the legacy webhook", async () => {
    const order = makeOrder("QRIS");
    setDatabase(order);

    const response = await POST(
      createRequest({
        order_id: ORDER_ID,
        amount: 25000,
        project: "test-project",
        status: "completed",
      })
    );

    expect(response.status).toBe(400);
    expect(mockGetPakasirTransactionStatus).not.toHaveBeenCalled();
    expect(mockHandleSuccessfulPayment).not.toHaveBeenCalled();
  });

  it("does not treat a test project as paid in production", async () => {
    process.env.NODE_ENV = "production";
    const order = makeOrder("PAKASIR");
    setDatabase(order);

    const response = await POST(
      createRequest({
        order_id: ORDER_ID,
        amount: 25000,
        project: "test-project",
        status: "completed",
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: false, message: "Not completed" });
    expect(mockGetPakasirTransactionStatus).toHaveBeenCalledWith(ORDER_ID, 25000);
    expect(mockHandleSuccessfulPayment).not.toHaveBeenCalled();
  });
});
