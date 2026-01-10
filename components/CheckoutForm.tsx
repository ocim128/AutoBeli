"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import { REGEX_PATTERNS } from "@/lib/validation";
import Spinner from "@/components/ui/Spinner";
import { useLanguage } from "@/context/LanguageContext";

interface CheckoutFormProps {
  orderId: string;
  amount: number;
  paymentGateway: "MOCK" | "VERIPAY" | "MIDTRANS";
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
      case "MIDTRANS":
        return "/api/payment/midtrans/create";
      case "VERIPAY":
        return "/api/payment/veripay/create";
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
          throw new Error(data.error || "Failed to save contact");
        }

        const payRes = await fetch(getPaymentEndpoint(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });

        const payData = await payRes.json();

        if (!payRes.ok) {
          throw new Error(payData.error || "Payment creation failed");
        }

        if (payData.payment_url) {
          localStorage.setItem("lastOrderId", orderId);
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
    <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-indigo-100/50">
      <div className="mb-10 inline-flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-black text-gray-900 leading-tight">
            {t("checkout.securePayment")}
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
            {t("checkout.digitalOrder")} #{orderId.slice(-6).toUpperCase()}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        {error && (
          <div
            role="alert"
            className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium flex gap-3 animate-head-shake"
          >
            <svg className="w-5 h-5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="contact"
            className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-3 pl-1"
          >
            {t("checkout.emailAddress")}
          </label>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-indigo-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <input
              type="email"
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder={t("checkout.emailPlaceholder")}
              className={`w-full pl-14 pr-6 py-5 bg-gray-50 border-2 rounded-[1.5rem] focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all text-lg font-bold text-gray-900 placeholder:text-gray-300 ${
                error ? "border-red-200" : "border-gray-100"
              }`}
              disabled={loading}
              aria-invalid={!!error}
              aria-required="true"
            />
          </div>
          <p className="text-xs text-gray-400 font-medium mt-4 pl-1">{t("checkout.emailHelp")}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="group relative w-full bg-gray-900 text-white font-black py-5 px-8 rounded-2xl text-xl shadow-xl hover:bg-black hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:bg-gray-200 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-10 transition-opacity" />

          <div className="relative flex items-center justify-center gap-3">
            {loading ? (
              <>
                <Spinner size={24} />
                <span>{t("checkout.processing")}</span>
              </>
            ) : (
              <>
                <span>
                  {t("checkout.pay")} Rp{amount.toLocaleString("id-ID")}
                </span>
                <svg
                  className="w-6 h-6 transform group-hover:translate-x-1.5 transition-transform duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </>
            )}
          </div>
        </button>
      </form>

      <div className="mt-10 flex flex-col items-center gap-4 border-t border-gray-50 pt-8">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
          {t("checkout.supportedMethods")}
        </p>
        <div className="flex gap-6 grayscale opacity-40">
          <span className="font-black text-xs tracking-tighter">QRIS</span>
          <span className="font-black text-xs tracking-tighter">BCA</span>
          <span className="font-black text-xs tracking-tighter">GOPAY</span>
          <span className="font-black text-xs tracking-tighter">OVO</span>
        </div>
      </div>
    </div>
  );
}

export default memo(CheckoutForm);
