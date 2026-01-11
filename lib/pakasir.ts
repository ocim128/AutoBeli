const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY || "";
const PAKASIR_PROJECT_SLUG = process.env.PAKASIR_PROJECT_SLUG || "";
const API_BASE_URL = "https://app.pakasir.com/api";

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
 * Currently defaulting to QRIS, but can be extended
 */
export async function createPakasirTransaction(
  request: PakasirTransactionRequest
): Promise<{
  success: boolean;
  data?: PakasirTransactionResponse;
  error?: string;
  payment_url?: string;
}> {
  try {
    const method = request.payment_method || "qris";
    // const url = `${API_BASE_URL}/transactioncreate/${method}`;
    // const payload = {
    //     project: PAKASIR_PROJECT_SLUG,
    //     order_id: request.order_id,
    //     amount: request.amount,
    //     api_key: PAKASIR_API_KEY,
    // };

    // For URL-based integration (simpler for user)
    // https://app.pakasir.com/pay/{slug}/{amount}?order_id={order_id}
    // We can use this as a fallback or primary if API fails or for redirect
    const redirectUrl = `https://app.pakasir.com/pay/${PAKASIR_PROJECT_SLUG}/${Math.ceil(request.amount)}?order_id=${request.order_id}`;

    // However, the task implies using the API to get QR/VA.
    // But the `createTransaction` in `CheckoutForm` expects a URL to redirect to usually,
    // or we display the QR code embedded.
    // Given the `CheckoutForm` existing logic redirects to `payData.payment_url`,
    // and Pakasir supports a direct payment page URL,
    // we will prefer returning the Redirect URL for simplicity and better UX (Pakasir hosted page),
    // UNLESS the user explicitly wants API-only (white label).
    // The prompt asked to "add payment gateway: pakasir" based on docs.
    // Docs mention "Integrasi Via URL" is simplest. "Integrasi Via API" gives raw data.
    // Let's support the URL redirect method primarily as it handles the UI for us (QR, VA selection if not specified).
    // But the docs say for URL: `https://app.pakasir.com/pay/{slug}/{amount}?order_id={order_id}`
    // It also supports specifically QRIS only.

    // Let's implement the API call to at least validate we can communicate,
    // OR just return the friendly URL if that's the standard flow.
    // Re-reading previous implementations: Midtrans uses Snap (Redirect/Popup), Veripay returns `payment_url`.
    // So for Pakasir, constructing the URL seems best.

    return {
      success: true,
      payment_url: redirectUrl,
    };

    /* 
        // Code for API-based creation if we wanted to render QR ourselves:
        
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
    
        const data = await response.json();
    
        if (!response.ok) {
           return { success: false, error: "Failed to create transaction" };
        }
    
        return { success: true, data: data };
        */
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
    const url = `${API_BASE_URL}/transactiondetail?project=${PAKASIR_PROJECT_SLUG}&amount=${amount}&order_id=${orderId}&api_key=${PAKASIR_API_KEY}`;

    const response = await fetch(url, {
      method: "GET",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "Transaction not found or error",
      };
    }

    if (!data.transaction) {
      return {
        success: false,
        error: "Transaction data missing",
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
