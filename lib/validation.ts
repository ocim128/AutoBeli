import { z } from "zod";

/**
 * Pre-compiled regex patterns for performance
 * Created once at module load time, reused across all validations
 * Exported for use in client-side components (CheckoutForm, RecoverPage, etc.)
 */
export const REGEX_PATTERNS = {
  /** Email format validation */
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  /** Slug format: lowercase letters, numbers, hyphens */
  slug: /^[a-z0-9-]+$/,
  /** MongoDB ObjectId format: 24 hex characters */
  objectId: /^[a-f0-9]{24}$/,
} as const;

// ============================================
// Order Schemas
// ============================================

export const createOrderSchema = z.object({
  slug: z
    .string()
    .min(1, "Product slug is required")
    .max(100, "Slug too long")
    .regex(REGEX_PATTERNS.slug, "Invalid slug format"),
});

export const updateOrderContactSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(REGEX_PATTERNS.objectId, "Invalid order ID format"),
  contact: z
    .string()
    .min(1, "Email is required")
    .max(254, "Email too long")
    .regex(REGEX_PATTERNS.email, "Must be a valid email address")
    .optional(),
});

export const searchOrderSchema = z
  .object({
    orderId: z.string().regex(REGEX_PATTERNS.objectId, "Invalid order ID format").optional(),
    email: z
      .string()
      .max(254, "Email too long")
      .regex(REGEX_PATTERNS.email, "Must be a valid email address")
      .optional(),
  })
  .refine((data) => data.orderId || data.email, {
    message: "Either order ID or email is required",
  });

// ============================================
// Product Schemas
// ============================================

export const createProductSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(REGEX_PATTERNS.slug, "Slug must contain only lowercase letters, numbers, and hyphens"),
  description: z.string().max(2000, "Description too long").optional().default(""),
  priceIdr: z.coerce
    .number()
    .int("Price must be a whole number")
    .min(0, "Price cannot be negative")
    .max(1000000000, "Price too high"),
  content: z.string().min(1, "Content is required").max(100000, "Content too large (max 100KB)"),
  imageUrl: z
    .string()
    .url("Invalid image URL")
    .max(2000, "URL too long")
    .or(z.literal(""))
    .optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug too long")
    .regex(REGEX_PATTERNS.slug, "Invalid slug format"),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priceIdr: z.coerce.number().int().min(0).max(1000000000).optional(),
  content: z.string().min(1).max(100000).optional(),
  imageUrl: z.string().url("Invalid image URL").max(2000).or(z.literal("")).optional(),
  isActive: z.boolean().optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
  password: z.string().min(1, "Password is required").max(100, "Password too long"),
});

// ============================================
// Payment Schemas
// ============================================

export const mockPaymentSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(REGEX_PATTERNS.objectId, "Invalid order ID format"),
});

export const veripayPaymentSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(REGEX_PATTERNS.objectId, "Invalid order ID format"),
});

export const veripayWebhookSchema = z.object({
  order_id: z.string().min(1, "Order ID is required"),
  amount: z.number().int().positive("Amount must be positive"),
  status: z.enum(["PAID", "PENDING", "EXPIRED", "FAILED"]),
  payment_method: z.string().optional(),
  payment_time: z.string().optional(),
  customer_detail: z
    .object({
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
    })
    .optional(),
});

export const midtransPaymentSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(REGEX_PATTERNS.objectId, "Invalid order ID format"),
});

export const midtransNotificationSchema = z.object({
  order_id: z.string().min(1, "Order ID is required"),
  transaction_status: z.enum([
    "capture",
    "settlement",
    "pending",
    "deny",
    "cancel",
    "expire",
    "failure",
  ]),
  gross_amount: z.string(),
  signature_key: z.string(),
  status_code: z.string(),
  transaction_id: z.string().optional(),
  payment_type: z.string().optional(),
  transaction_time: z.string().optional(),
  fraud_status: z.enum(["accept", "challenge", "deny"]).optional(),
});

export const pakasirPaymentSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(REGEX_PATTERNS.objectId, "Invalid order ID format"),
});

export const pakasirWebhookSchema = z.object({
  amount: z.number().int().positive(),
  order_id: z.string().min(1),
  project: z.string().min(1),
  status: z.enum(["completed", "pending", "failed", "expired"]),
  payment_method: z.string().optional(),
  completed_at: z.string().optional(),
});

// ============================================
// Settings Schemas
// ============================================

export const updateSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
  emailFromName: z.string().max(100, "Name too long").optional(),
  emailFromAddress: z
    .string()
    .regex(REGEX_PATTERNS.email, "Must be a valid email address")
    .or(z.literal(""))
    .optional(),
  emailSubjectTemplate: z.string().max(500, "Subject template too long").optional(),
  emailBodyTemplate: z.string().max(10000, "Body template too long").optional(),
  mailgunDomain: z.string().max(100, "Domain too long").optional(),
});

export const sendTestEmailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

// ============================================
// Utility Types
// ============================================

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderContactInput = z.infer<typeof updateOrderContactSchema>;
export type SearchOrderInput = z.infer<typeof searchOrderSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MockPaymentInput = z.infer<typeof mockPaymentSchema>;
export type VeripayPaymentInput = z.infer<typeof veripayPaymentSchema>;
export type VeripayWebhookInput = z.infer<typeof veripayWebhookSchema>;
export type MidtransPaymentInput = z.infer<typeof midtransPaymentSchema>;
export type MidtransNotificationInput = z.infer<typeof midtransNotificationSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ============================================
// Validation Helper
// ============================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Validate data against a Zod schema
 * Returns a clean result object for API responses
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Get first error message
  const firstError = result.error.issues[0];
  const errorMessage = firstError
    ? `${firstError.path.join(".")}: ${firstError.message}`.replace(/^: /, "")
    : "Validation failed";

  return { success: false, error: errorMessage };
}
