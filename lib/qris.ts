import crypto from "crypto";
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

/**
 * Server-side client for the Qris payment service.
 *
 * Security rules:
 * - Never imported by client components (uses QRIS_API_KEY / QRIS_WEBHOOK_HMAC_KEY).
 * - Never log credentials, Authorization headers, webhook signatures, or full
 *   provider responses; log only status codes and error categories.
 */

export const QRIS_MIN_BASE_AMOUNT = 1000;
export const QRIS_MAX_BASE_AMOUNT = 9999000;
export const QRIS_MAX_UNIQUE_SUFFIX = 999;
export const QRIS_DEFAULT_TIMEOUT_MS = 300000; // 5 minutes
export const QRIS_DEFAULT_TIMEZONE = "Asia/Jakarta";
export const QRIS_TRANSACTION_TIME_SKEW_MS = 2 * 60 * 1000;

const CREATE_TIMEOUT_MS = 10000;
const REQUEST_TIMEOUT_MS = 8000;
const MAX_QR_IMAGE_BYTES = 1024 * 1024; // 1MB is generous for a QR PNG

export interface QrisPayment {
  paymentId: string;
  status: "pending" | "paid" | "expired";
  amount: number; // Final server-managed amount, whole Rupiah
  expiresAt?: number; // Epoch milliseconds
  paidAmount?: number;
  paidAt?: string;
  providerCreatedAt?: number;
  providerTransactionTime?: number;
}

export type QrisCreateResult =
  | { success: true; data: QrisPayment }
  | { success: false; error: string; code?: string; indeterminate: boolean };

export type QrisGetResult =
  | { success: true; data: QrisPayment }
  | { success: false; error: string };

export type QrisImageResult = { success: true; image: Buffer } | { success: false; error: string };

/**
 * Map a Qris `error_code` (see the Qris errors module) to a safe user-facing
 * message. Unknown codes fall back to a generic message; nothing here leaks
 * provider internals.
 */
function mapQrisErrorCode(code: string | undefined, httpStatus: number): string {
  switch (code) {
    case "INVALID_AMOUNT":
    case "INVALID_BASE_AMOUNT":
      return "Order total is outside the supported payment range.";
    case "NO_AVAILABLE_AMOUNT":
      return "Payment provider is busy. Please try again in a moment.";
    case "QRIS_INVALID":
      return "Payment provider is not fully configured. Please contact support.";
    case "UNAUTHORIZED":
      return "Payment provider authentication failed. Please contact support.";
    case "INVALID_WEBHOOK_URL":
    case "INVALID_REQUEST":
      return "Payment request was rejected by the provider.";
    default:
      return httpStatus >= 500
        ? "Payment provider error. Please try again later."
        : "Failed to create payment.";
  }
}

async function readQrisErrorCode(response: Response): Promise<string | undefined> {
  const body = await parseJsonBody(response, REQUEST_TIMEOUT_MS);
  if (
    body &&
    typeof body === "object" &&
    typeof (body as { error_code?: unknown }).error_code === "string"
  ) {
    return (body as { error_code: string }).error_code;
  }
  return undefined;
}

function getQrisConfig() {
  return {
    baseUrl: (process.env.QRIS_API_BASE_URL || "").trim().replace(/\/+$/, ""),
    apiKey: (process.env.QRIS_API_KEY || "").trim(),
    webhookHmacKey: (process.env.QRIS_WEBHOOK_HMAC_KEY || "").trim(),
  };
}

export function isQrisBaseAmountSupported(amount: number): boolean {
  return (
    Number.isInteger(amount) && amount >= QRIS_MIN_BASE_AMOUNT && amount <= QRIS_MAX_BASE_AMOUNT
  );
}

/**
 * True when all Qris settings are present. In production the base URL must be
 * an absolute HTTPS URL.
 */
export function isQrisConfigured(): boolean {
  const { baseUrl, apiKey, webhookHmacKey } = getQrisConfig();
  if (!baseUrl || !apiKey || !webhookHmacKey) return false;

  let parsed: URL;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return false;
  }

  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    return false;
  }

  return true;
}

export function isQrisWebhookConfigured(): boolean {
  return getQrisConfig().webhookHmacKey.length > 0;
}

// ============================================
// Response validation
// ============================================

function normalizeExpiresAt(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    // Below 1e12 the value is epoch seconds, otherwise epoch milliseconds.
    return value < 1e12 ? Math.round(value * 1000) : Math.round(value);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

export function normalizeQrisTimestamp(value: unknown): number | undefined {
  return normalizeExpiresAt(value);
}

export function isQrisSettlementTimestampValid(
  providerCreatedAt: unknown,
  providerTransactionTime: unknown,
  providerPaidAt?: unknown
): boolean {
  const createdAt = normalizeExpiresAt(providerCreatedAt);
  const transactionTime = normalizeExpiresAt(providerTransactionTime);
  const paidAt = providerPaidAt === undefined ? undefined : normalizeExpiresAt(providerPaidAt);

  if (createdAt === undefined || transactionTime === undefined) return false;
  if (transactionTime < createdAt - QRIS_TRANSACTION_TIME_SKEW_MS) return false;
  if (paidAt !== undefined && transactionTime > paidAt + QRIS_TRANSACTION_TIME_SKEW_MS)
    return false;
  return true;
}

function normalizeStatus(value: unknown): QrisPayment["status"] | null {
  if (value === "pending" || value === "paid" || value === "expired") return value;
  return null;
}

/**
 * Strictly validate a provider payment object. Returns null when any required
 * field is missing or malformed; never throws on provider input.
 *
 * `expires_at` is required (the Qris REST schema guarantees it for create and
 * get responses). `paid_amount`/`paid_at` are required on a paid REST record
 * (the GET response always includes them when paid); the webhook body omits
 * `paid_amount`, so webhook validation goes through `qrisWebhookSchema`.
 */
function validateQrisPayment(raw: unknown): QrisPayment | null {
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;

  if (body.currency !== undefined && body.currency !== "IDR" && body.currency !== "idr") {
    return null;
  }

  const paymentId =
    typeof body.payment_id === "string"
      ? body.payment_id
      : typeof body.id === "string"
        ? body.id
        : null;
  if (!paymentId || paymentId.length > 200) return null;

  const status = normalizeStatus(body.payment_status ?? body.status);
  if (!status) return null;

  const amount = body.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount <= 0) return null;

  const expiresAt = normalizeExpiresAt(body.expires_at);
  if (expiresAt === undefined) return null;

  const providerCreatedAt = normalizeExpiresAt(body.created_at);
  const providerTransaction =
    body.provider_transaction && typeof body.provider_transaction === "object"
      ? (body.provider_transaction as Record<string, unknown>)
      : undefined;
  const providerTransactionTime = normalizeExpiresAt(providerTransaction?.transaction_time);
  const payment: QrisPayment = {
    paymentId,
    status,
    amount,
    expiresAt,
    ...(providerCreatedAt !== undefined ? { providerCreatedAt } : {}),
    ...(providerTransactionTime !== undefined ? { providerTransactionTime } : {}),
  };

  if (body.paid_amount !== undefined) {
    if (
      typeof body.paid_amount !== "number" ||
      !Number.isInteger(body.paid_amount) ||
      body.paid_amount <= 0
    ) {
      return null;
    }
    payment.paidAmount = body.paid_amount;
  }

  const paidAtMs = normalizeExpiresAt(body.paid_at);
  if (paidAtMs !== undefined) payment.paidAt = new Date(paidAtMs).toISOString();

  // A paid REST record must report what was actually paid, and it must equal
  // the recorded amount (tolerance is 0 at the AutoBeli side). It must also
  // include a settlement timestamp; otherwise a malformed provider response
  // could be treated as a completed payment during reconciliation.
  if (status === "paid") {
    if (payment.paidAmount === undefined) return null;
    if (payment.paidAmount !== amount) return null;
    if (payment.paidAt === undefined) return null;
    if (
      !isQrisSettlementTimestampValid(providerCreatedAt, providerTransactionTime, payment.paidAt)
    ) {
      return null;
    }
  }

  return payment;
}

async function parseJsonBody(response: Response, timeoutMs: number): Promise<unknown> {
  const text = await readBodyWithTimeout(response, timeoutMs);
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/**
 * Bound the time spent reading the response body. `fetchWithTimeout` aborts on
 * the headers arriving, but a server can stall mid-body; this guards the body
 * read so a wedged connection cannot hang the route beyond `timeoutMs`.
 *
 * Exported for direct unit testing.
 */
export function readBodyWithTimeout(response: Response, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error(`Response body read timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    response
      .text()
      .then(
        (text) => {
          clearTimeout(timer);
          resolve(text);
        },
        (error) => {
          clearTimeout(timer);
          reject(error);
        }
      )
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function readImageWithTimeout(response: Response, timeoutMs: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const reader = response.body?.getReader();
    if (!reader) {
      reject(new Error("QR image response has no body"));
      return;
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const timer = setTimeout(() => {
      void reader.cancel().catch(() => {});
      reject(new Error(`Response body read timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    const read = async () => {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            clearTimeout(timer);
            resolve(Buffer.concat(chunks));
            return;
          }

          totalBytes += value.byteLength;
          if (totalBytes > MAX_QR_IMAGE_BYTES) {
            clearTimeout(timer);
            await reader.cancel().catch(() => {});
            reject(new Error("QR image too large"));
            return;
          }

          chunks.push(value);
        }
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    };

    void read();
  });
}

// ============================================
// API calls
// ============================================

/**
 * Create a server-managed Qris payment.
 *
 * The `indeterminate` flag distinguishes failure modes for the caller's lease
 * handling: a 4xx is a known-safe provider rejection (no payment was created),
 * while timeouts, network errors, 5xx, and malformed responses are
 * indeterminate — Qris may have created the payment.
 */
export async function createQrisPayment(params: {
  baseAmount: number;
  timeout: number;
  webhookUrl: string;
  timezone: string;
}): Promise<QrisCreateResult> {
  const { baseUrl, apiKey } = getQrisConfig();
  if (!baseUrl || !apiKey) {
    return { success: false, error: "Qris is not configured", indeterminate: false };
  }

  if (!isQrisBaseAmountSupported(params.baseAmount)) {
    return { success: false, error: "Base amount outside supported range", indeterminate: false };
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${baseUrl}/payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          mode: "server_managed",
          base_amount: params.baseAmount,
          timeout: params.timeout,
          tolerance: 0,
          webhook_url: params.webhookUrl,
          tz: params.timezone,
        }),
      },
      CREATE_TIMEOUT_MS
    );
  } catch {
    // Timeout or network failure: the provider may have created the payment.
    return { success: false, error: "Qris request failed", indeterminate: true };
  }

  if (!response.ok) {
    const code = await readQrisErrorCode(response);
    console.error("[Qris] create payment failed: HTTP", response.status, code ?? "(no code)");
    // 4xx is a definitive provider rejection; 5xx is indeterminate.
    return {
      success: false,
      error: mapQrisErrorCode(code, response.status),
      code,
      indeterminate: response.status >= 500,
    };
  }

  const body = await parseJsonBody(response, CREATE_TIMEOUT_MS);
  const payment = validateQrisPayment(body);
  if (
    !payment ||
    payment.amount < params.baseAmount ||
    payment.amount > params.baseAmount + QRIS_MAX_UNIQUE_SUFFIX
  ) {
    console.error("[Qris] create payment returned a malformed body");
    return { success: false, error: "Malformed Qris response", indeterminate: true };
  }

  return { success: true, data: payment };
}

/**
 * Reconciliation fallback: fetch the current provider state of a payment.
 */
export async function getQrisPayment(paymentId: string): Promise<QrisGetResult> {
  const { baseUrl, apiKey } = getQrisConfig();
  if (!baseUrl || !apiKey) {
    return { success: false, error: "Qris is not configured" };
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${baseUrl}/payment/${encodeURIComponent(paymentId)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      REQUEST_TIMEOUT_MS
    );
  } catch {
    return { success: false, error: "Qris request failed" };
  }

  if (!response.ok) {
    return { success: false, error: `Payment lookup failed (HTTP ${response.status})` };
  }

  const body = await parseJsonBody(response, REQUEST_TIMEOUT_MS);
  const payment = validateQrisPayment(body);
  if (!payment || payment.paymentId !== paymentId) {
    console.error("[Qris] get payment returned a malformed body");
    return { success: false, error: "Malformed Qris response" };
  }

  return { success: true, data: payment };
}

/**
 * Fetch the QR PNG for a payment. Restricted to image/png and a bounded size.
 */
export async function fetchQrisQrImage(paymentId: string): Promise<QrisImageResult> {
  const { baseUrl, apiKey } = getQrisConfig();
  if (!baseUrl || !apiKey) {
    return { success: false, error: "Qris is not configured" };
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(
      `${baseUrl}/payment/${encodeURIComponent(paymentId)}/qris.png`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${apiKey}` },
      },
      REQUEST_TIMEOUT_MS
    );
  } catch {
    return { success: false, error: "Qris request failed" };
  }

  if (!response.ok) {
    return { success: false, error: `QR image lookup failed (HTTP ${response.status})` };
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("image/png")) {
    return { success: false, error: "Unexpected QR image content type" };
  }

  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_QR_IMAGE_BYTES) {
    return { success: false, error: "QR image too large" };
  }

  let image: Buffer;
  try {
    image = await readImageWithTimeout(response, REQUEST_TIMEOUT_MS);
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message === "QR image too large"
          ? "QR image too large"
          : "QR image read failed",
    };
  }

  if (image.byteLength === 0 || image.byteLength > MAX_QR_IMAGE_BYTES) {
    return { success: false, error: "QR image too large" };
  }

  return { success: true, image };
}

// ============================================
// Webhook signature
// ============================================

/**
 * Verify X-Signature (lowercase-hex HMAC-SHA256 over the raw request body)
 * using a constant-time comparison.
 */
export function verifyQrisWebhookSignature(
  rawBody: Buffer | string,
  signature: string | null
): boolean {
  const { webhookHmacKey } = getQrisConfig();
  if (!webhookHmacKey || !signature || !/^[a-f0-9]{64}$/.test(signature)) {
    return false;
  }

  const expected = crypto.createHmac("sha256", webhookHmacKey).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");

  return (
    expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
