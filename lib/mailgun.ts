import { getSettings } from "@/lib/settings";

interface EmailData {
  orderId: string;
  productTitle: string;
  amountPaid: number;
  orderDate: string;
  customerEmail: string;
}

interface MailgunResponse {
  success: boolean;
  message?: string;
  error?: string;
}

function replaceTemplateVariables(template: string, data: EmailData): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const orderLink = `${baseUrl}/order/${data.orderId}`;

  return template
    .replace(/\{\{orderId\}\}/g, data.orderId)
    .replace(/\{\{productTitle\}\}/g, data.productTitle)
    .replace(/\{\{amountPaid\}\}/g, data.amountPaid.toLocaleString("id-ID"))
    .replace(/\{\{orderDate\}\}/g, data.orderDate)
    .replace(/\{\{orderLink\}\}/g, orderLink);
}

export async function sendOrderConfirmationEmail(data: EmailData): Promise<MailgunResponse> {
  const settings = await getSettings();

  // Check if email is enabled
  if (!settings.emailEnabled) {
    console.log("[Mailgun] Email notifications are disabled");
    return { success: false, error: "Email notifications are disabled" };
  }

  // Check required configuration
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = settings.mailgunDomain;

  if (!apiKey) {
    console.error("[Mailgun] Missing MAILGUN_API_KEY environment variable");
    return { success: false, error: "Mailgun API key not configured" };
  }

  if (!domain) {
    console.error("[Mailgun] Missing Mailgun domain in settings");
    return { success: false, error: "Mailgun domain not configured" };
  }

  if (!settings.emailFromAddress) {
    console.error("[Mailgun] Missing sender email address in settings");
    return { success: false, error: "Sender email not configured" };
  }

  // Build email content from templates
  const subject = replaceTemplateVariables(settings.emailSubjectTemplate, data);
  const body = replaceTemplateVariables(settings.emailBodyTemplate, data);

  // Prepare form data for Mailgun API
  const formData = new FormData();
  formData.append("from", `${settings.emailFromName} <${settings.emailFromAddress}>`);
  formData.append("to", data.customerEmail);
  formData.append("subject", subject);
  formData.append("text", body);

  try {
    // Mailgun API endpoint
    const url = `https://api.mailgun.net/v3/${domain}/messages`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Mailgun] API error:", response.status, errorText);
      return { success: false, error: `Mailgun API error: ${response.status}` };
    }

    const result = await response.json();
    console.log("[Mailgun] Email sent successfully:", result.id);
    return { success: true, message: result.id };
  } catch (error) {
    console.error("[Mailgun] Failed to send email:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export async function sendTestEmail(recipientEmail: string): Promise<MailgunResponse> {
  // Use dummy data to test the template
  const testData: EmailData = {
    orderId: "TEST-ORDER-" + Math.floor(Math.random() * 10000),
    productTitle: "Test Product (Digital License)",
    amountPaid: 150000,
    orderDate: new Date().toLocaleString("en-GB", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    customerEmail: recipientEmail,
  };

  return sendOrderConfirmationEmail(testData);
}
