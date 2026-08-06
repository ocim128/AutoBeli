"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { REGEX_PATTERNS } from "@/lib/validation";
import { formatIDR, shortOrderId } from "@/lib/format";
import Spinner from "@/components/ui/spinner";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PaymentGateway } from "@/lib/definitions";

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  paymentGateway: PaymentGateway;
  retry?: boolean;
}

function CheckoutForm({ orderId, amount, paymentGateway, retry = false }: CheckoutFormProps) {
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  // Get the correct payment endpoint based on gateway
  const getPaymentEndpoint = useCallback(() => {
    switch (paymentGateway) {
      case "QRIS":
        return "/api/payment/qris/create";
      case "PAKASIR":
        return "/api/payment/pakasir/create";
      case "MOCK":
      default:
        return "/api/payment/mock/pay";
    }
  }, [paymentGateway]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!contact.trim()) {
        setError(t("checkout.emailRequired"));
        return;
      }

      if (!REGEX_PATTERNS.email.test(contact.trim())) {
        setError(t("checkout.emailInvalid"));
        return;
      }

      setLoading(true);
      try {
        const contactRes = await fetch("/api/orders", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, contact: contact.trim() }),
        });

        if (!contactRes.ok) {
          const data = await contactRes.json();
          throw new Error(data.error || t("checkout.contactSaveFailed"));
        }

        const payRes = await fetch(getPaymentEndpoint(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, ...(retry ? { retry: true } : {}) }),
        });

        const payData = await payRes.json();

        if (!payRes.ok) {
          throw new Error(payData.error || t("checkout.paymentCreationFailed"));
        }

        if (payData.payment_url) {
          try {
            localStorage.setItem("lastOrderId", orderId);
          } catch {}
          window.location.href = payData.payment_url;
        } else {
          router.push(`/order/${orderId}`);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(t("checkout.paymentFailed"));
        }
        setLoading(false);
      }
    },
    [contact, orderId, router, t, getPaymentEndpoint, retry]
  );

  return (
    <Panel padding="lg">
      {/* Header */}
      <div className="mb-10">
        <SectionEyebrow variant="accent">{t("common.payment")}</SectionEyebrow>
        <h2 className="font-serif text-3xl text-[var(--foreground)] mt-3 leading-tight">
          {t("checkout.securePayment")}
        </h2>
        <p className="eyebrow-sm mt-2">
          {t("checkout.digitalOrder")} #{shortOrderId(orderId)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-7" noValidate>
        {/* Inline Error Display */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-4 py-3"
          >
            <svg
              className="w-4 h-4 text-[var(--danger)] shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-mono text-xs text-[var(--danger)]">{error}</span>
          </div>
        )}

        {/* Email Field */}
        <Field
          label={t("checkout.emailAddress")}
          monoLabel
          htmlFor="contact"
          helper={t("checkout.emailHelp")}
        >
          <Input
            type="email"
            id="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder={t("checkout.emailPlaceholder")}
            disabled={loading}
            aria-invalid={!!error}
            aria-required="true"
            className="h-11 text-sm bg-[var(--panel-2)] border-[var(--line)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20"
          />
        </Field>

        {/* Submit Button — prominent and decisive */}
        <Button type="submit" disabled={loading} aria-busy={loading} size="xl" className="w-full">
          {loading ? (
            <>
              <Spinner size={20} />
              <span>{t("checkout.processing")}</span>
            </>
          ) : (
            <>
              <span className="font-serif text-lg">
                {t("checkout.pay")} {formatIDR(amount)}
              </span>
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </>
          )}
        </Button>
      </form>

      {/* Server-managed pricing note for Qris */}
      {paymentGateway === "QRIS" && (
        <p className="mt-4 text-center text-xs leading-5 text-[var(--text-muted)]">
          {t("checkout.qrisUniqueAmountNote")}
        </p>
      )}

      {/* Payment Methods — only shown for real gateways */}
      {paymentGateway !== "MOCK" && (
        <div className="mt-10 pt-6 border-t border-[var(--line)]">
          <p className="eyebrow-sm mb-4 text-center">{t("checkout.supportedMethods")}</p>
          <div className="flex justify-center items-center gap-5">
            {(paymentGateway === "QRIS" ? ["Qris"] : ["QRIS", "BCA", "GOPAY", "OVO"]).map(
              (method) => (
                <span
                  key={method}
                  className="flex items-center justify-center h-8 px-3 rounded-md border border-[var(--line)] bg-[var(--panel-2)] font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)]"
                >
                  {method}
                </span>
              )
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

export default memo(CheckoutForm);
