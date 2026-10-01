/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import type { Db } from "mongodb";
import {
  buildAllEmails,
  getAudienceList,
  isTestEmail,
  isValidEmail,
  normalizeEmail,
} from "@/lib/audience";

describe("audience helpers", () => {
  it("normalizes email casing and whitespace", () => {
    expect(normalizeEmail("  Buyer@Example.COM  ")).toBe("buyer@example.com");
  });

  it("builds a unique canonical-plus-alias email list", () => {
    expect(
      buildAllEmails("Buyer@example.com", [
        "old@example.com",
        " buyer@example.com ",
        "old@example.com",
      ])
    ).toEqual(["buyer@example.com", "old@example.com"]);
  });

  it("detects valid and invalid email formats", () => {
    expect(isValidEmail("buyer@example.com")).toBe(true);
    expect(isValidEmail("not-an-email")).toBe(false);
  });

  it("flags the known test email", () => {
    expect(isTestEmail("customer@example.com")).toBe(true);
    expect(isTestEmail("realbuyer@example.com")).toBe(false);
  });
});

it("fetches the audience page while its count is pending", async () => {
  let finishCount!: (count: number) => void;
  const count = new Promise<number>((resolve) => {
    finishCount = resolve;
  });
  const row = { email: "buyer@example.com", allEmails: ["buyer@example.com"] };
  const toArray = vi.fn().mockResolvedValue([row]);
  const cursor = {
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray,
  };
  const db = {
    collection: (name: string) =>
      name === "audiences"
        ? {
            estimatedDocumentCount: async () => 1,
            countDocuments: () => count,
            find: () => cursor,
          }
        : { aggregate: () => ({ toArray: async () => [] }) },
  } as unknown as Db;

  const result = getAudienceList({ page: 2, pageSize: 20 }, db);
  await vi.waitFor(() => expect(toArray).toHaveBeenCalledOnce());
  finishCount(21);
  await expect(result).resolves.toEqual({
    total: 21,
    rows: [{ ...row, totalPaidOrders: 0, firstPaidOrderAt: null, lastPaidOrderAt: null }],
  });
  expect(cursor.skip).toHaveBeenCalledWith(20);
  expect(cursor.limit).toHaveBeenCalledWith(20);
});
