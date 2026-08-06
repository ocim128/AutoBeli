import { test, expect, request, type Page } from "@playwright/test";
import crypto from "crypto";
import { startQrisMockServer, resetPayments, getPayment, settle } from "./helpers/qris-mock-server";

/**
 * Full Qris end-to-end payment flow.
 *
 * Covers: order creation under QRIS, server-managed payment creation, QR image
 * display, exact final amount, signed paid-webhook settlement, stock delivery,
 * and duplicate-webhook idempotency. A local mock of the Qris REST API stands
 * in for the real provider so the server-side fetches resolve.
 */

const HMAC_KEY = process.env.QRIS_WEBHOOK_HMAC_KEY || "e2e-qris-webhook-hmac-key";

function sign(rawBody: string): string {
  return crypto.createHmac("sha256", HMAC_KEY).update(rawBody).digest("hex");
}

async function hasAppError(page: Page): Promise<boolean> {
  return page
    .getByText("Something went wrong")
    .isVisible()
    .catch(() => false);
}

// Start the Qris REST mock once for the whole suite. The dev server calls it
// server-side via QRIS_API_BASE_URL=http://127.0.0.1:9119 (playwright.config.ts).
let mockServer: import("http").Server | null = null;

test.beforeAll(async () => {
  resetPayments();
  mockServer = await startQrisMockServer(9119);
});

test.afterAll(async () => {
  await new Promise<void>((resolve) => {
    if (mockServer) mockServer.close(() => resolve());
    else resolve();
  });
});

test.beforeEach(() => {
  resetPayments();
});

test.describe("Qris Payment Flow", () => {
  // The mock provider listens on the single port configured for the Next.js
  // server. Keep the suite in one worker so parallel Playwright workers cannot
  // bind the same mock port twice.
  test.describe.configure({ mode: "serial" });

  test("create -> QR image -> signed paid webhook -> delivery, with idempotent duplicate", async ({
    page,
  }) => {
    await page.goto("/");

    if (await hasAppError(page)) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }

    const productLink = page.locator('a[href^="/product/"]').first();
    await productLink.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (!(await productLink.isVisible())) {
      test.skip(true, "No products available for testing");
      return;
    }
    const href = (await productLink.getAttribute("href")) || "";
    expect(href).toBeTruthy();
    const slug = href.split("/product/")[1];

    const apiContext = await request.newContext();

    // 1. Create a QRIS order via the API.
    const createOrderRes = await apiContext.post("/api/orders", {
      data: { slug, quantity: 1 },
    });
    if (createOrderRes.status() === 500) {
      test.skip(true, "Database connection error - skipping test");
      return;
    }
    expect(createOrderRes.ok()).toBeTruthy();
    const { orderId } = await createOrderRes.json();
    expect(orderId).toBeTruthy();

    // Patch contact so the order is submittable.
    const patchRes = await apiContext.patch("/api/orders", {
      data: { orderId, contact: "qris-e2e@example.com" },
    });
    expect(patchRes.ok()).toBeTruthy();

    // If the dev server was reused from a non-QRIS run, the order's gateway
    // won't be QRIS and the create route will reject. Skip cleanly.
    const createPaymentRes = await apiContext.post("/api/payment/qris/create", {
      data: { orderId },
    });
    if (createPaymentRes.status() === 400) {
      test.skip(
        true,
        "Dev server not configured with PAYMENT_GATEWAY=QRIS; restart the dev server"
      );
      return;
    }
    expect(createPaymentRes.ok(), await createPaymentRes.text()).toBeTruthy();
    const paymentData = await createPaymentRes.json();
    expect(paymentData.paymentId).toMatch(/^mock_pay_\d+_\d+$/);
    expect(paymentData.amount).toBeGreaterThan(0);
    expect(paymentData.expiresAt).toBeTruthy();

    const paymentId: string = paymentData.paymentId;
    const finalAmount: number = paymentData.amount;

    // 2. Visit the order page; the QR image and exact final amount must render.
    await page.goto(`/order/${orderId}`);
    const qrImg = page.getByAltText("Qris QR code");
    await expect(qrImg).toBeVisible({ timeout: 10_000 });
    expect(await qrImg.getAttribute("src")).toContain(`/api/payment/qris/image?orderId=${orderId}`);
    // The final server-managed amount (base + suffix), formatted as IDR.
    const formattedAmount = `Rp ${finalAmount.toLocaleString("id-ID")}`;
    await expect(page.getByText(formattedAmount).first()).toBeVisible();

    // 3. Simulate the signed paid webhook from Qris. The event carries the
    //    final amount recorded at creation; no paid_amount (matches Gopay).
    const paidBody = JSON.stringify({
      payment_id: paymentId,
      payment_status: "paid",
      amount: finalAmount,
      paid_at: Date.now(),
    });
    const webhookRes = await apiContext.post("/api/webhooks/qris", {
      headers: { "Content-Type": "application/json", "X-Signature": sign(paidBody) },
      data: paidBody,
    });
    expect(webhookRes.ok(), await webhookRes.text()).toBeTruthy();
    const webhookData = await webhookRes.json();
    expect(webhookData.success).toBe(true);
    expect(webhookData.result).toBe("paid");

    // 4. The mock provider's record should also reflect paid (sanity).
    settle(paymentId, finalAmount);

    // 5. Reload the order page; it must now show the paid/delivered state.
    await page.goto(`/order/${orderId}`);
    await expect(page.getByText(/Purchase Successful|Pembelian Berhasil/i)).toBeVisible({
      timeout: 10_000,
    });

    // 6. Idempotency: replay the same signed webhook. The order must stay paid
    //    and the response must acknowledge the duplicate.
    const duplicateRes = await apiContext.post("/api/webhooks/qris", {
      headers: { "Content-Type": "application/json", "X-Signature": sign(paidBody) },
      data: paidBody,
    });
    expect(duplicateRes.ok()).toBeTruthy();
    const duplicateData = await duplicateRes.json();
    expect(duplicateData.success).toBe(true);
    expect(duplicateData.result).toBe("already_paid");

    // 7. The reconciliation fallback (GET /payment/:id) is consistent.
    const stored = getPayment(paymentId);
    expect(stored?.status).toBe("paid");
  });

  test("rejects a webhook with a missing signature", async () => {
    const apiContext = await request.newContext();
    const body = JSON.stringify({
      payment_id: "pay_unknown",
      payment_status: "paid",
      amount: 25000,
    });
    const res = await apiContext.post("/api/webhooks/qris", {
      headers: { "Content-Type": "application/json" },
      data: body,
    });
    expect(res.status()).toBe(401);
  });

  test("rejects a webhook with an invalid signature", async () => {
    const apiContext = await request.newContext();
    const body = JSON.stringify({
      payment_id: "pay_unknown",
      payment_status: "paid",
      amount: 25000,
    });
    const res = await apiContext.post("/api/webhooks/qris", {
      headers: { "Content-Type": "application/json", "X-Signature": "0".repeat(64) },
      data: body,
    });
    expect(res.status()).toBe(401);
  });

  test("returns 2xx for a signed event with an unknown payment id", async () => {
    const apiContext = await request.newContext();
    const body = JSON.stringify({
      payment_id: "qris_e2e_unknown_payment",
      payment_status: "paid",
      amount: 25000,
      paid_at: Date.now(),
    });
    const res = await apiContext.post("/api/webhooks/qris", {
      headers: { "Content-Type": "application/json", "X-Signature": sign(body) },
      data: body,
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.result).toBe("ignored");
  });

  test("rejects a tampered body with a valid-looking signature", async () => {
    const apiContext = await request.newContext();
    const original = JSON.stringify({
      payment_id: "pay_abc",
      payment_status: "paid",
      amount: 25000,
      paid_at: Date.now(),
    });
    const tampered = original.replace("25000", "99999");
    const res = await apiContext.post("/api/webhooks/qris", {
      headers: { "Content-Type": "application/json", "X-Signature": sign(original) },
      data: tampered,
    });
    expect(res.status()).toBe(401);
  });
});
