import type { PaymentGateway } from "@/lib/definitions";
import { isQrisConfigured } from "@/lib/qris";

const VALID_GATEWAYS: readonly PaymentGateway[] = ["MOCK", "PAKASIR", "QRIS"];

/**
 * Parse PAYMENT_GATEWAY into the PaymentGateway union.
 *
 * Used to stamp the gateway on NEW orders. Development defaults to MOCK when
 * unset. Production fails fast on a missing/invalid gateway, rejects MOCK so a
 * misconfigured deployment can never silently take fake payments, and rejects
 * PAKASIR for new orders — Pakasir remains only for reconciling historical
 * orders (read directly from `order.paymentGateway`, not via this helper).
 * QRIS is the only gateway for new production orders, and it requires a fully
 * valid HTTPS configuration.
 */
export function getPaymentGateway(): PaymentGateway {
  const raw = process.env.PAYMENT_GATEWAY?.trim().toUpperCase();
  const gateway = VALID_GATEWAYS.find((candidate) => candidate === raw);

  if (process.env.NODE_ENV === "production") {
    if (!gateway) {
      throw new Error("PAYMENT_GATEWAY must be set to a valid gateway in production");
    }
    if (gateway === "MOCK") {
      throw new Error("PAYMENT_GATEWAY=MOCK is not allowed in production");
    }
    if (gateway === "PAKASIR") {
      throw new Error(
        "PAYMENT_GATEWAY=PAKASIR is not allowed for new orders in production; use QRIS. Pakasir remains for historical reconciliation only."
      );
    }
    if (gateway === "QRIS" && !isQrisConfigured()) {
      throw new Error(
        "PAYMENT_GATEWAY=QRIS but QRIS_API_BASE_URL, QRIS_API_KEY, or QRIS_WEBHOOK_HMAC_KEY is missing or invalid"
      );
    }
    return gateway;
  }

  return gateway ?? "MOCK";
}
