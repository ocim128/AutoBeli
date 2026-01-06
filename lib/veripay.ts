import crypto from "crypto";

/**
 * Veripay Payment Gateway Utility Library
 * Handles signature generation, API calls, and webhook verification
 */

const VERIPAY_API_KEY = process.env.VERIPAY_API_KEY || "";
const VERIPAY_SECRET_KEY = process.env.VERIPAY_SECRET_KEY || "";
const VERIPAY_BASE_URL = process.env.VERIPAY_BASE_URL || "https://veripay.site/api/v1";

export interface VeripayCustomerDetail {
  name?: string;
  email?: string;
  phone?: string;
}

export interface VeripayProductDetail {
  name: string;
  price: number;
  qty: number;
}

export interface VeripayPaymentRequest {
  order_id: string;
  amount: number;
  description?: string;
  return_url?: string;
  product_detail?: VeripayProductDetail[];
  customer_detail?: VeripayCustomerDetail;
}

export interface VeripayPaymentResponse {
  success: boolean;
  message: string;
  data?: {
    order_id: string;
    transaction_ref: string;
    gross_amount: number;
    net_amount: number;
    admin_fee: number;
    currency: string;
    payment_url: string;
    status: string;
  };
  errors?: Record<string, string[]>;
}

export interface VeripayWebhookPayload {
  order_id: string;
  amount: number;
  status: "PAID" | "PENDING" | "EXPIRED" | "FAILED";
  payment_method?: string;
  payment_time?: string;
  customer_detail?: VeripayCustomerDetail;
}

/**
 * Generate HMAC-SHA256 signature for Veripay API
 * Format: base64(hmac_sha256(api_key + timestamp, secret_key))
 */
export function generateSignature(timestamp: number): string {
  const payload = VERIPAY_API_KEY + timestamp;
  const hash = crypto.createHmac("sha256", VERIPAY_SECRET_KEY).update(payload).digest();
  return hash.toString("base64");
}

/**
 * Verify webhook signature from Veripay
 */
export function verifyWebhookSignature(receivedSignature: string, timestamp: string): boolean {
  const expectedSignature = generateSignature(parseInt(timestamp, 10));
  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(receivedSignature));
  } catch {
    return false;
  }
}

/**
 * Get authentication headers for Veripay API calls
 */
export function getAuthHeaders(): Record<string, string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = generateSignature(timestamp);

  return {
    Authorization: `Bearer ${VERIPAY_API_KEY}`,
    "x-api-key": VERIPAY_API_KEY,
    "x-timestamp": timestamp.toString(),
    "x-signature": signature,
    "Content-Type": "application/json",
  };
}

/**
 * Create a payment request with Veripay
 */
export async function createPaymentRequest(
  request: VeripayPaymentRequest
): Promise<VeripayPaymentResponse> {
  const headers = getAuthHeaders();

  // Add variants of return_url to try and trigger a Return button on Veripay
  const payload = {
    ...request,
    callback_url: request.return_url,
    redirect_url: request.return_url,
    success_url: request.return_url,
    back_url: request.return_url,
  };

  const response = await fetch(`${VERIPAY_BASE_URL}/merchant/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      message: data.message || "Payment creation failed",
      errors: data.errors,
    };
  }

  return data as VeripayPaymentResponse;
}

/**
 * Get payment status from Veripay
 */
export async function getPaymentStatus(transactionRef: string): Promise<VeripayPaymentResponse> {
  const headers = getAuthHeaders();

  const response = await fetch(`${VERIPAY_BASE_URL}/merchant/payments/${transactionRef}`, {
    method: "GET",
    headers,
  });

  const data = await response.json();
  return data as VeripayPaymentResponse;
}

/**
 * Check if Veripay is configured
 */
export function isVeripayConfigured(): boolean {
  return !!(VERIPAY_API_KEY && VERIPAY_SECRET_KEY);
}
