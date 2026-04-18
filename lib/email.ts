import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

interface EmailData {
  orderId: string;
  productTitle: string;
  amountPaid: number;
  orderDate: string;
  customerEmail: string;
}

interface PlainTextEmailPayload {
  to: string;
  subject: string;
  text: string;
}

export interface EmailSendResult {
  success: boolean;
  message?: string;
  error?: string;
}

function buildOrderLink(orderId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${baseUrl}/order/${orderId}`;
}

function buildSubject(data: EmailData): string {
  return `Pembelian selesai - ${data.productTitle}`;
}

function buildBody(data: EmailData): string {
  return [
    "Halo,",
    "",
    `Pembayaran untuk ${data.productTitle} sudah diterima.`,
    "",
    `Order ID: ${data.orderId}`,
    `Jumlah Bayar: Rp ${data.amountPaid.toLocaleString("id-ID")}`,
    `Tanggal: ${data.orderDate}`,
    "",
    "Akses utama tersedia di halaman order kamu:",
    buildOrderLink(data.orderId),
    "",
    "Email ini hanya sebagai salinan. Jika perlu recovery, gunakan email ini atau order ID di halaman recover.",
  ].join("\n");
}

function getMissingCloudflareConfig(): string[] {
  const missing: string[] = [];

  if (!process.env.CLOUDFLARE_EMAIL_API_URL) {
    missing.push("CLOUDFLARE_EMAIL_API_URL");
  }

  if (!process.env.CLOUDFLARE_EMAIL_API_KEY) {
    missing.push("CLOUDFLARE_EMAIL_API_KEY");
  }

  return missing;
}

function isLocalBaseUrl(baseUrl: string | undefined): boolean {
  if (!baseUrl) return false;

  try {
    const hostname = new URL(baseUrl).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

function shouldUseLocalOutboxFallback(): boolean {
  if (process.env.EMAIL_DEV_FALLBACK === "1") {
    return true;
  }

  if (process.env.EMAIL_DEV_FALLBACK === "0") {
    return false;
  }

  return process.env.NODE_ENV !== "production" || isLocalBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
}

function getCloudflareConfigError(): string {
  const missing = getMissingCloudflareConfig();
  const suffix = missing.length > 0 ? ` Missing: ${missing.join(", ")}.` : "";

  return `Cloudflare email is not configured.${suffix}`;
}

function getEmailFromAddress(): string | undefined {
  return (
    process.env.CLOUDFLARE_EMAIL_FROM || process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_FROM
  );
}

function getEmailFromName(): string {
  return process.env.CLOUDFLARE_EMAIL_FROM_NAME || process.env.EMAIL_FROM_NAME || "AutoBeli";
}

function getEmailReplyTo(): string | undefined {
  return process.env.CLOUDFLARE_EMAIL_REPLY_TO || process.env.EMAIL_REPLY_TO;
}

function formatFromHeader(fromEmail: string, fromName: string): string {
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
}

function buildCloudflarePayload(payload: PlainTextEmailPayload) {
  const fromEmail = getEmailFromAddress();
  const fromName = getEmailFromName();
  const replyTo = getEmailReplyTo();

  return {
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    ...(fromEmail
      ? {
          from: formatFromHeader(fromEmail, fromName),
          fromEmail,
          fromName,
        }
      : {}),
    ...(replyTo ? { replyTo } : {}),
  };
}

function buildCloudflareHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };
}

function normalizeProviderError(raw: string): string {
  const normalized = raw.replace(/\s+/g, " ").trim();
  return normalized.length > 300 ? `${normalized.slice(0, 300)}...` : normalized;
}

async function getProviderErrorMessage(response: Response): Promise<string> {
  const rawText = await response.text();

  if (!rawText) {
    return "";
  }

  try {
    const parsed = JSON.parse(rawText) as { error?: unknown; message?: unknown; details?: unknown };
    const detail =
      (typeof parsed.error === "string" && parsed.error) ||
      (typeof parsed.message === "string" && parsed.message) ||
      (typeof parsed.details === "string" && parsed.details) ||
      rawText;

    return normalizeProviderError(detail);
  } catch {
    return normalizeProviderError(rawText);
  }
}

async function sendViaCloudflare(
  payload: PlainTextEmailPayload,
  apiUrl: string,
  apiKey: string
): Promise<EmailSendResult> {
  const requestBody = buildCloudflarePayload(payload);

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: buildCloudflareHeaders(apiKey),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const providerError = await getProviderErrorMessage(response);
      console.error("[Email] Cloudflare email API error:", {
        status: response.status,
        error: providerError,
      });

      return {
        success: false,
        error: providerError
          ? `Cloudflare email API error: ${response.status} - ${providerError}`
          : `Cloudflare email API error: ${response.status}`,
      };
    }

    return { success: true, message: "sent" };
  } catch (error) {
    console.error("[Email] Failed to call Cloudflare email API:", error);
    return { success: false, error: "Failed to send email" };
  }
}

function getLocalOutboxDirectory(): string {
  return process.env.EMAIL_DEV_OUTBOX_DIR || path.join(process.cwd(), ".tmp", "email-outbox");
}

async function sendViaLocalOutbox(payload: PlainTextEmailPayload): Promise<EmailSendResult> {
  const outboxDir = getLocalOutboxDirectory();
  const filename = `${new Date().toISOString().slice(0, 10)}.jsonl`;
  const entry = {
    createdAt: new Date().toISOString(),
    transport: "local-outbox",
    ...payload,
  };

  try {
    await mkdir(outboxDir, { recursive: true });
    await appendFile(path.join(outboxDir, filename), `${JSON.stringify(entry)}\n`, "utf8");
    console.log(`[Email] Stored email in local outbox: ${path.join(outboxDir, filename)}`);
    return { success: true, message: `stored in local outbox (${path.join(outboxDir, filename)})` };
  } catch (error) {
    console.error("[Email] Failed to write local outbox email:", error);
    return { success: false, error: "Failed to write local email outbox" };
  }
}

export async function sendPlainTextEmail(
  to: string,
  subject: string,
  text: string
): Promise<EmailSendResult> {
  const apiUrl = process.env.CLOUDFLARE_EMAIL_API_URL;
  const apiKey = process.env.CLOUDFLARE_EMAIL_API_KEY;

  if (apiUrl && apiKey) {
    return sendViaCloudflare({ to, subject, text }, apiUrl, apiKey);
  }

  const configError = getCloudflareConfigError();

  if (shouldUseLocalOutboxFallback()) {
    console.warn(`[Email] ${configError} Using local outbox fallback.`);
    return sendViaLocalOutbox({ to, subject, text });
  }

  console.warn(`[Email] ${configError}`);
  return { success: false, error: configError };
}

export async function sendOrderConfirmationEmail(data: EmailData): Promise<EmailSendResult> {
  return sendPlainTextEmail(data.customerEmail, buildSubject(data), buildBody(data));
}
