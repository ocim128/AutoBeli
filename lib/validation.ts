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
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .optional()
    .default(1),
});

export const updateOrderContactSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(REGEX_PATTERNS.objectId, "Invalid order ID format"),
  contact: z
    .string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email too long")
    .regex(REGEX_PATTERNS.email, "Must be a valid email address"),
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
  postPurchaseTemplate: z.string().max(2000, "Template too long").optional(),
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
  postPurchaseTemplate: z.string().max(2000).optional(),
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

export const pakasirPaymentSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(REGEX_PATTERNS.objectId, "Invalid order ID format"),
});

export const pakasirWebhookSchema = z.object({
  amount: z.number().int().positive("Amount must be positive"),
  order_id: z.string().min(1),
  project: z.string().min(1),
  status: z.enum(["completed", "pending", "failed", "expired"]),
  payment_method: z.string().optional(),
  completed_at: z.string().optional(),
});

export const qrisPaymentCreateSchema = z.object({
  orderId: z
    .string()
    .min(1, "Order ID is required")
    .regex(REGEX_PATTERNS.objectId, "Invalid order ID format"),
  retry: z.boolean().optional(),
});

export const qrisWebhookSchema = z.object({
  payment_id: z.string().min(1).max(200),
  payment_status: z.enum(["paid", "expired"]),
  amount: z.number().int().positive("Amount must be positive"),
  currency: z.enum(["IDR", "idr"]).optional(),
  // `paid_amount` is intentionally optional: the Qris webhook body does not
  // carry it (settlement amount lives on the REST record, not the event).
  // The settlement-time amount check uses the amount recorded at creation.
  paid_amount: z.number().int().positive().optional(),
  // `paid_at` is an epoch-millisecond number in the Qris webhook; accept the
  // ISO sibling too for forward compatibility.
  paid_at: z
    .union([
      z.number().positive(),
      z
        .string()
        .max(100)
        .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid paid_at"),
    ])
    .optional(),
  created_at: z
    .union([
      z.number().positive(),
      z
        .string()
        .max(100)
        .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid created_at"),
    ])
    .optional(),
  expires_at: z
    .union([
      z.number().positive(),
      z
        .string()
        .max(100)
        .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid expires_at"),
    ])
    .optional(),
  provider_transaction: z.record(z.string(), z.unknown()).optional(),
});

// ============================================
// Settings Schemas
// ============================================

export const updateSettingsSchema = z.object({
  emailEnabled: z.boolean().optional(),
});

// ============================================
// Audience Schemas
// ============================================

export const audienceQuerySchema = z.object({
  search: z.string().max(254).optional(),
  status: z.enum(["ACTIVE", "EXCLUDED", "BOUNCED"]).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateAudienceSchema = z
  .object({
    email: z
      .string()
      .min(1)
      .max(254)
      .regex(REGEX_PATTERNS.email, "Must be a valid email address")
      .optional(),
    status: z.enum(["ACTIVE", "EXCLUDED", "BOUNCED"]).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (data) => data.email !== undefined || data.status !== undefined || data.notes !== undefined,
    {
      message: "At least one field is required",
    }
  );

export const exportAudienceSchema = z.object({
  includeDeleted: z.enum(["1"]).optional(),
});

// ============================================
// Broadcast Schemas
// ============================================

export const broadcastTestSchema = z
  .object({
    productId: z.string().regex(REGEX_PATTERNS.objectId, "Invalid product ID format").optional(),
    slug: z.string().trim().max(100).regex(REGEX_PATTERNS.slug, "Invalid slug format").optional(),
    teaser: z
      .string()
      .trim()
      .min(10, "Teaser must be at least 10 characters")
      .max(160, "Teaser must be at most 160 characters"),
    targetEmail: z
      .string()
      .trim()
      .min(1)
      .max(254)
      .regex(REGEX_PATTERNS.email, "Must be a valid email address"),
  })
  .refine((data) => data.productId || data.slug, {
    message: "Either productId or slug is required",
  });

export const broadcastLiveSchema = z
  .object({
    productId: z.string().regex(REGEX_PATTERNS.objectId, "Invalid product ID format").optional(),
    slug: z.string().trim().max(100).regex(REGEX_PATTERNS.slug, "Invalid slug format").optional(),
    teaser: z
      .string()
      .trim()
      .min(10, "Teaser must be at least 10 characters")
      .max(160, "Teaser must be at most 160 characters"),
    adminPassword: z.string().min(1, "Admin password is required").max(100),
  })
  .refine((data) => data.productId || data.slug, {
    message: "Either productId or slug is required",
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
export type PakasirPaymentInput = z.infer<typeof pakasirPaymentSchema>;
export type PakasirWebhookInput = z.infer<typeof pakasirWebhookSchema>;
export type QrisPaymentCreateInput = z.infer<typeof qrisPaymentCreateSchema>;
export type QrisWebhookInput = z.infer<typeof qrisWebhookSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type AudienceQueryInput = z.infer<typeof audienceQuerySchema>;
export type UpdateAudienceInput = z.infer<typeof updateAudienceSchema>;
export type ExportAudienceInput = z.infer<typeof exportAudienceSchema>;
export type BroadcastTestInput = z.infer<typeof broadcastTestSchema>;
export type BroadcastLiveInput = z.infer<typeof broadcastLiveSchema>;

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
