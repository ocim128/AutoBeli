/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  findOne: vi.fn(),
  updateOne: vi.fn(),
  getMongoClient: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getMongoClient: mocks.getMongoClient,
}));

import { PATCH } from "@/app/api/orders/route";

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
