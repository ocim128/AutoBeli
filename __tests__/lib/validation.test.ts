/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import {
  validate,
  createOrderSchema,
  updateOrderContactSchema,
  createProductSchema,
  updateProductSchema,
  loginSchema,
  mockPaymentSchema,
  veripayPaymentSchema,
  veripayWebhookSchema,
} from "@/lib/validation";

describe("Validation Schemas", () => {
  // ================================================
  // Order Schemas
  // ================================================
  describe("createOrderSchema", () => {
    it("accepts valid slug", () => {
      const result = validate(createOrderSchema, { slug: "my-product-123" });
      expect(result.success).toBe(true);
      expect(result.data?.slug).toBe("my-product-123");
    });

    it("rejects empty slug", () => {
      const result = validate(createOrderSchema, { slug: "" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("required");
    });

    it("rejects slug with uppercase letters", () => {
      const result = validate(createOrderSchema, { slug: "My-Product" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid slug format");
    });

    it("rejects slug with special characters", () => {
      const result = validate(createOrderSchema, { slug: "my_product!" });
      expect(result.success).toBe(false);
    });

    it("rejects slug exceeding max length", () => {
      const result = validate(createOrderSchema, { slug: "a".repeat(101) });
      expect(result.success).toBe(false);
      expect(result.error).toContain("too long");
    });

    it("rejects missing slug field", () => {
      const result = validate(createOrderSchema, {});
      expect(result.success).toBe(false);
    });
  });

  describe("updateOrderContactSchema", () => {
    const validOrderId = "a".repeat(24); // 24 hex chars

    it("accepts valid Indonesian phone number", () => {
      const result = validate(updateOrderContactSchema, {
        orderId: validOrderId,
        contact: "081234567890",
      });
      expect(result.success).toBe(true);
    });

    it("accepts orderId without contact (optional)", () => {
      const result = validate(updateOrderContactSchema, {
        orderId: validOrderId,
      });
      expect(result.success).toBe(true);
    });

    it("rejects invalid orderId format", () => {
      const result = validate(updateOrderContactSchema, {
        orderId: "invalid-id",
        contact: "081234567890",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid order ID");
    });

    it("rejects orderId that is too short", () => {
      const result = validate(updateOrderContactSchema, {
        orderId: "abc123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email (only phone allowed)", () => {
      const result = validate(updateOrderContactSchema, {
        orderId: validOrderId,
        contact: "a@b.c", // Short email to bypass max length check
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("valid Indonesian phone number");
    });

    it("rejects phone number not starting with 08", () => {
      const result = validate(updateOrderContactSchema, {
        orderId: validOrderId,
        contact: "628123456789", // Indonesian format with country code
      });
      expect(result.success).toBe(false);
    });

    it("rejects phone number too short", () => {
      const result = validate(updateOrderContactSchema, {
        orderId: validOrderId,
        contact: "08123456", // Only 8 digits
      });
      expect(result.success).toBe(false);
    });
  });

  // ================================================
  // Product Schemas
  // ================================================
  describe("createProductSchema", () => {
    const validProduct = {
      title: "My Digital Product",
      slug: "my-digital-product",
      description: "A great product description",
      priceIdr: 50000,
      content: "This is the encrypted content",
      isActive: true,
    };

    it("accepts valid product data", () => {
      const result = validate(createProductSchema, validProduct);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe(validProduct.title);
      expect(result.data?.priceIdr).toBe(50000);
    });

    it("applies default values for optional fields", () => {
      const minimalProduct = {
        title: "Minimal Product",
        slug: "minimal-product",
        priceIdr: 10000,
        content: "Some content",
      };
      const result = validate(createProductSchema, minimalProduct);
      expect(result.success).toBe(true);
      expect(result.data?.description).toBe("");
      expect(result.data?.isActive).toBe(true);
    });

    it("rejects empty title", () => {
      const result = validate(createProductSchema, { ...validProduct, title: "" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("required");
    });

    it("rejects title exceeding max length", () => {
      const result = validate(createProductSchema, {
        ...validProduct,
        title: "a".repeat(201),
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("too long");
    });

    it("rejects negative price", () => {
      const result = validate(createProductSchema, { ...validProduct, priceIdr: -100 });
      expect(result.success).toBe(false);
      expect(result.error).toContain("negative");
    });

    it("rejects non-integer price", () => {
      const result = validate(createProductSchema, { ...validProduct, priceIdr: 100.5 });
      expect(result.success).toBe(false);
      expect(result.error).toContain("whole number");
    });

    it("rejects price exceeding max", () => {
      const result = validate(createProductSchema, {
        ...validProduct,
        priceIdr: 2000000000,
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("too high");
    });

    it("rejects empty content", () => {
      const result = validate(createProductSchema, { ...validProduct, content: "" });
      expect(result.success).toBe(false);
    });

    it("rejects content exceeding max size", () => {
      const result = validate(createProductSchema, {
        ...validProduct,
        content: "x".repeat(100001),
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("100KB");
    });

    it("rejects invalid slug format", () => {
      const result = validate(createProductSchema, {
        ...validProduct,
        slug: "Invalid Slug!",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateProductSchema", () => {
    it("accepts partial updates", () => {
      const result = validate(updateProductSchema, {
        slug: "existing-product",
        title: "Updated Title",
      });
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe("Updated Title");
      expect(result.data?.priceIdr).toBeUndefined();
    });

    it("requires slug", () => {
      const result = validate(updateProductSchema, { title: "New Title" });
      expect(result.success).toBe(false);
    });

    it("accepts price update only", () => {
      const result = validate(updateProductSchema, {
        slug: "my-product",
        priceIdr: 75000,
      });
      expect(result.success).toBe(true);
      expect(result.data?.priceIdr).toBe(75000);
    });

    it("accepts isActive toggle", () => {
      const result = validate(updateProductSchema, {
        slug: "my-product",
        isActive: false,
      });
      expect(result.success).toBe(true);
      expect(result.data?.isActive).toBe(false);
    });
  });

  // ================================================
  // Auth Schemas
  // ================================================
  describe("loginSchema", () => {
    it("accepts valid password", () => {
      const result = validate(loginSchema, { password: "mysecretpassword" });
      expect(result.success).toBe(true);
    });

    it("rejects empty password", () => {
      const result = validate(loginSchema, { password: "" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("required");
    });

    it("rejects password exceeding max length", () => {
      const result = validate(loginSchema, { password: "a".repeat(101) });
      expect(result.success).toBe(false);
      expect(result.error).toContain("too long");
    });

    it("rejects missing password field", () => {
      const result = validate(loginSchema, {});
      expect(result.success).toBe(false);
    });
  });

  // ================================================
  // Payment Schemas
  // ================================================
  describe("mockPaymentSchema", () => {
    const validOrderId = "abcdef123456789012345678"; // 24 hex chars

    it("accepts valid orderId", () => {
      const result = validate(mockPaymentSchema, { orderId: validOrderId });
      expect(result.success).toBe(true);
    });

    it("rejects empty orderId", () => {
      const result = validate(mockPaymentSchema, { orderId: "" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid orderId format", () => {
      const result = validate(mockPaymentSchema, { orderId: "not-valid-mongo-id" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid order ID");
    });

    it("rejects orderId with uppercase letters", () => {
      const result = validate(mockPaymentSchema, {
        orderId: "ABCDEF123456789012345678",
      });
      expect(result.success).toBe(false);
    });

    it("rejects orderId with wrong length", () => {
      const result = validate(mockPaymentSchema, { orderId: "abc123" });
      expect(result.success).toBe(false);
    });
  });

  describe("veripayPaymentSchema", () => {
    const validOrderId = "abcdef123456789012345678"; // 24 hex chars

    it("accepts valid orderId", () => {
      const result = validate(veripayPaymentSchema, { orderId: validOrderId });
      expect(result.success).toBe(true);
    });

    it("rejects empty orderId", () => {
      const result = validate(veripayPaymentSchema, { orderId: "" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid orderId format", () => {
      const result = validate(veripayPaymentSchema, { orderId: "not-valid-mongo-id" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid order ID");
    });
  });

  describe("veripayWebhookSchema", () => {
    const validWebhook = {
      order_id: "ORD-123",
      amount: 50000,
      status: "PAID" as const,
    };

    it("accepts valid paid webhook", () => {
      const result = validate(veripayWebhookSchema, validWebhook);
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe("PAID");
    });

    it("accepts valid pending webhook", () => {
      const result = validate(veripayWebhookSchema, { ...validWebhook, status: "PENDING" });
      expect(result.success).toBe(true);
    });

    it("accepts webhook with optional fields", () => {
      const result = validate(veripayWebhookSchema, {
        ...validWebhook,
        payment_method: "QRIS",
        payment_time: "2025-01-12 10:32:55",
        customer_detail: {
          name: "John Doe",
          email: "john@example.com",
          phone: "081234567890",
        },
      });
      expect(result.success).toBe(true);
      expect(result.data?.payment_method).toBe("QRIS");
    });

    it("rejects empty order_id", () => {
      const result = validate(veripayWebhookSchema, { ...validWebhook, order_id: "" });
      expect(result.success).toBe(false);
    });

    it("rejects zero amount", () => {
      const result = validate(veripayWebhookSchema, { ...validWebhook, amount: 0 });
      expect(result.success).toBe(false);
      expect(result.error).toContain("positive");
    });

    it("rejects negative amount", () => {
      const result = validate(veripayWebhookSchema, { ...validWebhook, amount: -100 });
      expect(result.success).toBe(false);
    });

    it("rejects invalid status", () => {
      const result = validate(veripayWebhookSchema, { ...validWebhook, status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("accepts EXPIRED status", () => {
      const result = validate(veripayWebhookSchema, { ...validWebhook, status: "EXPIRED" });
      expect(result.success).toBe(true);
    });

    it("accepts FAILED status", () => {
      const result = validate(veripayWebhookSchema, { ...validWebhook, status: "FAILED" });
      expect(result.success).toBe(true);
    });
  });

  // ================================================
  // Validate Helper Function
  // ================================================
  describe("validate helper", () => {
    it("returns success with data for valid input", () => {
      const result = validate(loginSchema, { password: "test" });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ password: "test" });
      expect(result.error).toBeUndefined();
    });

    it("returns error message for invalid input", () => {
      const result = validate(loginSchema, { password: "" });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it("formats error path correctly", () => {
      const result = validate(createProductSchema, {
        title: "Test",
        slug: "test",
        priceIdr: -1,
        content: "test",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("priceIdr");
    });
  });
});
