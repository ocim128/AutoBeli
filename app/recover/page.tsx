"use client";

import { useState } from "react";
import Link from "next/link";

interface OrderResult {
  orderId: string;
  productTitle: string;
  productSlug: string;
  amountPaid: number;
  paidAt: string;
  createdAt: string;
}

interface SearchResponse {
  success: boolean;
  message: string;
  orders?: OrderResult[];
  error?: string;
}

export default function RecoverPage() {
  const [searchType, setSearchType] = useState<"orderId" | "email">("email");
  const [searchValue, setSearchValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<OrderResult[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults(null);

    if (!searchValue.trim()) {
      setError(`Please enter your ${searchType === "email" ? "email address" : "order ID"}`);
      return;
    }

    // Basic validation
    if (searchType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(searchValue.trim())) {
        setError("Please enter a valid email address");
        return;
      }
    } else {
      const orderIdRegex = /^[a-f0-9]{24}$/;
      if (!orderIdRegex.test(searchValue.trim())) {
        setError("Please enter a valid order ID (24 characters)");
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch("/api/orders/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          searchType === "email"
            ? { email: searchValue.trim().toLowerCase() }
            : { orderId: searchValue.trim() }
        ),
      });

      const data: SearchResponse = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError("Too many attempts. Please wait a moment and try again.");
        } else if (res.status === 404) {
          setError(data.message || "No orders found with this information.");
        } else {
          setError(data.error || "Search failed. Please try again.");
        }
        return;
      }

      if (data.success && data.orders && data.orders.length > 0) {
        setResults(data.orders);
      } else {
        setError("No paid orders found with this information.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <div className="max-w-2xl mx-auto py-16 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-100 rounded-full mb-6">
            <svg
              className="w-10 h-10 text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-3">Recover Your Purchase</h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Lost access to your content? Enter your email or order ID to find your purchase.
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-indigo-100/50 border border-gray-100">
          {/* Toggle Search Type */}
          <div className="flex gap-2 mb-8 p-1.5 bg-gray-100 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setSearchType("email");
                setSearchValue("");
                setError(null);
                setResults(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                searchType === "email"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Search by Email
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchType("orderId");
                setSearchValue("");
                setError(null);
                setResults(null);
              }}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                searchType === "orderId"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Search by Order ID
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div
                role="alert"
                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-sm text-red-600 font-medium flex gap-3"
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

            {/* Search Input */}
            <div>
              <label
                htmlFor="search-input"
                className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-3"
              >
                {searchType === "email" ? "Email Address" : "Order ID"}
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                  {searchType === "email" ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                      />
                    </svg>
                  )}
                </div>
                <input
                  type={searchType === "email" ? "email" : "text"}
                  id="search-input"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === "email" ? "you@example.com" : "e.g. 507f1f77bcf86cd799439011"
                  }
                  className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-600 transition-all text-lg font-medium text-gray-900 placeholder:text-gray-300"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-400 font-medium mt-3 pl-1">
                {searchType === "email"
                  ? "Enter the email you used during checkout"
                  : "Enter the 24-character order ID from your confirmation"}
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-black py-5 px-8 rounded-2xl text-xl shadow-lg hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
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
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Find My Orders</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {results && results.length > 0 && (
          <div className="mt-10 space-y-4">
            <h2 className="text-xl font-black text-gray-900 mb-4">
              Found {results.length} Order{results.length > 1 ? "s" : ""}
            </h2>
            {results.map((order) => (
              <Link
                key={order.orderId}
                href={`/order/${order.orderId}`}
                className="block bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                      {order.productTitle}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Order #{order.orderId.slice(-8).toUpperCase()}
                    </p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <span className="text-green-600 font-semibold">
                        Rp {order.amountPaid.toLocaleString("id-ID")}
                      </span>
                      <span className="text-gray-400">
                        {new Date(order.paidAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                    <span>Access</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back to Store Link */}
        <div className="text-center mt-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
