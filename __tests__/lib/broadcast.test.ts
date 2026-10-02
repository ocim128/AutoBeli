import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import type { Db } from "mongodb";
import type { Product } from "@/lib/definitions";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  recipients: vi.fn(),
  send: vi.fn(),
}));
vi.mock("@/lib/audience", () => ({
  countAudienceRecipientsForProductBroadcast: mocks.count,
  getAudienceRecipientsForProductBroadcast: mocks.recipients,
}));
vi.mock("@/lib/email", () => ({ sendPlainTextEmail: mocks.send }));

import { getBroadcastRecipientCount, sendProductBroadcast } from "@/lib/broadcast";

const product: Product = {
  _id: new ObjectId(),
  title: "Test product",
  slug: "test-product",
  description: "",
  priceIdr: 10000,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const db = {} as Db;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("BROADCAST_MAX_RECIPIENTS", "2");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("broadcast recipient limits", () => {
  it("counts eligible recipients without loading their rows", async () => {
    mocks.count.mockResolvedValue(10000);
    await expect(getBroadcastRecipientCount(product._id!, db)).resolves.toBe(10000);
    expect(mocks.recipients).not.toHaveBeenCalled();
  });

  it("rejects an oversized audience before loading or sending", async () => {
    mocks.count.mockResolvedValue(10000);
    await expect(sendProductBroadcast({ product, teaser: "Test", db })).resolves.toMatchObject({
      success: false,
      recipientCount: 10000,
      sentCount: 0,
      error: "Recipient count 10000 exceeds the limit of 2",
    });
    expect(mocks.recipients).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("rejects additions beyond the cap between counting and loading", async () => {
    mocks.count.mockResolvedValue(2);
    mocks.recipients.mockResolvedValue([
      { email: "one@example.com" },
      { email: "two@example.com" },
      { email: "three@example.com" },
    ]);
    await expect(sendProductBroadcast({ product, teaser: "Test", db })).resolves.toMatchObject({
      success: false,
      recipientCount: 3,
      sentCount: 0,
    });
    expect(mocks.recipients).toHaveBeenCalledWith(product._id, db, 3);
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it("sends to every eligible contact when the audience is exactly at the cap", async () => {
    mocks.count.mockResolvedValue(2);
    mocks.recipients.mockResolvedValue([
      { email: "one@example.com" },
      { email: "two@example.com" },
    ]);
    mocks.send.mockResolvedValue({ success: true });
    const insertOne = vi.fn().mockResolvedValue({});
    const database = { collection: () => ({ insertOne }) } as unknown as Db;

    await expect(
      sendProductBroadcast({ product, teaser: "Test", db: database })
    ).resolves.toMatchObject({
      success: true,
      recipientCount: 2,
      sentCount: 2,
      failedCount: 0,
    });
    expect(mocks.send.mock.calls.map(([email]) => email)).toEqual([
      "one@example.com",
      "two@example.com",
    ]);
    expect(insertOne).toHaveBeenCalledOnce();
  });
});
