/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import type { AccessToken, Order, Product } from "@/lib/definitions";

const mocks = vi.hoisted(() => ({
  getMongoClient: vi.fn(),
  tokenFindOne: vi.fn(),
  tokenUpdateOne: vi.fn(),
  orderFindOne: vi.fn(),
  productFindOne: vi.fn(),
  checkRateLimit: vi.fn(),
  decryptContent: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ getMongoClient: mocks.getMongoClient }));
vi.mock("@/lib/crypto", () => ({ decryptContent: mocks.decryptContent }));
vi.mock("@/lib/rateLimit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/rateLimit")>()),
  checkRateLimit: mocks.checkRateLimit,
}));

import { GET } from "@/app/api/delivery/[token]/route";

function request(ip = "198.51.100.10") {
  return GET(
    new Request("http://localhost/api/delivery/secret-token", {
      headers: { "x-forwarded-for": ip },
    }),
    { params: Promise.resolve({ token: "secret-token" }) }
  );
}

describe("GET /api/delivery/[token]", () => {
  let token: AccessToken;
  let order: Order;
  let product: Product;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T15:00:00Z"));
    token = {
      _id: new ObjectId(),
      orderId: new ObjectId(),
      token: "secret-token",
      usageCount: 0,
      createdAt: new Date(),
    };
    product = {
      _id: new ObjectId(),
      title: "Premium access",
      slug: "premium-access",
      description: "Digital access",
      priceIdr: 50000,
      isActive: true,
      contentEncrypted: "encrypted-content",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    order = {
      _id: token.orderId,
      productId: product._id!,
      status: "PAID",
      amountPaid: 50000,
      paymentGateway: "QRIS",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mocks.checkRateLimit.mockReturnValue({ success: true });
    mocks.decryptContent.mockReturnValue("purchased content");
    // Return snapshots, as separate reads can see the same timestamp before either update.
    mocks.tokenFindOne.mockImplementation(async () => ({ ...token }));
    mocks.orderFindOne.mockImplementation(async () => ({ ...order }));
    mocks.productFindOne.mockImplementation(async () => ({ ...product }));
    mocks.tokenUpdateOne.mockImplementation(async (filter, update) => {
      const cutoff = filter.$or?.find(
        (condition: { lastAccessedAt?: { $lte?: Date } }) => condition.lastAccessedAt?.$lte
      )?.lastAccessedAt.$lte;
      if (cutoff && token.lastAccessedAt && token.lastAccessedAt > cutoff) {
        return { matchedCount: 0, modifiedCount: 0 };
      }
      token.lastAccessedAt = update.$set.lastAccessedAt;
      token.usageCount += update.$inc.usageCount;
      return { matchedCount: 1, modifiedCount: 1 };
    });
    mocks.getMongoClient.mockResolvedValue({
      db: () => ({
        collection: (name: string) => {
          if (name === "tokens")
            return { findOne: mocks.tokenFindOne, updateOne: mocks.tokenUpdateOne };
          if (name === "orders") return { findOne: mocks.orderFindOne };
          if (name === "products") return { findOne: mocks.productFindOne };
          throw new Error(`Unexpected collection: ${name}`);
        },
      }),
    });
  });

  afterEach(() => vi.useRealTimers());

  it("allows only one simultaneous delivery for a token, even from different IPs", async () => {
    const responses = await Promise.all([request(), request("198.51.100.11")]);

    expect(responses.map((response) => response.status).sort()).toEqual([200, 429]);
    const rejected = responses.find((response) => response.status === 429)!;
    expect(await rejected.json()).toEqual({ error: "Rate limit exceeded. Please wait." });
    expect(token.usageCount).toBe(1);
    expect(mocks.tokenUpdateOne).toHaveBeenCalledWith(
      {
        _id: token._id,
        $or: [
          { lastAccessedAt: { $exists: false } },
          { lastAccessedAt: { $lte: new Date(Date.now() - 2000) } },
        ],
      },
      { $inc: { usageCount: 1 }, $set: { lastAccessedAt: new Date() } }
    );
  });

  it("starts the cooldown when delivery is ready after a slow product lookup", async () => {
    mocks.productFindOne.mockImplementation(async () => {
      vi.setSystemTime(new Date(Date.now() + 5000));
      return product;
    });

    expect((await request()).status).toBe(200);
    expect(token.lastAccessedAt).toEqual(new Date());
    expect((await request()).status).toBe(429);
    expect(token.usageCount).toBe(1);
  });

  it("allows another delivery exactly two seconds after a successful delivery", async () => {
    const response = await request();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(await response.json()).toEqual({ content: "purchased content" });

    vi.setSystemTime(new Date(Date.now() + 1999));
    expect((await request()).status).toBe(429);
    vi.setSystemTime(new Date(Date.now() + 1));
    expect((await request()).status).toBe(200);
    expect(token.usageCount).toBe(2);
  });

  it("does not consume the cooldown or return content for an unpaid order", async () => {
    order.status = "PENDING";
    const response = await request();

    expect(response.status).toBe(403);
    expect(mocks.decryptContent).not.toHaveBeenCalled();
    expect(mocks.tokenUpdateOne).not.toHaveBeenCalled();
  });

  it("does not consume the cooldown when purchased content is unavailable", async () => {
    delete product.contentEncrypted;
    const response = await request();

    expect(response.status).toBe(404);
    expect(mocks.tokenUpdateOne).not.toHaveBeenCalled();
  });

  it.each(["single", "multiple"])(
    "preserves %s stock delivery and purchase templates",
    async (mode) => {
      delete product.contentEncrypted;
      product.stockItems = [
        { id: "purchased-1", isSold: true, contentEncrypted: "first" },
        { id: "unsold", isSold: false, contentEncrypted: "not-purchased" },
        { id: "purchased-2", isSold: true, contentEncrypted: "second" },
      ];
      product.postPurchaseTemplate = "Thanks for ordering {productTitle}!";
      if (mode === "single") order.stockItemId = "purchased-1";
      else order.stockItemIds = ["purchased-1", "purchased-2"];
      mocks.decryptContent.mockImplementation((content: string) => `decrypted ${content}`);

      const response = await request();

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        content:
          "Thanks for ordering Premium access!\n\ndecrypted first" +
          (mode === "multiple" ? "\n\n---\n\ndecrypted second" : ""),
      });
      expect(mocks.decryptContent).not.toHaveBeenCalledWith("not-purchased");
      expect(token.usageCount).toBe(1);
    }
  );

  it("keeps the IP rate limit ahead of database access", async () => {
    mocks.checkRateLimit.mockReturnValue({
      success: false,
      limit: 30,
      resetAt: Date.now() + 60000,
    });

    const response = await request();

    expect(response.status).toBe(429);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(mocks.getMongoClient).not.toHaveBeenCalled();
  });
});
