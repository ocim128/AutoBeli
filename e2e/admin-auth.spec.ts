import { test, expect } from "./fixtures";
import { E2E_ADMIN_PASSWORD, E2E_PRODUCT_SLUG } from "./helpers/config";

test.describe("Admin Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
  });

  test("login page renders correctly", async ({ page }) => {
    await page.goto("/admin/login");

    // Check all elements are present
    await expect(page.getByText("Admin Access")).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /unlock/i })).toBeVisible();
  });

  test("shows error for empty password", async ({ page }) => {
    await page.goto("/admin/login");

    // Submit empty form
    await page.getByRole("button", { name: /unlock/i }).click();

    // Should show error or stay on page
    await expect(page).toHaveURL("/admin/login");
  });

  test("shows error for wrong password", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByPlaceholder(/password/i).fill("wrongpassword123");
    await page.getByRole("button", { name: /unlock/i }).click();

    // Error message should appear
    await expect(page.getByText(/invalid password/i)).toBeVisible();
  });

  test("protected routes redirect to login", async ({ page }) => {
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL("/admin/login");

    await page.goto("/admin/products");
    await expect(page).toHaveURL("/admin/login");

    await page.goto("/admin/orders");
    await expect(page).toHaveURL("/admin/login");
  });

  test("login API rejects invalid credentials", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: { password: "wrongpassword" },
    });

    expect(response.status()).toBe(401);
  });

  test("login API rejects empty password", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      data: { password: "" },
    });

    expect(response.status()).toBe(400);
  });

  test("login API rate limiting works", async ({ request }) => {
    // Make multiple rapid login attempts
    const attempts = [];
    for (let i = 0; i < 10; i++) {
      attempts.push(
        request.post("/api/auth/login", {
          data: { password: "wrongpassword" },
        })
      );
    }

    const responses = await Promise.all(attempts);

    const statuses = responses.map((r) => r.status());
    expect(statuses.filter((s) => s === 401)).toHaveLength(5);
    expect(statuses.filter((s) => s === 429)).toHaveLength(5);
    const limited = responses.find((response) => response.status() === 429)!;
    expect(Number(limited.headers()["retry-after"])).toBeGreaterThan(0);
  });
});

test.describe("Admin Session Management", () => {
  test("session cookie is httpOnly", async ({ page, context }) => {
    await page.goto("/admin/login");

    await page.getByPlaceholder(/password/i).fill(E2E_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /unlock/i }).click();
    await expect(page).toHaveURL("/admin/dashboard", { timeout: 15000 });
    const cookies = await context.cookies();

    const sessionCookie = cookies.find((c) => c.name === "admin_session");
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.httpOnly).toBe(true);
    expect(sessionCookie?.sameSite).toBe("Lax");
    expect(await page.evaluate(() => document.cookie)).not.toContain("admin_session");
  });
});

test.describe("Admin Dashboard (Authenticated)", () => {
  test("list APIs return stock counts and product summaries without inventory", async ({
    request,
  }) => {
    const login = await request.post("/api/auth/login", { data: { password: E2E_ADMIN_PASSWORD } });
    expect(login.status()).toBe(200);
    const productsResponse = await request.get("/api/products");
    expect(productsResponse.status()).toBe(200);
    const { products } = await productsResponse.json();
    const stockProduct = products.find(
      (product: { slug: string }) => product.slug === E2E_PRODUCT_SLUG
    );
    expect(stockProduct.stockStats).toMatchObject({ total: 100, hasStockSystem: true });
    expect(stockProduct.stockStats.available + stockProduct.stockStats.sold).toBe(100);
    for (const product of products) {
      expect(product).not.toHaveProperty("stockItems");
      expect(product).not.toHaveProperty("contentEncrypted");
      expect(product).not.toHaveProperty("content");
    }
    expect(
      products.find((product: { slug: string }) => product.slug === "e2e-legacy-available")
        .stockStats
    ).toEqual({ total: 1, available: 1, sold: 0, hasStockSystem: false });
    expect(
      products.find((product: { slug: string }) => product.slug === "e2e-legacy-sold").stockStats
    ).toEqual({ total: 1, available: 0, sold: 1, hasStockSystem: false });

    const created = await request.post("/api/orders", { data: { slug: E2E_PRODUCT_SLUG } });
    expect(created.status()).toBe(200);
    const { orderId } = await created.json();
    const ordersResponse = await request.get("/api/admin/orders");
    expect(ordersResponse.status()).toBe(200);
    const { orders } = await ordersResponse.json();
    const order = orders.find((row: { _id: string }) => row._id === orderId);
    expect(order.product).toEqual({ title: "E2E Digital Access", priceIdr: 25000 });
    expect(order).not.toHaveProperty("paymentCreationAttempt");
  });

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/admin/login");

    await page.getByPlaceholder(/password/i).fill(E2E_ADMIN_PASSWORD);
    await page.getByRole("button", { name: /unlock/i }).click();

    await expect(page).toHaveURL("/admin/dashboard", { timeout: 15000 });
  });
});
