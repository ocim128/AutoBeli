import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY || "";
const PAKASIR_PROJECT_SLUG = process.env.PAKASIR_PROJECT_SLUG || "";
const API_BASE_URL = "https://app.pakasir.com/api";
const STATUS_LOOKUP_RETRIES = 1;

export interface PakasirTransactionRequest {
  order_id: string;
  amount: number;
  payment_method?:
    | "qris"
    | "bni_va"
    | "cimb_niaga_va"
    | "sampoerna_va"
    | "bnc_va"
    | "maybank_va"
    | "permata_va"
    | "atm_bersama_va"
    | "artha_graha_va"
    | "bri_va"
    | "paypal";
}

export interface PakasirTransactionResponse {
  payment: {
    project: string;
    order_id: string;
    amount: number;
    fee: number;
    total_payment: number;
    payment_method: string;
    payment_number: string; // This could be QR string or VA number
    expired_at: string;
  };
}

export interface PakasirStatusResponse {
  transaction: {
    amount: number;
    order_id: string;
    project: string;
    status: "completed" | "pending" | "failed" | "expired";
    payment_method: string;
    completed_at?: string;
  };
}

/**
 * Check if Pakasir is configured
 */
export function isPakasirConfigured(): boolean {
  return !!(PAKASIR_API_KEY && PAKASIR_PROJECT_SLUG);
}

/**
 * Create a transaction in Pakasir
 * Uses URL-based integration which redirects to Pakasir's hosted payment page.
 * This handles QR code display and VA selection on their end for better UX.
 */
export async function createPakasirTransaction(request: PakasirTransactionRequest): Promise<{
  success: boolean;
  data?: PakasirTransactionResponse;
  error?: string;
  payment_url?: string;
}> {
  try {
    // URL-based integration: https://app.pakasir.com/pay/{slug}/{amount}?order_id={order_id}
    const redirectUrl = `https://app.pakasir.com/pay/${PAKASIR_PROJECT_SLUG}/${Math.ceil(request.amount)}?order_id=${request.order_id}`;

    return {
      success: true,
      payment_url: redirectUrl,
    };
  } catch (error) {
    console.error("Pakasir createTransaction error:", error);
    return {
      success: false,
      error: "Failed to connect to Pakasir",
    };
  }
}

/**
 * Get transaction status from Pakasir API
 */
export async function getPakasirTransactionStatus(
  orderId: string,
  amount: number
): Promise<{ success: boolean; data?: PakasirStatusResponse; error?: string }> {
  try {
    // SECURITY: api_key is passed as a query parameter because Pakasir's
    // transactiondetail endpoint only supports query-param authentication.
    const url = `${API_BASE_URL}/transactiondetail?project=${PAKASIR_PROJECT_SLUG}&amount=${amount}&order_id=${orderId}&api_key=${PAKASIR_API_KEY}`;

    let response: Response | null = null;
    let lastError: unknown;

    for (let attempt = 0; attempt <= STATUS_LOOKUP_RETRIES; attempt++) {
      try {
        response = await fetchWithTimeout(url, { method: "GET" });
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!response) {
      console.error("Pakasir getTransactionStatus error:", lastError);
      return {
        success: false,
        error: "Failed to get transaction status",
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Transaction lookup failed: HTTP ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.transaction) {
      return {
        success: false,
        error: "Transaction data missing",
      };
    }

    if (
      data.transaction.order_id !== orderId ||
      data.transaction.amount !== amount ||
      data.transaction.project !== PAKASIR_PROJECT_SLUG
    ) {
      return {
        success: false,
        error: "Transaction data mismatch",
      };
    }

    return {
      success: true,
      data: data as PakasirStatusResponse,
    };
  } catch (error) {
    console.error("Pakasir getTransactionStatus error:", error);
    return {
      success: false,
      error: "Failed to get transaction status",
    };
  }
}
