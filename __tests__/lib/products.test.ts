import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import { serializeProductForClient } from "@/lib/products";
import type { Product } from "@/lib/definitions";

describe("product serialization", () => {
  it("does not expose stock item internals to public clients", () => {
    const product = {
      _id: new ObjectId("64b64c7f9f1b2c0012345678"),
      title: "Premium Access",
      slug: "premium-access",
      description: "Digital access",
      priceIdr: 50000,
      isActive: true,
      isSold: false,
      availableStock: 1,
      stockItems: [
        {
          id: "stock-1",
          contentEncrypted: "secret",
          isSold: false,
          orderId: new ObjectId("64b64c7f9f1b2c0012345679"),
        },
      ],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    } satisfies Product & { availableStock: number };

    const serialized = serializeProductForClient(product);

    expect(serialized).toMatchObject({
      _id: "64b64c7f9f1b2c0012345678",
      title: "Premium Access",
      availableStock: 1,
    });
    expect(serialized).not.toHaveProperty("stockItems");
    expect(JSON.stringify(serialized)).not.toContain("secret");
    expect(JSON.stringify(serialized)).not.toContain("stock-1");
  });
});
