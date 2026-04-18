/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { buildAllEmails, isTestEmail, isValidEmail, normalizeEmail } from "@/lib/audience";

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
