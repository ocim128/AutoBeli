/**
 * @vitest-environment node
 */
import { describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";
import { ensureAccessToken } from "@/lib/tokens";
import type { AccessToken } from "@/lib/definitions";

describe("token helpers", () => {
  it("creates tokens with an idempotent upsert", async () => {
    const orderId = new ObjectId("64b64c7f9f1b2c0012345678");
    const tokenRecord: AccessToken = {
      _id: new ObjectId("64b64c7f9f1b2c0012345679"),
      orderId,
      token: "existing-token",
      usageCount: 0,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
    };
    const findOneAndUpdate = vi.fn().mockResolvedValue(tokenRecord);
    const db = {
      collection: vi.fn(() => ({ findOneAndUpdate })),
    };

    const token = await ensureAccessToken(orderId.toString(), db as never);

    expect(token).toBe("existing-token");
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { orderId },
      expect.objectContaining({
        $setOnInsert: expect.objectContaining({
          orderId,
          usageCount: 0,
        }),
      }),
      {
        upsert: true,
        returnDocument: "after",
      }
    );
  });
});
