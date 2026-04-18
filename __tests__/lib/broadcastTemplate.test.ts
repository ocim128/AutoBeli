/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import {
  buildProductBroadcastBody,
  buildProductBroadcastSubject,
  buildProductUrl,
} from "@/lib/broadcastTemplate";

describe("broadcast template helpers", () => {
  it("builds the fixed subject line", () => {
    expect(buildProductBroadcastSubject("Premium Access")).toBe("Baru tersedia: Premium Access");
  });

  it("builds a public product URL from the slug", () => {
    expect(buildProductUrl("premium-access")).toContain("/product/premium-access");
  });

  it("builds the fixed-body template with teaser and URL", () => {
    const body = buildProductBroadcastBody({
      productTitle: "Premium Access",
      teaser: "Stock baru sudah ready dan bisa langsung dicek.",
      productSlug: "premium-access",
    });

    expect(body).toContain("Premium Access baru saja tersedia.");
    expect(body).toContain("Stock baru sudah ready dan bisa langsung dicek.");
    expect(body).toContain("/product/premium-access");
  });
});
