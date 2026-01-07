"use client";

import { useState, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import Spinner from "@/components/ui/Spinner";

function BuyButton({ slug }: { slug: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleBuy = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!res.ok) throw new Error("Failed to create order");

      const data = await res.json();
      router.push(`/checkout/${data.orderId}`);
    } catch {
      alert("Error creating order. Please try again.");
      setLoading(false);
    }
  }, [slug, router]);

  return (
    <div className="w-full">
      <button
        onClick={handleBuy}
        disabled={loading}
        aria-busy={loading}
        className="group relative w-full bg-white text-gray-900 font-black text-xl py-5 px-8 rounded-2xl shadow-[0_20px_50px_rgba(99,102,241,0.2)] hover:shadow-[0_20px_50px_rgba(99,102,241,0.4)] hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-10 transition-opacity" />

        <div className="relative flex items-center justify-center gap-3">
          {loading ? (
            <>
              <Spinner size={24} className="text-gray-900" />
              <span>Securing Access...</span>
            </>
          ) : (
            <>
              <span>Get Access Now</span>
              <svg
                className="w-6 h-6 transform group-hover:translate-x-2 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </>
          )}
        </div>
      </button>

      <div className="mt-6 flex items-center justify-center gap-6 opacity-60">
        <div className="flex items-center gap-1.5 grayscale">
          <span className="text-[10px] font-black tracking-tighter text-white bg-gray-500 px-1.5 rounded">
            QRIS
          </span>
          <span className="text-[10px] font-bold text-gray-400">READY</span>
        </div>
        <div className="w-px h-3 bg-gray-700/20" />
        <div className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[10px] font-black text-gray-500 tracking-widest uppercase">
            Certified Secure
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(BuyButton);
