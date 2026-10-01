import { test, expect } from "./fixtures";

import { E2E_PRODUCT_SLUG } from "./helpers/config";

test.describe("Homepage", () => {
  test("has correct title", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/AutoBeli/i);
  });

  test("displays hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Konten Digital");
    await expect(page.getByText("Pengiriman Instan").first()).toBeVisible();
  });

  test("shows products section", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 2, name: /Aset Tersedia|Available Assets/i })
    ).toBeVisible();
  });

  test("has navigation header", async ({ page }) => {
    await page.goto("/");

    // Should have the brand/logo link in the header (visible even on error pages)
    await expect(page.locator("header").getByRole("link", { name: /autobeli/i })).toBeVisible();
  });

  test("has footer", async ({ page }) => {
    await page.goto("/");

    // Footer should be visible at bottom (visible even on error pages)
    await expect(page.locator("footer")).toBeVisible();
  });

  test("products are clickable and navigate to product page", async ({ page }) => {
    await page.goto("/");

    const productLink = page.locator(`a[href="/product/${E2E_PRODUCT_SLUG}"]`).first();
    await expect(productLink).toBeVisible();
    await productLink.click();
    await expect(page).toHaveURL(`/product/${E2E_PRODUCT_SLUG}`);
  });
});

test.describe("Product Page", () => {
  test("shows 404 for non-existent product", async ({ page }) => {
    await page.goto("/product/non-existent-product-xyz");

    // Streamed App Router responses can carry HTTP 200 for a not-found page.
    await expect(page.getByRole("heading", { level: 1, name: "404" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /return to store|kembali ke toko/i }).first()
    ).toBeVisible();
  });

  test("has breadcrumb navigation", async ({ page }) => {
    await page.goto("/");

    const productLink = page.locator(`a[href="/product/${E2E_PRODUCT_SLUG}"]`).first();
    await expect(productLink).toBeVisible();
    await productLink.click();
    await expect(page.getByRole("link", { name: /Toko|Store/i }).first()).toBeVisible();
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

    // The isolated test IP has not exhausted its login limit.
    await expect(page.locator("form")).toContainText(/invalid password/i);
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
  test("health endpoint returns response", async ({ request }) => {
    const response = await request.get("/api/health");

    // The setup project requires a reachable database.
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBeDefined();
  });
});

test.describe("Order Flow (Mock)", () => {
  test("order creation requires valid product slug", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { slug: "" },
    });

    // Invalid input is rejected before database access.
    expect(response.status()).toBe(400);
  });

  test("order creation rejects invalid slug format", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { slug: "Invalid Slug!" },
    });

    // Invalid input is rejected before database access.
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  test("order creation returns 404 for non-existent product", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { slug: "non-existent-product-xyz" },
    });

    // Missing products must return 404.
    expect(response.status()).toBe(404);
  });
});

test.describe("Rate Limiting", () => {
  test("returns rate limit headers on order creation", async ({ request }) => {
    const response = await request.post("/api/orders", {
      data: { slug: E2E_PRODUCT_SLUG },
    });

    // A fresh test IP receives the configured rate-limit headers.
    expect(response.status()).toBe(200);
    expect(response.headers()["x-ratelimit-limit"]).toBe("10");
    expect(response.headers()["x-ratelimit-remaining"]).toBe("9");
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

    // Page should still be functional - title always works
    await expect(page).toHaveTitle(/AutoBeli/i);

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("homepage is responsive on tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto("/");

    await expect(page).toHaveTitle(/AutoBeli/i);
  });
});
