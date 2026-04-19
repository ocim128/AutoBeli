"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function MockPayButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  // Auto-reset confirming state after 3 seconds
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);

  const handlePay = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    setLoading(true);
    setConfirming(false);
    try {
      const res = await fetch("/api/payment/mock/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!res.ok) throw new Error("Payment failed");

      await res.json();

      // Redirect to unlock page
      router.push(`/order/${orderId}`);
    } catch {
      toast.error("Payment failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handlePay}
      disabled={loading}
      aria-busy={loading}
      className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition ${
        confirming
          ? "bg-[var(--warning)] hover:bg-[var(--warning)]/80 text-white animate-pulse"
          : "bg-[var(--success)] hover:bg-[var(--success)]/80 text-white"
      } disabled:opacity-70 disabled:cursor-not-allowed disabled:animate-none`}
    >
      {loading ? "Processing..." : confirming ? "Confirm Payment?" : "Pay Now (Mock)"}
    </button>
  );
}
