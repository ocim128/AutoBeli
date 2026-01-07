/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { validate, searchOrderSchema } from "@/lib/validation";

describe("searchOrderSchema", () => {
  const validOrderId = "a".repeat(24); // 24 hex chars
  const validEmail = "customer@example.com";

  // ============================================
  // Valid Cases
  // ============================================

  it("accepts valid order ID only", () => {
    const result = validate(searchOrderSchema, { orderId: validOrderId });
    expect(result.success).toBe(true);
    expect(result.data?.orderId).toBe(validOrderId);
  });

  it("accepts valid email only", () => {
    const result = validate(searchOrderSchema, { email: validEmail });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe(validEmail);
  });

  it("accepts both order ID and email", () => {
    const result = validate(searchOrderSchema, {
      orderId: validOrderId,
      email: validEmail,
    });
    expect(result.success).toBe(true);
    expect(result.data?.orderId).toBe(validOrderId);
    expect(result.data?.email).toBe(validEmail);
  });

  // ============================================
  // Invalid Cases
  // ============================================

  it("rejects empty object (neither order ID nor email)", () => {
    const result = validate(searchOrderSchema, {});
    expect(result.success).toBe(false);
    expect(result.error).toContain("Either order ID or email is required");
  });

  it("rejects invalid order ID format", () => {
    const result = validate(searchOrderSchema, { orderId: "invalid-id" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid order ID format");
  });

  it("rejects order ID that is too short", () => {
    const result = validate(searchOrderSchema, { orderId: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email format", () => {
    const result = validate(searchOrderSchema, { email: "not-an-email" });
    expect(result.success).toBe(false);
    expect(result.error).toContain("valid email address");
  });

  it("rejects email without domain", () => {
    const result = validate(searchOrderSchema, { email: "user@" });
    expect(result.success).toBe(false);
  });

  it("rejects email that is too long", () => {
    const longEmail = "a".repeat(250) + "@example.com";
    const result = validate(searchOrderSchema, { email: longEmail });
    expect(result.success).toBe(false);
    expect(result.error).toContain("Email too long");
  });

  // ============================================
  // Edge Cases
  // ============================================

  it("accepts email with subdomain", () => {
    const result = validate(searchOrderSchema, { email: "user@mail.example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts email with plus sign", () => {
    const result = validate(searchOrderSchema, { email: "user+tag@example.com" });
    expect(result.success).toBe(true);
  });

  it("accepts lowercase order ID", () => {
    const result = validate(searchOrderSchema, { orderId: "abcdef1234567890abcdef12" });
    expect(result.success).toBe(true);
  });

  it("rejects uppercase order ID", () => {
    const result = validate(searchOrderSchema, { orderId: "ABCDEF1234567890ABCDEF12" });
    expect(result.success).toBe(false);
  });
});
