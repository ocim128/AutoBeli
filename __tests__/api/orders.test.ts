/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  findOne: vi.fn(),
  updateOne: vi.fn(),
  countDocuments: vi.fn(),
  insertOne: vi.fn(),
  getMongoClient: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getMongoClient: mocks.getMongoClient,
}));

vi.mock("@/lib/paymentGateway", () => ({ getPaymentGateway: () => "MOCK" }));

import { PATCH, POST } from "@/app/api/orders/route";

const ORDER_ID = "507f1f77bcf86cd799439011";

function request(contact = "buyer@example.com"): Request {
  return new Request("http://localhost/api/orders", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "198.51.100.10",
    },
    body: JSON.stringify({ orderId: ORDER_ID, contact }),
  });
}

describe("PATCH /api/orders", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collection.mockReturnValue({
      findOne: mocks.findOne,
      updateOne: mocks.updateOne,
    });
    mocks.getMongoClient.mockResolvedValue({
      db: () => ({ collection: mocks.collection }),
    });
    mocks.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  });

  it("rejects contact changes for paid orders", async () => {
    mocks.findOne.mockResolvedValue({ _id: new ObjectId(ORDER_ID), status: "PAID" });

    const response = await PATCH(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Customer contact cannot be changed after payment",
    });
    expect(mocks.updateOne).not.toHaveBeenCalled();
  });

  it("updates a non-paid order and normalizes the contact", async () => {
    mocks.findOne.mockResolvedValue({ _id: new ObjectId(ORDER_ID), status: "PENDING" });

    const response = await PATCH(request(" Buyer@Example.com "));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.updateOne).toHaveBeenCalledWith(
      { _id: expect.any(ObjectId), status: { $ne: "PAID" } },
      {
        $set: {
          customerContact: "buyer@example.com",
          updatedAt: expect.any(Date),
        },
      }
    );
  });

  it("rejects when payment wins the race before the conditional update", async () => {
    mocks.findOne.mockResolvedValue({ _id: new ObjectId(ORDER_ID), status: "PENDING" });
    mocks.updateOne.mockResolvedValue({ matchedCount: 0, modifiedCount: 0 });

    const response = await PATCH(request());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: "Customer contact cannot be changed after payment",
    });
    expect(mocks.updateOne).toHaveBeenCalledWith(
      { _id: expect.any(ObjectId), status: { $ne: "PAID" } },
      expect.any(Object)
    );
  });
});

describe("POST /api/orders overload guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.collection.mockReturnValue({
      countDocuments: mocks.countDocuments,
      findOne: mocks.findOne,
      insertOne: mocks.insertOne,
    });
    mocks.getMongoClient.mockResolvedValue({ db: () => ({ collection: mocks.collection }) });
    mocks.findOne.mockResolvedValue({ _id: new ObjectId(), isSold: false, priceIdr: 10000 });
    mocks.insertOne.mockResolvedValue({ insertedId: new ObjectId() });
  });

  it.each([50, 51, 500])("preserves the threshold with %i recent orders", async (count) => {
    mocks.countDocuments.mockResolvedValue(Math.min(count, 51));
    const response = await POST(
      new Request("http://localhost/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": `198.51.100.${count % 255}`,
        },
        body: JSON.stringify({ slug: "test-product" }),
      })
    );
    expect(response.status).toBe(count > 50 ? 429 : 200);
    expect(mocks.countDocuments).toHaveBeenCalledWith(
      {
        status: "PENDING",
        createdAt: { $gt: expect.any(Date) },
      },
      { limit: 51 }
    );
    expect(mocks.insertOne).toHaveBeenCalledTimes(count > 50 ? 0 : 1);
  });
});
