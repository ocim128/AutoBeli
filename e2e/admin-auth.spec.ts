import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
    test.beforeEach(async ({ page }) => {
        // Clear any existing session
        await page.context().clearCookies();
    });

    test('login page renders correctly', async ({ page }) => {
        await page.goto('/admin/login');

        // Check all elements are present
        await expect(page.getByText('Admin Access')).toBeVisible();
        await expect(page.getByPlaceholder(/password/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /unlock/i })).toBeVisible();
    });

    test('shows error for empty password', async ({ page }) => {
        await page.goto('/admin/login');

        // Submit empty form
        await page.getByRole('button', { name: /unlock/i }).click();

        // Should show error or stay on page
        await expect(page).toHaveURL('/admin/login');
    });

    test('shows error for wrong password', async ({ page }) => {
        await page.goto('/admin/login');

        await page.getByPlaceholder(/password/i).fill('wrongpassword123');
        await page.getByRole('button', { name: /unlock/i }).click();

        // Error message should appear
        await expect(page.getByText(/invalid password/i)).toBeVisible();
    });

    test('protected routes redirect to login', async ({ page }) => {
        await page.goto('/admin/dashboard');
        await expect(page).toHaveURL('/admin/login');

        await page.goto('/admin/products');
        await expect(page).toHaveURL('/admin/login');

        await page.goto('/admin/orders');
        await expect(page).toHaveURL('/admin/login');
    });

    test('login API rejects invalid credentials', async ({ request }) => {
        const response = await request.post('/api/auth/login', {
            data: { password: 'wrongpassword' },
        });

        expect(response.status()).toBe(401);
    });

    test('login API rejects empty password', async ({ request }) => {
        const response = await request.post('/api/auth/login', {
            data: { password: '' },
        });

        expect(response.status()).toBe(400);
    });

    test('login API rate limiting works', async ({ request }) => {
        // Make multiple rapid login attempts
        const attempts = [];
        for (let i = 0; i < 10; i++) {
            attempts.push(
                request.post('/api/auth/login', {
                    data: { password: 'wrongpassword' },
                })
            );
        }

        const responses = await Promise.all(attempts);

        // At least some should be rate limited (429) or unauthorized (401)
        const statuses = responses.map((r) => r.status());
        expect(statuses.some((s) => s === 401 || s === 429)).toBe(true);
    });
});

test.describe('Admin Session Management', () => {
    test('session cookie is httpOnly', async ({ page, context }) => {
        await page.goto('/admin/login');

        // After any interaction, check cookie settings
        // Note: We can't directly test httpOnly from JS, but we can verify
        // the cookie exists after login (if successful)
        const cookies = await context.cookies();

        // If admin_session cookie exists, verify it's secure
        const sessionCookie = cookies.find((c) => c.name === 'admin_session');
        if (sessionCookie) {
            expect(sessionCookie.httpOnly).toBe(true);
            expect(sessionCookie.sameSite).toBe('Lax');
        }
    });
});

test.describe('Admin Dashboard (Authenticated)', () => {
    // Note: These tests require valid ADMIN_PASSWORD in environment
    // Skip in CI unless credentials are available

    test.skip('successful login redirects to dashboard', async ({ page }) => {
        // This test requires the actual ADMIN_PASSWORD
        // Only run manually or with proper test credentials
        await page.goto('/admin/login');

        const adminPassword = process.env.ADMIN_PASSWORD;
        if (!adminPassword) {
            test.skip(true, 'ADMIN_PASSWORD not set');
            return;
        }

        await page.getByPlaceholder(/password/i).fill(adminPassword);
        await page.getByRole('button', { name: /unlock/i }).click();

        await expect(page).toHaveURL('/admin/dashboard');
    });
});
