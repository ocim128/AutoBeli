import { test, expect } from "./fixtures";

import { E2E_PRODUCT_SLUG } from "./helpers/config";

test.describe("Webhook Processing", () => {
  test("rejects the legacy Pakasir webhook for a QRIS order", async ({ request }) => {
    const slug = E2E_PRODUCT_SLUG;

    // Step 2: Create a PENDING order via API
    const apiContext = request;
    const createOrderRes = await apiContext.post("/api/orders", {
      data: { slug },
    });

    expect(createOrderRes.ok()).toBeTruthy();
    const orderData = await createOrderRes.json();
    const orderId = orderData.orderId;
    expect(orderId).toBeTruthy();

    console.log(`Created test order: ${orderId}`);

    // A legacy webhook must not be able to settle an order created under QRIS.
    const webhookPayload = {
      order_id: orderId,
      status: "completed",
      amount: 50000,
      project: process.env.PAKASIR_PROJECT_SLUG || "test-project",
      payment_method: "qris",
      completed_at: new Date().toISOString(),
    };

    const webhookRes = await apiContext.post("/api/webhooks/pakasir", {
      data: webhookPayload,
    });

    expect(webhookRes.status()).toBe(400);
    expect((await webhookRes.json()).error).toContain("payment gateway");
  });

  test("rejects invalid webhook payload", async ({ request }) => {
    const webhookRes = await request.post("/api/webhooks/pakasir", {
      data: {
        // Missing required fields
        order_id: "invalid",
      },
    });

    expect(webhookRes.status()).toBe(400);
  });

  test("returns 404 for non-existent order", async ({ request }) => {
    const webhookPayload = {
      order_id: "aaaaaaaaaaaaaaaaaaaaaaaa", // Valid format but doesn't exist
      status: "completed",
      amount: 50000,
      project: "test-project",
      payment_method: "qris",
    };

    const webhookRes = await request.post("/api/webhooks/pakasir", {
      data: webhookPayload,
    });

    expect(webhookRes.status()).toBe(404);
  });
});
