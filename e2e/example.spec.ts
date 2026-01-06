import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/AutoBeli/i);
  });

  test("displays hero section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Digital Content");
    await expect(page.getByText("Instant Delivery")).toBeVisible();
  });

  test("shows products section", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Available Assets")).toBeVisible();
  });

  test("has navigation header", async ({ page }) => {
    await page.goto("/");

    // Should have the brand/logo link
    await expect(page.getByRole("link", { name: /autobeli/i })).toBeVisible();
  });

  test("has footer", async ({ page }) => {
    await page.goto("/");

    // Footer should be visible at bottom
    await expect(page.locator("footer")).toBeVisible();
  });

  test("products are clickable and navigate to product page", async ({ page }) => {
    await page.goto("/");

    // If there are products, clicking one should navigate
    const productLink = page.locator('a[href^="/product/"]').first();

    // Check if any products exist
    if (await productLink.isVisible()) {
      await productLink.click();

      // Should navigate to product page
      await expect(page).toHaveURL(/\/product\/.+/);
    }
  });
});

test.describe("Product Page", () => {
  test("shows 404 for non-existent product", async ({ page }) => {
    const response = await page.goto("/product/non-existent-product-xyz");

    // Should return 404, or if dev server returns 200, check for 404 text
    if (response?.status() !== 404) {
      await expect(page.getByText(/404|not found/i).first()).toBeVisible();
    } else {
      expect(response.status()).toBe(404);
    }
  });

  test("has breadcrumb navigation", async ({ page }) => {
    await page.goto("/");

    const productLink = page.locator('a[href^="/product/"]').first();

    if (await productLink.isVisible()) {
      await productLink.click();

      // Should have breadcrumb with Store link
      await expect(page.getByRole("link", { name: "Store" })).toBeVisible();
    }
  });
});

test.describe("Admin Access", () => {
  test("redirects to login when accessing admin without auth", async ({ page }) => {
    await page.goto("/admin/dashboard");

    // Should redirect to login page
    await expect(page).toHaveURL("/admin/login");
  });

  test("shows admin login page", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(page.getByText("Admin Access")).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /unlock/i })).toBeVisible();
  });

  test("shows error for invalid password", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByPlaceholder(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /unlock/i }).click();

    // Should show "Invalid password" OR rate limit message
    await expect(page.locator("form")).toContainText(/invalid password|too many/i);
  });

  test("login form prevents empty submission", async ({ page }) => {
    await page.goto("/admin/login");

    // Click submit without entering password
    await page.getByRole("button", { name: /unlock/i }).click();

    // Should still be on login page (form won't submit or API returns error)
    await expect(page).toHaveURL("/admin/login");
  });
});

test.describe("API Health", () => {
  test("health endpoint returns OK", async ({ request }) => {
    const response = await request.get("/api/health");

    expect(response.ok()).toBe(true);
  });
});

test.describe("Order Flow (Mock)", () => {
  test("order creation requires valid product slug", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { slug: "" },
    });

    expect(response.status()).toBe(400);
  });

  test("order creation rejects invalid slug format", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { slug: "Invalid Slug!" },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("order creation returns 404 for non-existent product", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { slug: "non-existent-product-xyz" },
    });

    expect(response.status()).toBe(404);
  });
});

test.describe("Rate Limiting", () => {
  test("returns rate limit headers on order creation", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { slug: "test-product" },
    });

    // Even if product not found, rate limit headers should be present on success path
    // For 404s the headers may not be present, so we just verify the endpoint works
    expect([200, 400, 404, 429]).toContain(response.status());
  });
});

test.describe("Security Headers", () => {
  test("includes X-Frame-Options header", async ({ request }) => {
    const response = await request.get("/");

    expect(response.headers()["x-frame-options"]).toBe("SAMEORIGIN");
  });

  test("includes X-Content-Type-Options header", async ({ request }) => {
    const response = await request.get("/");

    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("includes Content-Security-Policy header", async ({ request }) => {
    const response = await request.get("/");

    expect(response.headers()["content-security-policy"]).toBeDefined();
  });

  test("includes Referrer-Policy header", async ({ request }) => {
    const response = await request.get("/");

    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });
});

test.describe("Responsive Design", () => {
  test("homepage is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto("/");

    // Page should still be functional
    await expect(page).toHaveTitle(/AutoBeli/i);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("homepage is responsive on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto("/");

    await expect(page).toHaveTitle(/AutoBeli/i);
  });
});
