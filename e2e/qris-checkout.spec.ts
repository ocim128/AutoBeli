import { test, expect } from "./fixtures";
import crypto from "crypto";
import { E2E_PRODUCT_SLUG, E2E_QRIS_HMAC_KEY } from "./helpers/config";

/**
 * Full Qris end-to-end payment flow.
 *
 * Covers: order creation under QRIS, server-managed payment creation, QR image
 * display, exact final amount, signed paid-webhook settlement, stock delivery,
 * and duplicate-webhook idempotency. A local mock of the Qris REST API stands
 * in for the real provider so the server-side fetches resolve.
 */

function sign(rawBody: string): string {
  return crypto.createHmac("sha256", E2E_QRIS_HMAC_KEY).update(rawBody).digest("hex");
}

test.describe("Qris Payment Flow", () => {
  test("create -> QR image -> signed paid webhook -> delivery, with idempotent duplicate", async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000);
    const slug = E2E_PRODUCT_SLUG;
    const apiContext = request;

    // 1. Create a QRIS order via the API.
    const createOrderRes = await apiContext.post("/api/orders", {
      data: { slug, quantity: 1 },
    });
    expect(createOrderRes.ok()).toBeTruthy();
    const { orderId } = await createOrderRes.json();
    expect(orderId).toBeTruthy();

    // Patch contact so the order is submittable.
    const patchRes = await apiContext.patch("/api/orders", {
      data: { orderId, contact: "qris-e2e@example.com" },
    });
    expect(patchRes.ok()).toBeTruthy();

    const createPaymentRes = await apiContext.post("/api/payment/qris/create", {
      data: { orderId },
    });
    expect(createPaymentRes.ok(), await createPaymentRes.text()).toBeTruthy();
    const paymentData = await createPaymentRes.json();
    expect(paymentData.paymentId).toMatch(/^mock_pay_\d+_\d+$/);
    expect(paymentData.amount).toBeGreaterThan(0);
    expect(paymentData.expiresAt).toBeTruthy();

    const paymentId: string = paymentData.paymentId;
    const finalAmount: number = paymentData.amount;
    const providerResponse = await request.get(`http://127.0.0.1:9119/payment/${paymentId}`);
    expect(providerResponse.ok()).toBe(true);
    const providerPayment = await providerResponse.json();
    expect(paymentData.expiresAt - providerPayment.created_at).toBe(20 * 60 * 1000);

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
      created_at: providerPayment.created_at,
      provider_transaction: { transaction_time: new Date().toISOString() },
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
    const settled = await request.post(`http://127.0.0.1:9119/__test/payment/${paymentId}/settle`);
    expect(settled.ok()).toBe(true);

    // 5. Reload the order page; it must now show the paid/delivered state.
    await page.goto(`/order/${orderId}`);
    await expect(page.getByText(/Purchase Successful|Pembelian Berhasil/i)).toBeVisible({
      timeout: 10_000,
    });

    let deliveryStarted = false;
    page.on("request", (outgoing) => {
      if (outgoing.url().includes("/api/delivery/")) deliveryStarted = true;
    });
    // A server-rendered button can appear before hydration attaches its handler.
    // Retry only until a request starts, so token cooldowns are never triggered twice.
    const [delivery] = await Promise.all([
      page.waitForResponse((response) => response.url().includes("/api/delivery/"), {
        timeout: 15_000,
      }),
      expect(async () => {
        if (!deliveryStarted) {
          await page.getByRole("button", { name: /BUKA KONTEN|UNLOCK CONTENT/i }).click();
        }
        expect(deliveryStarted).toBe(true);
      }).toPass({ timeout: 10_000 }),
    ]);
    expect(delivery.status()).toBe(200);
    expect(delivery.headers()["cache-control"]).toContain("no-store");
    expect((await delivery.json()).content).toMatch(/e2e-user-\d+\|e2e-password-\d+/);

    const recovery = await request.post("/api/orders/search", {
      data: { email: "qris-e2e@example.com" },
    });
    expect(recovery.ok()).toBe(true);
    expect((await recovery.json()).orders).toEqual(
      expect.arrayContaining([expect.objectContaining({ orderId })])
    );

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
    const stored = await request.get(`http://127.0.0.1:9119/payment/${paymentId}`);
    expect((await stored.json()).status).toBe("paid");
  });

  test("rejects a webhook with a missing signature", async ({ request }) => {
    const apiContext = request;
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

  test("rejects a webhook with an invalid signature", async ({ request }) => {
    const apiContext = request;
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

  test("returns 2xx for a signed event with an unknown payment id", async ({ request }) => {
    const apiContext = request;
    const body = JSON.stringify({
      payment_id: "qris_e2e_unknown_payment",
      payment_status: "paid",
      amount: 25000,
      paid_at: Date.now(),
      created_at: Date.now() - 1000,
      provider_transaction: { transaction_time: new Date().toISOString() },
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

  test("rejects a tampered body with a valid-looking signature", async ({ request }) => {
    const apiContext = request;
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
