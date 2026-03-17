interface EmailData {
  orderId: string;
  productTitle: string;
  amountPaid: number;
  orderDate: string;
  customerEmail: string;
}

interface EmailSendResult {
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

export async function sendOrderConfirmationEmail(data: EmailData): Promise<EmailSendResult> {
  const apiUrl = process.env.CLOUDFLARE_EMAIL_API_URL;
  const apiKey = process.env.CLOUDFLARE_EMAIL_API_KEY;

  if (!apiUrl || !apiKey) {
    console.log("[Email] Cloudflare email is not configured");
    return { success: false, error: "Cloudflare email is not configured" };
  }

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: data.customerEmail,
        subject: buildSubject(data),
        text: buildBody(data),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Email] Cloudflare email API error:", response.status, errorText);
      return { success: false, error: `Cloudflare email API error: ${response.status}` };
    }

    return { success: true, message: "sent" };
  } catch (error) {
    console.error("[Email] Failed to call Cloudflare email API:", error);
    return { success: false, error: "Failed to send email" };
  }
}
