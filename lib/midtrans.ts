import crypto from "crypto";

/**
 * Midtrans Payment Gateway Utility Library
 * Handles Snap API transactions, signature verification, and status checks
 *
 * @see https://docs.midtrans.com/docs/snap-snap-integration-guide
 */

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY || "";
const IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";

// API Base URLs
const SNAP_BASE_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1"
  : "https://app.sandbox.midtrans.com/snap/v1";

const API_BASE_URL = IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

// ============================================
// Interfaces
// ============================================

export interface MidtransItemDetail {
  id?: string;
  name: string;
  price: number;
  quantity: number;
}

export interface MidtransCustomerDetail {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface MidtransTransactionRequest {
  order_id: string;
  gross_amount: number;
  item_details?: MidtransItemDetail[];
  customer_details?: MidtransCustomerDetail;
  callbacks?: {
    finish?: string;
  };
}

export interface MidtransTransactionResponse {
  token: string;
  redirect_url: string;
}

export interface MidtransNotificationPayload {
  transaction_time: string;
  transaction_status:
    | "capture"
    | "settlement"
    | "pending"
    | "deny"
    | "cancel"
    | "expire"
    | "failure";
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: "accept" | "challenge" | "deny";
  currency: string;
}

export interface MidtransStatusResponse {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  signature_key: string;
}

// ============================================
// Authentication
// ============================================

/**
 * Get Basic Auth header for Midtrans API
 * Format: Base64(server_key + ":")
 */
function getAuthHeader(): string {
  const credentials = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  return `Basic ${credentials}`;
}

// ============================================
// Signature Verification
// ============================================

/**
 * Verify Midtrans notification signature
 * Formula: SHA512(order_id + status_code + gross_amount + server_key)
 *
 * @see https://docs.midtrans.com/docs/https-notification-webhooks#verifying-notification-authenticity
 */
export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): boolean {
  const payload = orderId + statusCode + grossAmount + MIDTRANS_SERVER_KEY;
  const expectedSignature = crypto.createHash("sha512").update(payload).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signatureKey));
  } catch {
    return false;
  }
}

// ============================================
// API Functions
// ============================================

/**
 * Create a Snap transaction
 * Returns token and redirect_url for checkout
 *
 * @see https://docs.midtrans.com/reference/backend-integration
 */
export async function createTransaction(
  request: MidtransTransactionRequest
): Promise<{ success: boolean; data?: MidtransTransactionResponse; error?: string }> {
  try {
    const payload = {
      transaction_details: {
        order_id: request.order_id,
        gross_amount: request.gross_amount,
      },
      item_details: request.item_details,
      customer_details: request.customer_details,
      callbacks: request.callbacks,
    };

    const response = await fetch(`${SNAP_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.error_messages?.join(", ") || data.status_message || "Failed to create transaction",
      };
    }

    return {
      success: true,
      data: {
        token: data.token,
        redirect_url: data.redirect_url,
      },
    };
  } catch (error) {
    console.error("Midtrans createTransaction error:", error);
    return {
      success: false,
      error: "Failed to connect to Midtrans",
    };
  }
}

/**
 * Get transaction status from Midtrans API
 *
 * @see https://docs.midtrans.com/reference/get-transaction-status
 */
export async function getTransactionStatus(
  orderId: string
): Promise<{ success: boolean; data?: MidtransStatusResponse; error?: string }> {
  try {
    const response = await fetch(`${API_BASE_URL}/${orderId}/status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: getAuthHeader(),
      },
    });

    const data = await response.json();

    if (!response.ok || data.status_code === "404") {
      return {
        success: false,
        error: data.status_message || "Transaction not found",
      };
    }

    return {
      success: true,
      data: data as MidtransStatusResponse,
    };
  } catch (error) {
    console.error("Midtrans getTransactionStatus error:", error);
    return {
      success: false,
      error: "Failed to get transaction status",
    };
  }
}

/**
 * Check if Midtrans is configured
 */
export function isMidtransConfigured(): boolean {
  return !!MIDTRANS_SERVER_KEY;
}

/**
 * Get client key for frontend use (if needed)
 */
export function getClientKey(): string {
  return MIDTRANS_CLIENT_KEY;
}

/**
 * Check if running in production mode
 */
export function isProductionMode(): boolean {
  return IS_PRODUCTION;
}
