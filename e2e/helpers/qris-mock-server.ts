import http from "http";

/**
 * Minimal local mock of the Qris REST API for E2E.
 *
 * The AutoBeli server-side Qris client calls this instead of the real Qris
 * service (QRIS_API_BASE_URL points here). It speaks just enough of the
 * contract — create payment, get payment, QR image — to drive the full
 * create -> QR -> webhook -> delivery E2E flow.
 *
 * Payments are held in memory; `settle(paymentId)` flips one to "paid" so the
 * webhook test can drive a realistic reconciliation fallback too.
 */

interface MockPayment {
  id: string;
  status: "pending" | "paid" | "expired";
  amount: number;
  expires_at: number;
  created_at: number;
  paid_amount?: number;
  paid_at?: number;
}

const payments = new Map<string, MockPayment>();
let nextId = 1;
let runId = Date.now();

export function resetPayments() {
  payments.clear();
  nextId = 1;
  // E2E orders remain in MongoDB between runs. Keep provider IDs unique across
  // resets so the production unique transaction-reference index does not make
  // a later test collide with an earlier run.
  runId = Date.now();
}

export function getPayment(paymentId: string): MockPayment | undefined {
  return payments.get(paymentId);
}

/** Mark a held payment paid; used to simulate the provider's reconciliation state. */
export function settle(paymentId: string, paidAmount: number) {
  const payment = payments.get(paymentId);
  if (!payment) return;
  payment.status = "paid";
  payment.paid_amount = paidAmount;
  payment.paid_at = Date.now();
}

const PNG_BYTES = Buffer.from(
  "89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63000100000005000100" +
    "0d0a2db40000000049454e44ae426082",
  "hex"
);

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const payload = Buffer.from(JSON.stringify(body));
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": payload.byteLength.toString(),
  });
  res.end(payload);
}

export function startQrisMockServer(port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = req.url || "";
      const method = req.method || "GET";

      // CORS / health preflight not needed; AutoBeli calls these server-side.

      // POST /payment — create a server-managed payment
      if (method === "POST" && url === "/payment") {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
          let parsed: { base_amount?: number; timeout?: number } = {};
          try {
            parsed = JSON.parse(body);
          } catch {
            sendJson(res, 400, { error_code: "INVALID_REQUEST" });
            return;
          }
          const base = parsed.base_amount;
          if (typeof base !== "number" || base < 1000) {
            sendJson(res, 400, { error_code: "INVALID_BASE_AMOUNT" });
            return;
          }
          const id = `mock_pay_${runId}_${nextId++}`;
          const now = Date.now();
          const payment: MockPayment = {
            id,
            status: "pending",
            // Add a unique IDR 0–999 suffix like the real server-managed allocator.
            amount: base + ((nextId * 7) % 500),
            expires_at: now + (parsed.timeout ?? 300000),
            created_at: now,
          };
          payments.set(id, payment);
          sendJson(res, 201, {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            expires_at: payment.expires_at,
            created_at: payment.created_at,
          });
        });
        return;
      }

      // GET /payment/:id — reconciliation
      const getMatch = url.match(/^\/payment\/([^/]+)$/);
      if (method === "GET" && getMatch) {
        const payment = payments.get(getMatch[1]);
        if (!payment) {
          sendJson(res, 404, { error_code: "PAYMENT_NOT_FOUND" });
          return;
        }
        const body: Record<string, unknown> = {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          expires_at: payment.expires_at,
          created_at: payment.created_at,
        };
        if (payment.status === "paid") {
          body.paid_amount = payment.paid_amount;
          body.paid_at = payment.paid_at;
        }
        sendJson(res, 200, body);
        return;
      }

      // GET /payment/:id/qris.png — the QR image
      const imgMatch = url.match(/^\/payment\/([^/]+)\/qris\.png$/);
      if (method === "GET" && imgMatch) {
        const payment = payments.get(imgMatch[1]);
        if (!payment) {
          sendJson(res, 404, { error_code: "PAYMENT_NOT_FOUND" });
          return;
        }
        res.writeHead(200, {
          "Content-Type": "image/png",
          "Content-Length": PNG_BYTES.byteLength.toString(),
        });
        res.end(PNG_BYTES);
        return;
      }

      sendJson(res, 404, { error_code: "PAYMENT_NOT_FOUND" });
    });

    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}
