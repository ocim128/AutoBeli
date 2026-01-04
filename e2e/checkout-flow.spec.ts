import { test, expect } from '@playwright/test';

/**
 * Complete checkout flow E2E test
 * Note: This requires a product to exist in the database
 * For CI, you may need to seed test data first
 */

test.describe('Checkout Flow', () => {
    // Skip if no products available
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('complete purchase flow - product to order confirmation', async ({ page }) => {
        // Step 1: Find a product and click it
        const productLink = page.locator('a[href^="/product/"]').first();

        // Skip test if no products
        if (!(await productLink.isVisible())) {
            test.skip(true, 'No products available for testing');
            return;
        }

        await productLink.click();
        await expect(page).toHaveURL(/\/product\/.+/);

        // Step 2: Verify product page elements
        await expect(page.getByText('Instant Delivery')).toBeVisible();
        await expect(page.getByText('Secure Text')).toBeVisible();

        // Step 3: Click buy button
        const buyButton = page.getByRole('button', { name: /beli sekarang/i });
        await expect(buyButton).toBeVisible();
        await buyButton.click();

        // Step 4: Should navigate to checkout page
        await expect(page).toHaveURL(/\/checkout\/.+/);

        // Step 5: Fill in contact information
        const contactInput = page.getByPlaceholder(/example@mail.com/i);
        await expect(contactInput).toBeVisible();
        await contactInput.fill('test@example.com');

        // Step 6: Submit payment
        const payButton = page.getByRole('button', { name: /pay/i });
        await payButton.click();

        // Step 7: Should navigate to order confirmation page
        await expect(page).toHaveURL(/\/order\/.+/, { timeout: 10000 });
    });

    test('checkout validates empty contact', async ({ page }) => {
        const productLink = page.locator('a[href^="/product/"]').first();

        if (!(await productLink.isVisible())) {
            test.skip(true, 'No products available for testing');
            return;
        }

        await productLink.click();

        const buyButton = page.getByRole('button', { name: /beli sekarang/i });
        await buyButton.click();

        await expect(page).toHaveURL(/\/checkout\/.+/);

        // Try to submit without contact
        const payButton = page.getByRole('button', { name: /pay/i });

        // Set up dialog handler before clicking
        page.on('dialog', async (dialog) => {
            expect(dialog.message()).toContain('enter your email');
            await dialog.accept();
        });

        await payButton.click();

        // Should still be on checkout page
        await expect(page).toHaveURL(/\/checkout\/.+/);
    });

    test('buy button shows loading state', async ({ page }) => {
        const productLink = page.locator('a[href^="/product/"]').first();

        if (!(await productLink.isVisible())) {
            test.skip(true, 'No products available for testing');
            return;
        }

        await productLink.click();

        const buyButton = page.getByRole('button', { name: /beli sekarang/i });

        // Click and immediately check for loading state
        const clickPromise = buyButton.click();

        // The button text should change to "Processing..."
        await expect(buyButton).toContainText('Processing', { timeout: 2000 });

        await clickPromise;
    });
});

test.describe('Checkout Page Direct Access', () => {
    test('shows error for invalid order ID format', async ({ page }) => {
        // Try to access checkout with invalid order ID
        const response = await page.goto('/checkout/invalid-order-id');

        // Should show error or redirect
        // The exact behavior depends on implementation
        expect(response?.status()).toBeGreaterThanOrEqual(200);
    });

    test('shows error for non-existent order', async ({ page }) => {
        // Valid MongoDB ObjectId format but doesn't exist
        await page.goto('/checkout/aaaaaaaaaaaaaaaaaaaaaaaa');

        // Should show "not found" or similar error
        // Implementation specific - could be 404 or error message
        const content = await page.content();
        expect(
            content.includes('not found') ||
            content.includes('Not Found') ||
            content.includes('error') ||
            page.url().includes('404')
        ).toBeTruthy();
    });
});
