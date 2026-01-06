"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface CheckoutFormProps {
  orderId: string;
  amount: number;
}

export default function CheckoutForm({ orderId, amount }: CheckoutFormProps) {
  const [contact, setContact] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!contact.trim()) {
      setError("Please enter your WhatsApp number");
      return;
    }

    // Validate phone number format (Indonesian: starts with 08, 10-13 digits)
    const phoneRegex = /^08\d{8,11}$/;
    if (!phoneRegex.test(contact.trim())) {
      setError("Please enter a valid Indonesian phone number (e.g. 08123456789)");
      return;
    }

    setLoading(true);
    try {
      // Save contact info
      const contactRes = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, contact: contact.trim() }),
      });

      if (!contactRes.ok) {
        const data = await contactRes.json();
        throw new Error(data.error || "Failed to save contact");
      }

      // Create payment with Veripay
      const payRes = await fetch("/api/payment/veripay/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const payData = await payRes.json();

      if (!payRes.ok) {
        throw new Error(payData.error || "Payment creation failed");
      }

      // Redirect to Veripay payment page
      if (payData.payment_url) {
        // Save order ID to localStorage to help user find it later if redirect fails
        if (typeof window !== "undefined") {
          localStorage.setItem("lastOrderId", orderId);
        }
        window.location.href = payData.payment_url;
      } else {
        // Fallback: redirect to order page (for mock gateway)
        router.push(`/order/${orderId}`);
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Payment failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600"
        >
          <span className="font-medium">Error: </span>
          {error}
        </div>
      )}

      <div>
        <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
          WhatsApp Number
        </label>
        <input
          type="tel"
          id="contact"
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder="e.g. 08123456789"
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-900 placeholder-gray-400 ${
            error ? "border-red-300" : "border-gray-300"
          }`}
          disabled={loading}
          aria-invalid={!!error}
          aria-required="true"
          aria-describedby="contact-hint"
        />
        <p id="contact-hint" className="text-xs text-gray-500 mt-2">
          We&apos;ll send order confirmation to this WhatsApp number
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Pay Rp ${amount.toLocaleString("id-ID")}`
        )}
      </button>
    </form>
  );
}
