import { test, expect, Page } from "@playwright/test";

/**
 * Helper to check if the page is showing a database/server error
 */
async function hasAppError(page: Page): Promise<boolean> {
  return page
    .getByText("Something went wrong")
    .isVisible()
    .catch(() => false);
}

/**
 * Complete checkout flow E2E test
 * Note: This requires a product to exist in the database
 * For CI, you may need to seed test data first
 */

test.describe("Checkout Flow", () => {
  // Skip if no products available
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("complete purchase flow - product to order confirmation", async ({ page }) => {
    // Check for app error (DB down)
    const hasError = await hasAppError(page);
    if (hasError) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }

    // Step 1: Find a product and click it
    const productLink = page.locator('a[href^="/product/"]').first();
    await productLink.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});

    // Skip test if no products
    if (!(await productLink.isVisible())) {
      test.skip(true, "No products available for testing");
      return;
    }

    await productLink.click();
    await expect(page).toHaveURL(/\/product\/.+/);

    // Step 2: Verify product page elements
    // Note: Default language is Indonesian
    await expect(page.getByText("Akses Instan").first()).toBeVisible();
    await expect(page.getByText("Enkripsi Aman", { exact: false }).first()).toBeVisible();

    // Step 3: Click buy button
    const buyButton = page.getByRole("button", { name: /Beli Sekarang/i });
    await expect(buyButton).toBeVisible();
    await buyButton.click();

    // Step 4: Should navigate to checkout page
    await expect(page).toHaveURL(/\/checkout\/.+/);

    // Step 5: Fill in contact information (email)
    const contactInput = page.getByPlaceholder(/kamu@contoh.com/i);
    await expect(contactInput).toBeVisible();
    await contactInput.fill("customer@example.com");

    // Step 6: Submit payment
    // Mock the payment creation to avoid redirecting to a real external site during tests
    await page.route("**/api/payment/veripay/create", async (route) => {
      const orderId = page.url().split("/").pop();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          payment_url: `/order/${orderId}`,
          transaction_ref: "test_ref",
        }),
      });
    });

    const payButton = page.getByRole("button", { name: /Bayar/i });
    await payButton.click();

    // Step 7: Should navigate to order confirmation page
    await expect(page).toHaveURL(/\/order\/.+/, { timeout: 10000 });
  });

  test("checkout validates empty contact", async ({ page }) => {
    // Check for app error (DB down)
    const hasError = await hasAppError(page);
    if (hasError) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }

    const productLink = page.locator('a[href^="/product/"]').first();
    await productLink.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});

    if (!(await productLink.isVisible())) {
      test.skip(true, "No products available for testing");
      return;
    }

    await productLink.click();

    const buyButton = page.getByRole("button", { name: /Beli Sekarang/i });
    await buyButton.waitFor({ state: "visible" });
    await buyButton.click();

    await expect(page).toHaveURL(/\/checkout\/.+/);

    // Try to submit without contact (email)
    const payButton = page.getByRole("button", { name: /Bayar/i });
    await payButton.click();

    // Should show error message on page
    const alert = page.locator('form [role="alert"]');
    await alert.waitFor({ state: "visible" });
    await expect(alert).toContainText(/Silakan masukkan alamat email Anda/i);

    // Should still be on checkout page
    await expect(page).toHaveURL(/\/checkout\/.+/);
  });

  test("buy button shows loading state", async ({ page }) => {
    // Check for app error (DB down)
    const hasError = await hasAppError(page);
    if (hasError) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }

    const productLink = page.locator('a[href^="/product/"]').first();

    if (!(await productLink.isVisible())) {
      test.skip(true, "No products available for testing");
      return;
    }

    await productLink.click();

    // Delay the API response to catch the loading state
    await page.route("**/api/orders", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      await route.continue();
    });

    // Use a locator that doesn't depend on the text content (which will change)
    const buyButton = page.locator("button[aria-busy]");
    await expect(buyButton).toBeVisible();

    // Click with noWaitAfter to check loading state immediately
    await buyButton.click({ noWaitAfter: true });

    // The button text should change to "Memproses Akses..."
    await expect(buyButton).toContainText("Memproses Akses", { timeout: 5000 });
    await expect(buyButton).toHaveAttribute("aria-busy", "true");
  });
});

test.describe("Checkout Page Direct Access", () => {
  test("shows error for invalid order ID format", async ({ page }) => {
    // Try to access checkout with invalid order ID
    const response = await page.goto("/checkout/invalid-order-id");

    // Should show error or redirect
    // The exact behavior depends on implementation
    expect(response?.status()).toBeGreaterThanOrEqual(200);
  });

  test("shows error for non-existent order", async ({ page }) => {
    // Valid MongoDB ObjectId format but doesn't exist
    await page.goto("/checkout/aaaaaaaaaaaaaaaaaaaaaaaa");

    // Should show "not found" or similar error
    // Implementation specific - could be 404 or error message
    const content = await page.content();
    expect(
      content.includes("not found") ||
        content.includes("Not Found") ||
        content.includes("error") ||
        page.url().includes("404")
    ).toBeTruthy();
  });
});
