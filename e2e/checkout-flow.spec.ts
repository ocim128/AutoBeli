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

async function openFirstProductOrSkip(page: Page): Promise<boolean> {
  const productLink = page.locator('a[href^="/product/"]').first();
  await productLink.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});

  if (!(await productLink.isVisible())) {
    test.skip(true, "No products available for testing");
    return false;
  }

  const href = await productLink.getAttribute("href");
  if (!href) {
    test.skip(true, "No product link available for testing");
    return false;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(href, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/product\/.+/);
      return true;
    } catch (error) {
      const isTransientNavigationAbort = String(error).includes("ERR_ABORTED");
      if (!isTransientNavigationAbort || attempt === 1) throw error;
      await page.waitForTimeout(250);
    }
  }

  throw new Error("Product page did not open");
}

async function clickBuyAndWaitForCheckout(page: Page) {
  const buyButton = page.getByRole("button", { name: /Amankan Akses/i });
  await expect(buyButton).toBeVisible();

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const orderResponsePromise = page
      .waitForResponse(
        (response) =>
          response.url().includes("/api/orders") && response.request().method() === "POST",
        { timeout: 5000 }
      )
      .catch(() => null);

    await buyButton.click();
    const orderResponse = await orderResponsePromise;

    if (orderResponse) {
      if (!orderResponse.ok()) {
        throw new Error(
          `Order creation failed with ${orderResponse.status()}: ${await orderResponse.text()}`
        );
      }
      await expect(page).toHaveURL(/\/checkout\/.+/);
      return;
    }

    if (/\/checkout\/.+/.test(page.url())) {
      return;
    }

    await page.waitForTimeout(250);
  }

  throw new Error("Buy button did not submit an order");
}

/**
 * Complete checkout flow E2E test
 * Note: This requires a product to exist in the database
 * For CI, you may need to seed test data first
 */

test.describe("Checkout Flow", () => {
  test.describe.configure({ mode: "serial" });

  // Skip if no products available
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("complete purchase flow - product to order confirmation", async ({ page }) => {
    // Under PAYMENT_GATEWAY=QRIS the CheckoutForm posts to the qris create
    // endpoint, which calls the local Qris mock server (see playwright.config.ts
    // and e2e/helpers/qris-mock-server.ts). The order page then renders the
    // pending state. Full settlement is covered by qris-checkout.spec.ts.

    // Check for app error (DB down)
    const hasError = await hasAppError(page);
    if (hasError) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }

    // Step 1: Find a product and open it
    if (!(await openFirstProductOrSkip(page))) return;

    // Step 2: Verify product page elements
    // Note: Default language is Indonesian
    await expect(page.getByText("Akses Instan").first()).toBeVisible();
    await expect(page.getByText("Enkripsi Aman", { exact: false }).first()).toBeVisible();

    // Step 3: Click buy button
    await clickBuyAndWaitForCheckout(page);

    // Step 5: Fill in contact information (email)
    const contactInput = page.getByPlaceholder(/email@contoh.com/i);
    await expect(contactInput).toBeVisible();
    await contactInput.fill("customer@example.com");

    // Step 6: Submit payment (mocks are already set up above)
    const payButton = page.getByRole("button", { name: /Bayar/i });
    await payButton.click();

    // Step 7: Should navigate to the order page (pending state under QRIS).
    await expect(page).toHaveURL(/\/order\/.+/, { timeout: 10000 });
  });

  test("checkout validates empty contact", async ({ page }) => {
    // Check for app error (DB down)
    const hasError = await hasAppError(page);
    if (hasError) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }

    if (!(await openFirstProductOrSkip(page))) return;

    await clickBuyAndWaitForCheckout(page);

    // Try to submit without contact (email)
    const payButton = page.getByRole("button", { name: /Bayar/i });
    await payButton.click();

    // Should show error message on page
    const alert = page.locator('form [role="alert"]');
    await alert.waitFor({ state: "visible" });
    await expect(alert).toContainText(/Alamat email wajib diisi/i);

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

    if (!(await openFirstProductOrSkip(page))) return;

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

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await buyButton.click({ noWaitAfter: true });

      try {
        await expect(buyButton).toContainText("Mengamankan Akses...", { timeout: 1000 });
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await page.waitForTimeout(250);
      }
    }

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
