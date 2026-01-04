import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
    // Assuming the app is running on localhost:3000
    await page.goto('/');

    // Expect a title "to contain" a substring.
    // We might need to adjust this depending on the actual title of the app
    // For now, checking if the page loads and has *some* title is a start, or check for a specific element
    await expect(page).toHaveTitle(/AutoBeli/i);
});
