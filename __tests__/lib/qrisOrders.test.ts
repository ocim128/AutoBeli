/**
 * @vitest-environment node
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { processQrisPaymentEvent, syncOrderPaymentStatus } from "@/lib/orders";
import type { AccessToken, Order, Product } from "@/lib/definitions";

vi.mock("@/lib/email", () => ({
  sendOrderConfirmationEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/audience", () => ({
  upsertAudienceFromPaidOrder: vi.fn(async () => {}),
}));

const mockGetQrisPayment = vi.fn();

vi.mock("@/lib/qris", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/qris")>();
  return {
    ...original,
    getQrisPayment: (...args: unknown[]) => mockGetQrisPayment(...args),
  };
});

const mockGetMongoClient = vi.fn();

vi.mock("@/lib/db", () => ({
  getMongoClient: () => mockGetMongoClient(),
}));

function idMatches(a: unknown, b: unknown): boolean {
  return a?.toString() === b?.toString();
}

function applyUpdate(
  doc: Record<string, unknown>,
  update: { $set?: Record<string, unknown>; $unset?: Record<string, unknown> }
) {
  Object.assign(doc, update.$set || {});
  for (const key of Object.keys(update.$unset || {})) {
    delete doc[key];
  }
}

function matchesOrderFilter(order: Order, filter: Record<string, unknown>): boolean {
  if (filter._id && !idMatches(filter._id, order._id)) return false;

  if (filter.status !== undefined) {
    if (typeof filter.status === "string" && order.status !== filter.status) return false;
    if (
      typeof filter.status === "object" &&
      filter.status !== null &&
      "$ne" in filter.status &&
      order.status === (filter.status as { $ne: string }).$ne
    ) {
      return false;
    }
  }

  if (
    filter["paymentMetadata.provider"] &&
    order.paymentMetadata?.provider !== filter["paymentMetadata.provider"]
  ) {
    return false;
  }

  const txRefFilter = filter["paymentMetadata.transaction_ref"];
  if (txRefFilter !== undefined) {
    if (typeof txRefFilter === "object" && txRefFilter !== null) {
      if (
        (txRefFilter as { $exists?: boolean }).$exists === false &&
        order.paymentMetadata?.transaction_ref !== undefined
      ) {
        return false;
      }
    } else if (order.paymentMetadata?.transaction_ref !== txRefFilter) {
      return false;
    }
  }

  if (
    filter.paymentCreationAttempt &&
    order.paymentCreationAttempt !== filter.paymentCreationAttempt
  ) {
    return false;
  }

  if (Array.isArray(filter.$or)) {
    const clauses = filter.$or as Record<string, { $exists?: boolean; $lt?: Date }>[];
    const ok = clauses.some((clause) => {
      const completionLock = clause.paymentCompletionStartedAt as
        | { $exists?: boolean; $lt?: Date }
        | undefined;
      if (completionLock?.$exists === false) return order.paymentCompletionStartedAt === undefined;
      if (completionLock?.$lt instanceof Date) {
        return (
          order.paymentCompletionStartedAt !== undefined &&
          new Date(order.paymentCompletionStartedAt) < completionLock.$lt
        );
      }
      return false;
    });
    if (!ok) return false;
  }

  return true;
}

function createFakeDb(order: Order, product: Product) {
  const tokens: AccessToken[] = [];
  const productUpdates: unknown[] = [];

  const orders = {
    findOne: vi.fn(async (filter: Record<string, unknown>) =>
      matchesOrderFilter(order, filter) ? order : null
    ),
    findOneAndUpdate: vi.fn(
      async (
        filter: Record<string, unknown>,
        update: { $set?: Record<string, unknown>; $unset?: Record<string, unknown> }
      ) => {
        if (!matchesOrderFilter(order, filter)) return null;
        applyUpdate(order as unknown as Record<string, unknown>, update);
        return order;
      }
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
    updateOne: vi.fn(
      async (
        filter: Record<string, unknown>,
        update: { $set?: Record<string, unknown>; $unset?: Record<string, unknown> }
      ) => {
        if (!idMatches(filter._id, product._id)) return { modifiedCount: 0, matchedCount: 0 };
        if (filter.$or && product.isSold) return { modifiedCount: 0, matchedCount: 1 };

        productUpdates.push(update);
        applyUpdate(product as unknown as Record<string, unknown>, update);
        return { modifiedCount: 1, matchedCount: 1 };
      }
    ),
  };

  const tokenCollection = {
    findOneAndUpdate: vi.fn(
      async (filter: { orderId: ObjectId }, update: { $setOnInsert: AccessToken }) => {
        let token = tokens.find((entry) => idMatches(entry.orderId, filter.orderId));
        if (!token) {
          token = { _id: new ObjectId(), ...update.$setOnInsert };
          tokens.push(token);
        }
        return token;
      }
    ),
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

function makeQrisOrder(overrides: Partial<Order> = {}): Order {
  return {
    _id: new ObjectId("64b64c7f9f1b2c0012345690"),
    productId: new ObjectId("64b64c7f9f1b2c0012345691"),
    quantity: 1,
    status: "PENDING",
    amountPaid: 0,
    paymentGateway: "QRIS",
    paymentMetadata: {
      provider: "qris",
      transaction_ref: "pay_abc",
      amount: 25123,
      expires_at: Date.now() + 300000,
    },
    customerContact: "buyer@example.com",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    _id: new ObjectId("64b64c7f9f1b2c0012345691"),
    title: "Legacy Product",
    slug: "legacy-product",
    description: "",
    priceIdr: 25000,
    contentEncrypted: "encrypted",
    isActive: true,
    isSold: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // clearAllMocks clears call history but not queued mockResolvedValueOnce
  // responses; reset so a leftover from one test cannot fulfill another.
  mockGetQrisPayment.mockReset();
});

describe("processQrisPaymentEvent", () => {
  it("fulfills a paid event using the stored final amount", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25123 },
      fake.db as never
    );

    expect(result).toBe("paid");
    expect(order.status).toBe("PAID");
    expect(order.amountPaid).toBe(25123); // final Qris amount, not the product total
    expect(product.isSold).toBe(true);
    expect(fake.tokens).toHaveLength(1);
  });

  it("treats a duplicate paid event as a successful no-op", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const first = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25123 },
      fake.db as never
    );
    const second = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25123 },
      fake.db as never
    );

    expect(first).toBe("paid");
    expect(second).toBe("already_paid");
    expect(fake.tokens).toHaveLength(1);
    expect(fake.productUpdates).toHaveLength(1);
  });

  it("ignores a paid event whose amount differs from the stored final amount", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25000 },
      fake.db as never
    );

    expect(result).toBe("ignored");
    expect(order.status).toBe("PENDING");
    expect(product.isSold).toBe(false);
    expect(fake.tokens).toHaveLength(0);
  });

  it("ignores a paid event whose paid_amount differs from the stored final amount", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25123, paidAmount: 25000 },
      fake.db as never
    );

    expect(result).toBe("ignored");
    expect(order.status).toBe("PENDING");
  });

  it("ignores a late paid event for an expired order", async () => {
    const order = makeQrisOrder({ status: "EXPIRED" });
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25123 },
      fake.db as never
    );

    expect(result).toBe("ignored");
    expect(order.status).toBe("EXPIRED");
    expect(fake.tokens).toHaveLength(0);
  });

  it("transitions PENDING to EXPIRED on an expired event without side effects", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "expired", amount: 25123 },
      fake.db as never
    );

    expect(result).toBe("expired");
    expect(order.status).toBe("EXPIRED");
    expect(product.isSold).toBe(false);
    expect(fake.tokens).toHaveLength(0);
  });

  it("keeps a paid order paid when an expired event arrives", async () => {
    const order = makeQrisOrder({ status: "PAID", amountPaid: 25123 });
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "expired", amount: 25123 },
      fake.db as never
    );

    expect(result).toBe("already_paid");
    expect(order.status).toBe("PAID");
  });

  it("ignores an expired event whose amount differs from the stored amount", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "expired", amount: 9999 },
      fake.db as never
    );

    expect(result).toBe("ignored");
    expect(order.status).toBe("PENDING");
    expect(product.isSold).toBe(false);
  });

  it("ignores events for unknown payment IDs", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_unknown", status: "paid", amount: 25123 },
      fake.db as never
    );

    expect(result).toBe("ignored");
    expect(order.status).toBe("PENDING");
  });

  it("ignores a late event for an old payment ID after a retry", async () => {
    const order = makeQrisOrder({
      paymentMetadata: { provider: "qris", transaction_ref: "pay_new", amount: 25200 },
    });
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_old", status: "paid", amount: 25123 },
      fake.db as never
    );

    expect(result).toBe("ignored");
    expect(order.status).toBe("PENDING");
    expect(order.paymentMetadata?.transaction_ref).toBe("pay_new");
  });

  it("recovers metadata through the attempt nonce and fulfills", async () => {
    const order = makeQrisOrder({
      paymentMetadata: undefined,
      paymentCreationStartedAt: new Date(),
      paymentCreationAttempt: "nonce-1",
    });
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      {
        paymentId: "pay_abc",
        status: "paid",
        amount: 25123,
        expiresAt: 1735689600000,
        attempt: "nonce-1",
      },
      fake.db as never
    );

    expect(result).toBe("paid");
    expect(order.paymentMetadata).toEqual({
      provider: "qris",
      transaction_ref: "pay_abc",
      amount: 25123,
      expires_at: 1735689600000,
    });
    expect(order.paymentCreationStartedAt).toBeUndefined();
    expect(order.paymentCreationAttempt).toBeUndefined();
    expect(order.status).toBe("PAID");
    expect(fake.tokens).toHaveLength(1);
  });

  it("does not attach an event to an order holding a different payment ID", async () => {
    const order = makeQrisOrder({
      paymentMetadata: { provider: "qris", transaction_ref: "pay_other", amount: 25123 },
      paymentCreationStartedAt: new Date(),
      paymentCreationAttempt: "nonce-1",
    });
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25123, attempt: "nonce-1" },
      fake.db as never
    );

    expect(result).toBe("ignored");
    expect(order.paymentMetadata?.transaction_ref).toBe("pay_other");
    expect(order.status).toBe("PENDING");
  });

  it("returns a transient error when the stored final amount is missing", async () => {
    const order = makeQrisOrder({
      paymentMetadata: { provider: "qris", transaction_ref: "pay_abc" },
    });
    const product = makeProduct();
    const fake = createFakeDb(order, product);

    const result = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25123 },
      fake.db as never
    );

    expect(result).toBe("error");
    expect(order.status).toBe("PENDING");
  });
});

describe("syncOrderPaymentStatus (qris branch)", () => {
  it("fulfills a paid provider payment exactly once across webhook and poll", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);
    mockGetMongoClient.mockResolvedValue({ db: () => fake.db });

    // Webhook path completes the order first
    const webhookResult = await processQrisPaymentEvent(
      { paymentId: "pay_abc", status: "paid", amount: 25123 },
      fake.db as never
    );
    expect(webhookResult).toBe("paid");

    // Poll fallback must not duplicate stock, tokens, or emails
    mockGetQrisPayment.mockResolvedValue({
      success: true,
      data: {
        paymentId: "pay_abc",
        status: "paid",
        amount: 25123,
        paidAmount: 25123,
      },
    });

    const synced = await syncOrderPaymentStatus(order._id!.toString());

    expect(synced).toBe(false);
    expect(order.status).toBe("PAID");
    expect(fake.tokens).toHaveLength(1);
    expect(fake.productUpdates).toHaveLength(1);
  });

  it("fulfills through the poll fallback when the webhook was missed", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);
    mockGetMongoClient.mockResolvedValue({ db: () => fake.db });

    mockGetQrisPayment.mockResolvedValueOnce({
      success: true,
      data: {
        paymentId: "pay_abc",
        status: "paid",
        amount: 25123,
        paidAmount: 25123,
      },
    });

    const synced = await syncOrderPaymentStatus(order._id!.toString());

    expect(synced).toBe(true);
    expect(order.status).toBe("PAID");
    expect(order.amountPaid).toBe(25123);
    expect(fake.tokens).toHaveLength(1);
  });

  it("does not fulfill a poll whose amount was not recorded at creation", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);
    mockGetMongoClient.mockResolvedValue({ db: () => fake.db });

    mockGetQrisPayment.mockResolvedValueOnce({
      success: true,
      data: { paymentId: "pay_abc", status: "paid", amount: 25000, paidAmount: 25000 },
    });

    const synced = await syncOrderPaymentStatus(order._id!.toString());

    expect(synced).toBe(false);
    expect(order.status).toBe("PENDING");
    expect(fake.tokens).toHaveLength(0);
  });

  it("expires a pending order when the provider reports expiry", async () => {
    const order = makeQrisOrder();
    const product = makeProduct();
    const fake = createFakeDb(order, product);
    mockGetMongoClient.mockResolvedValue({ db: () => fake.db });

    mockGetQrisPayment.mockResolvedValueOnce({
      success: true,
      data: { paymentId: "pay_abc", status: "expired", amount: 25123 },
    });

    const synced = await syncOrderPaymentStatus(order._id!.toString());

    expect(synced).toBe(false);
    expect(order.status).toBe("EXPIRED");
    expect(product.isSold).toBe(false);
    expect(fake.tokens).toHaveLength(0);
  });
});
