import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";

import { E2E_PRODUCT_SLUG } from "./helpers/config";

async function openSeededProduct(page: Page): Promise<void> {
  const href = `/product/${E2E_PRODUCT_SLUG}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await page.goto(href, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveURL(/\/product\/.+/);
      return;
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
 * Uses the product seeded by the setup project.
 */

test.describe("Checkout Flow", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("complete purchase flow - product to order confirmation", async ({ page }) => {
    // Under PAYMENT_GATEWAY=QRIS the CheckoutForm posts to the qris create
    // endpoint, which calls the local Qris mock server (see playwright.config.ts
    // and e2e/helpers/qris-mock-server.ts). The order page then renders the
    // pending state. Full settlement is covered by qris-checkout.spec.ts.

    // Step 1: Find a product and open it
    await openSeededProduct(page);

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
    await openSeededProduct(page);

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
    await openSeededProduct(page);

    // Hold a real successful response until the loading state is asserted.
    let releaseResponse!: () => void;
    const responseReady = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    await page.route("**/api/orders", async (route) => {
      if (route.request().method() === "POST") {
        const response = await route.fetch();
        expect(response.status()).toBe(200);
        await responseReady;
        await route.fulfill({ response });
        return;
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
    releaseResponse();
    await expect(page).toHaveURL(/\/checkout\/.+/, { timeout: 10000 });
  });
});

test.describe("Checkout Page Direct Access", () => {
  test("shows error for invalid order ID format", async ({ page }) => {
    // Try to access checkout with invalid order ID
    await page.goto("/checkout/invalid-order-id");
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
  });

  test("shows error for non-existent order", async ({ page }) => {
    // Valid MongoDB ObjectId format but doesn't exist
    await page.goto("/checkout/aaaaaaaaaaaaaaaaaaaaaaaa");

    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
  });
});
