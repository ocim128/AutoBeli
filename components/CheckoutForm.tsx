"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { REGEX_PATTERNS } from "@/lib/validation";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  paymentGateway: "MOCK" | "PAKASIR";
}

function CheckoutForm({ orderId, amount, paymentGateway }: CheckoutFormProps) {
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { t } = useLanguage();

  // Get the correct payment endpoint based on gateway
  const getPaymentEndpoint = useCallback(() => {
    switch (paymentGateway) {
      case "PAKASIR":
        return "/api/payment/pakasir/create";
      case "MOCK":
      default:
        return "/api/payment/mock/initiate";
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
          body: JSON.stringify({ orderId }),
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
    [contact, orderId, router, t, getPaymentEndpoint]
  );

  return (
    <Panel padding="lg">
      {/* Header */}
      <div className="mb-8">
        <SectionEyebrow variant="accent">{t("common.payment")}</SectionEyebrow>
        <h2 className="font-serif text-2xl text-[var(--foreground)] mt-2 leading-tight">
          {t("checkout.securePayment")}
        </h2>
        <p className="font-mono text-[0.65rem] text-[var(--text-muted)] mt-1 uppercase tracking-wider">
          {t("checkout.digitalOrder")} #{orderId.slice(-6).toUpperCase()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Error Display */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <svg
              className="w-4 h-4 text-red-400 shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-mono text-xs text-red-400">{error}</span>
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
            className="h-10 text-sm bg-[var(--panel-2)] border-[var(--line)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]/20"
          />
        </Field>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="h-12 w-full rounded-lg bg-[var(--accent)] text-base font-semibold text-[var(--accent-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <div className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Spinner size={20} />
                <span>{t("checkout.processing")}</span>
              </>
            ) : (
              <>
                <span>
                  {t("checkout.pay")} Rp{amount.toLocaleString("id-ID")}
                </span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </div>
        </Button>
      </form>

      {/* Payment Methods */}
      <div className="mt-8 pt-6 border-t border-[var(--line)]">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.15em] text-[var(--text-muted)] text-center mb-3">
          {t("checkout.supportedMethods")}
        </p>
        <div className="flex justify-center gap-6">
          <span className="font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)]">
            QRIS
          </span>
          <span className="font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)]">
            BCA
          </span>
          <span className="font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)]">
            GOPAY
          </span>
          <span className="font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)]">
            OVO
          </span>
        </div>
      </div>
    </Panel>
  );
}

export default memo(CheckoutForm);
