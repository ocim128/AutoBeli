import { z } from 'zod';

/**
 * Indonesian phone number regex
 * Matches: 08xxxxxxxxxx (10-13 digits total)
 */
const indonesianPhoneRegex = /^08\d{8,11}$/;

/**
 * Simple email regex for basic validation
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ============================================
// Order Schemas
// ============================================

export const createOrderSchema = z.object({
    slug: z
        .string()
        .min(1, 'Product slug is required')
        .max(100, 'Slug too long')
        .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
});

export const updateOrderContactSchema = z.object({
    orderId: z
        .string()
        .min(1, 'Order ID is required')
        .regex(/^[a-f0-9]{24}$/, 'Invalid order ID format'),
    contact: z
        .string()
        .min(1, 'Contact is required')
        .max(100, 'Contact too long')
        .refine(
            (val) => emailRegex.test(val) || indonesianPhoneRegex.test(val),
            'Must be a valid email or Indonesian phone number (08xxxxxxxxxx)'
        )
        .optional(),
});

// ============================================
// Product Schemas
// ============================================

export const createProductSchema = z.object({
    title: z
        .string()
        .min(1, 'Title is required')
        .max(200, 'Title too long'),
    slug: z
        .string()
        .min(1, 'Slug is required')
        .max(100, 'Slug too long')
        .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
    description: z
        .string()
        .max(2000, 'Description too long')
        .optional()
        .default(''),
    priceIdr: z
        .number()
        .int('Price must be a whole number')
        .min(0, 'Price cannot be negative')
        .max(1000000000, 'Price too high'),
    content: z
        .string()
        .min(1, 'Content is required')
        .max(100000, 'Content too large (max 100KB)'),
    isActive: z.boolean().optional().default(true),
});

export const updateProductSchema = z.object({
    slug: z
        .string()
        .min(1, 'Slug is required')
        .max(100, 'Slug too long')
        .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(2000).optional(),
    priceIdr: z.number().int().min(0).max(1000000000).optional(),
    content: z.string().min(1).max(100000).optional(),
    isActive: z.boolean().optional(),
});

// ============================================
// Auth Schemas
// ============================================

export const loginSchema = z.object({
    password: z
        .string()
        .min(1, 'Password is required')
        .max(100, 'Password too long'),
});

// ============================================
// Payment Schemas
// ============================================

export const mockPaymentSchema = z.object({
    orderId: z
        .string()
        .min(1, 'Order ID is required')
        .regex(/^[a-f0-9]{24}$/, 'Invalid order ID format'),
});

// ============================================
// Utility Types
// ============================================

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderContactInput = z.infer<typeof updateOrderContactSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type MockPaymentInput = z.infer<typeof mockPaymentSchema>;

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
export function validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): ValidationResult<T> {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Get first error message
    const firstError = result.error.issues[0];
    const errorMessage = firstError
        ? `${firstError.path.join('.')}: ${firstError.message}`.replace(/^: /, '')
        : 'Validation failed';

    return { success: false, error: errorMessage };
}
