/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { handleSuccessfulPayment } from "@/lib/orders";
import type { AccessToken, Order, Product } from "@/lib/definitions";

vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn(),
}));

vi.mock("@/lib/audience", () => ({
  upsertAudienceFromPaidOrder: vi.fn(),
}));

function idMatches(a: unknown, b: unknown): boolean {
  return a?.toString() === b?.toString();
}

function applyUpdate<T extends Record<string, unknown>>(
  doc: T,
  update: { $set?: Record<string, unknown>; $unset?: Record<string, unknown> }
) {
  Object.assign(doc, update.$set || {});

  for (const key of Object.keys(update.$unset || {})) {
    delete doc[key];
  }
}

function createFakeDb(order: Order, product: Product) {
  const tokens: AccessToken[] = [];
  const productUpdates: unknown[] = [];

  const orders = {
    findOne: vi.fn(async (filter: { _id: ObjectId }) =>
      idMatches(filter._id, order._id) ? order : null
    ),
    updateOne: vi.fn(async (filter: Record<string, unknown>, update: never) => {
      if (!idMatches(filter._id, order._id)) return { modifiedCount: 0, matchedCount: 0 };

      if (
        filter.status &&
        typeof filter.status === "object" &&
        "$ne" in filter.status &&
        order.status === filter.status.$ne
      ) {
        return { modifiedCount: 0, matchedCount: 1 };
      }

      if (filter.$or && order.paymentCompletionStartedAt) {
        return { modifiedCount: 0, matchedCount: 1 };
      }

      applyUpdate(order as unknown as Record<string, unknown>, update);
      return { modifiedCount: 1, matchedCount: 1 };
    }),
  };

  const products = {
    findOne: vi.fn(async (filter: { _id: ObjectId }) =>
      idMatches(filter._id, product._id) ? product : null
    ),
    updateOne: vi.fn(async (filter: Record<string, unknown>, update: never) => {
      if (!idMatches(filter._id, product._id)) return { modifiedCount: 0, matchedCount: 0 };
      if (filter.$or && product.isSold) return { modifiedCount: 0, matchedCount: 1 };

      productUpdates.push(update);
      applyUpdate(product as unknown as Record<string, unknown>, update);
      return { modifiedCount: 1, matchedCount: 1 };
    }),
  };

  const tokenCollection = {
    findOneAndUpdate: vi.fn(async (filter: { orderId: ObjectId }, update: never) => {
      let token = tokens.find((entry) => idMatches(entry.orderId, filter.orderId));

      if (!token) {
        token = {
          _id: new ObjectId(),
          ...(update.$setOnInsert as AccessToken),
        };
        tokens.push(token);
      }

      return token;
    }),
  };

  const db = {
    collection: vi.fn((name: string) => {
      if (name === "orders") return orders;
      if (name === "products") return products;
      if (name === "tokens") return tokenCollection;
      throw new Error(`Unexpected collection: ${name}`);
    }),
  };

  return { db, orders, products, tokens, productUpdates };
}

describe("handleSuccessfulPayment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is idempotent for replayed legacy-product completions", async () => {
    const productId = new ObjectId("64b64c7f9f1b2c0012345678");
    const orderId = new ObjectId("64b64c7f9f1b2c0012345679");
    const order: Order = {
      _id: orderId,
      productId,
      status: "PENDING",
      amountPaid: 0,
      paymentGateway: "PAKASIR",
      paymentMetadata: { provider: "pakasir", transaction_ref: orderId.toString() },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const product: Product = {
      _id: productId,
      title: "Legacy Product",
      slug: "legacy-product",
      description: "",
      priceIdr: 10000,
      contentEncrypted: "encrypted",
      isActive: true,
      isSold: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const fake = createFakeDb(order, product);

    const first = await handleSuccessfulPayment({
      orderId: orderId.toString(),
      order,
      product,
      amount: 10000,
      db: fake.db as never,
    });
    const second = await handleSuccessfulPayment({
      orderId: orderId.toString(),
      order,
      product,
      amount: 10000,
      db: fake.db as never,
    });

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(order.status).toBe("PAID");
    expect(product.isSold).toBe(true);
    expect(fake.tokens).toHaveLength(1);
    expect(fake.productUpdates).toHaveLength(1);
  });

  it("recovers when stock was assigned before the order was marked paid", async () => {
    const productId = new ObjectId("64b64c7f9f1b2c0012345680");
    const orderId = new ObjectId("64b64c7f9f1b2c0012345681");
    const order: Order = {
      _id: orderId,
      productId,
      quantity: 1,
      status: "PENDING",
      amountPaid: 0,
      paymentGateway: "PAKASIR",
      paymentMetadata: { provider: "pakasir", transaction_ref: orderId.toString() },
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const product: Product = {
      _id: productId,
      title: "Stock Product",
      slug: "stock-product",
      description: "",
      priceIdr: 10000,
      isActive: true,
      isSold: false,
      stockItems: [
        {
          id: "stock-1",
          contentEncrypted: "encrypted",
          isSold: true,
          orderId,
          soldAt: new Date("2026-01-01T00:00:01.000Z"),
        },
      ],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const fake = createFakeDb(order, product);

    const result = await handleSuccessfulPayment({
      orderId: orderId.toString(),
      order,
      product,
      amount: 10000,
      db: fake.db as never,
    });

    expect(result).toBe(true);
    expect(order.status).toBe("PAID");
    expect(order.stockItemId).toBe("stock-1");
    expect(order.stockItemIds).toEqual(["stock-1"]);
    expect(fake.tokens).toHaveLength(1);
    expect(fake.productUpdates).toHaveLength(0);
  });
});
