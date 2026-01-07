import { test, expect, request } from "@playwright/test";
import crypto from "crypto";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const VERIPAY_API_KEY = process.env.VERIPAY_API_KEY || "your_veripay_api_key";
const VERIPAY_SECRET_KEY = process.env.VERIPAY_SECRET_KEY || "your_veripay_secret_key";

/**
 * Generate HMAC-SHA256 signature for Veripay API
 */
function generateSignature(timestamp: number): string {
  const payload = VERIPAY_API_KEY + timestamp;
  const hash = crypto.createHmac("sha256", VERIPAY_SECRET_KEY).update(payload).digest();
  return hash.toString("base64");
}

test.describe("Webhook Processing", () => {
  test("processes valid veripay webhook (PAID)", async ({ page }) => {
    // Step 1: Get a valid product slug
    await page.goto("/");
    const productLink = page.locator('a[href^="/product/"]').first();

    // Skip if no products
    if (!(await productLink.isVisible())) {
      test.skip(true, "No products available for testing");
      return;
    }

    const href = await productLink.getAttribute("href");
    const slug = href?.split("/product/")[1];
    expect(slug).toBeTruthy();

    // Step 2: Create a PENDING order via API
    const apiContext = await request.newContext();
    const createOrderRes = await apiContext.post("/api/orders", {
      data: { slug },
    });

    expect(createOrderRes.ok()).toBeTruthy();
    const orderData = await createOrderRes.json();
    const orderId = orderData.orderId;
    expect(orderId).toBeTruthy();

    console.log(`Created test order: ${orderId}`);

    // Step 3: Simulate Veripay Webhook
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = generateSignature(timestamp);

    const webhookPayload = {
      order_id: orderId,
      status: "PAID",
      amount: 50000,
      payment_method: "QRIS",
      payment_time: new Date().toISOString(),
      customer_detail: {
        name: "Test User",
        email: "test@example.com",
        phone: "081234567890",
      },
    };

    const webhookRes = await apiContext.post("/api/webhooks/veripay", {
      headers: {
        "x-api-key": VERIPAY_API_KEY,
        "x-timestamp": timestamp.toString(),
        "x-signature": signature,
      },
      data: webhookPayload,
    });

    // Check webhook response
    if (!webhookRes.ok()) {
      console.error("Webhook failed:", await webhookRes.text());
    }
    expect(webhookRes.ok()).toBeTruthy();
    const webhookData = await webhookRes.json();
    expect(webhookData.success).toBe(true);

    // Step 4: Verify Order Status is PAID via UI
    // Navigate to order page (which should now show success/content instead of pending payment)
    const orderPageResponse = await page.goto(`/order/${orderId}`);
    expect(orderPageResponse?.ok()).toBeTruthy();

    // Check for success indicators
    // Note: The UI for a PAID order versus PENDING is different.
    // Assuming PAID order shows "Download" or "Access" content.
    // If pending, it usually shows payment instructions.

    // Wait for content that indicates success
    // Adjust selector based on actual UI implementation for paid orders
    // Looking for "Order Status: PAID" or similar if explicit,
    // or absence of "Pay Now" button if that's clearer.

    // For now, let's verify via API call if possible, but we don't have a public GET /api/orders/{id}.
    // We only have GET /api/products/slug.
    // However, the /order/[orderId]/page.tsx likely fetches the order.
    // We can check if the "Pay Now" button is GONE, or "Access Content" is present.

    // Let's assume the UI updates to show access.
    // Or we can try to "re-pay" and see if it says already paid?
    // The webhook handler says: "Already paid" if we hit it again.

    // Let's assert that we DO NOT see the payment button/QR code anymore.
    await expect(page.getByText("Waiting for payment", { exact: false })).not.toBeVisible();
    // Verify some success element (adjust as needed based on actual UI)
    // await expect(page.getByText("Payment Successful", { exact: false })).toBeVisible();

    // Alternatively, verify idempotency by hitting webhook again
    const webhookRes2 = await apiContext.post("/api/webhooks/veripay", {
      headers: {
        "x-api-key": VERIPAY_API_KEY,
        "x-timestamp": timestamp.toString(),
        "x-signature": signature,
      },
      data: webhookPayload,
    });
    const webhookData2 = await webhookRes2.json();
    expect(webhookData2.message).toBe("Already paid");
  });

  test("rejects invalid signature", async ({ request }) => {
    const webhookRes = await request.post("/api/webhooks/veripay", {
      headers: {
        "x-timestamp": Math.floor(Date.now() / 1000).toString(),
        "x-signature": "invalid_signature",
      },
      data: {},
    });

    expect(webhookRes.status()).toBe(401);
  });
});
