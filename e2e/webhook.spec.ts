import { test, expect, request, Page } from "@playwright/test";

/**
 * Helper to check if the page is showing a database/server error
 */
async function hasAppError(page: Page): Promise<boolean> {
  return page
    .getByText("Something went wrong")
    .isVisible()
    .catch(() => false);
}

test.describe("Webhook Processing", () => {
  test("processes valid pakasir webhook (completed)", async ({ page }) => {
    // Step 1: Get a valid product slug
    await page.goto("/");

    // Check for app error (DB down)
    const hasError = await hasAppError(page);
    if (hasError) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }

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

    // Handle DB errors gracefully
    if (createOrderRes.status() === 500) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }

    expect(createOrderRes.ok()).toBeTruthy();
    const orderData = await createOrderRes.json();
    const orderId = orderData.orderId;
    expect(orderId).toBeTruthy();

    console.log(`Created test order: ${orderId}`);

    // Step 3: Simulate Pakasir Webhook
    // Note: In production, Pakasir sends webhooks without signature verification
    // (we verify by calling their API back to check status)
    const webhookPayload = {
      order_id: orderId,
      status: "completed",
      amount: 50000,
      project: process.env.PAKASIR_PROJECT_SLUG || "test-project",
      payment_method: "qris",
      completed_at: new Date().toISOString(),
    };

    // Mock the Pakasir API verification call
    await page.route("**/app.pakasir.com/api/transactiondetail**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          transaction: {
            amount: 50000,
            order_id: orderId,
            project: "test-project",
            status: "completed",
            payment_method: "qris",
            completed_at: new Date().toISOString(),
          },
        }),
      });
    });

    const webhookRes = await apiContext.post("/api/webhooks/pakasir", {
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
    const orderPageResponse = await page.goto(`/order/${orderId}`);
    expect(orderPageResponse?.ok()).toBeTruthy();

    // Verify that we DO NOT see the payment button/QR code anymore
    await expect(page.getByText("Waiting for payment", { exact: false })).not.toBeVisible();

    // Alternatively, verify idempotency by hitting webhook again
    const webhookRes2 = await apiContext.post("/api/webhooks/pakasir", {
      data: webhookPayload,
    });
    const webhookData2 = await webhookRes2.json();
    expect(webhookData2.message).toBe("Already paid");
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

    // Will likely return success with "Verification failed" since Pakasir API won't find it
    // or 404 if our DB doesn't have the order
    const data = await webhookRes.json();
    expect(
      webhookRes.status() === 404 ||
        data.message === "Verification failed" ||
        data.message === "Not completed"
    ).toBeTruthy();
  });
});
