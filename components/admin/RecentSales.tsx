"use client";

import { useEffect, useState } from "react";

interface RecentSale {
  _id: string;
  amountPaid: number;
  paidAt: string;
  createdAt: string;
  customerContact?: string;
  paymentGateway?: string;
  product?: {
    title: string;
    content?: string;
    priceIdr: number;
  };
}

/**
 * Formats a date into a relative time string (e.g., "2 hours ago")
 */
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  } else {
    return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
  }
}

/**
 * Masks an email address for privacy (e.g., "jo***@example.com")
 */
function maskEmail(email: string): string {
  if (!email) return "Unknown";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export default function RecentSales() {
  const [sales, setSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<RecentSale | null>(null);

  useEffect(() => {
    fetch("/api/admin/recent-sales")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (data.sales) setSales(data.sales);
      })
      .catch(() => setError("Failed to load recent sales"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">💰</span> Recent Sales
        </h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">💰</span> Recent Sales
        </h2>
        <p className="text-red-500 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="text-2xl">💰</span> Recent Sales
        </h2>

        {sales.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            No sales yet. Your first sale will appear here! 🎉
          </p>
        ) : (
          <div className="space-y-4">
            {sales.map((sale) => (
              <button
                key={sale._id}
                onClick={() => setSelectedSale(sale)}
                className="w-full text-left flex items-center gap-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 transition-all hover:shadow-md hover:scale-[1.01]"
              >
                {/* Avatar / Icon */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                  {sale.customerContact ? sale.customerContact[0].toUpperCase() : "?"}
                </div>

                {/* Sale Details */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {sale.product?.title || "Unknown Product"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sale.customerContact ? maskEmail(sale.customerContact) : "Anonymous buyer"}
                  </p>
                </div>

                {/* Amount & Time */}
                <div className="text-right shrink-0">
                  <p className="font-semibold text-green-600">
                    +Rp {sale.amountPaid.toLocaleString("id-ID")}
                  </p>
                  <p className="text-xs text-gray-400">{getRelativeTime(sale.paidAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
                <button
                  onClick={() => setSelectedSale(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Order ID
                    </span>
                    <p className="font-mono text-sm text-gray-900 break-all">{selectedSale._id}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Product
                    </span>
                    <p className="font-medium text-gray-900">
                      {selectedSale.product?.title || "Unknown"}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Amount
                      </span>
                      <p className="font-medium text-green-600">
                        Rp {selectedSale.amountPaid.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Date
                      </span>
                      <p className="text-sm text-gray-900">
                        {new Date(selectedSale.paidAt).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Customer Info
                  </span>
                  <div className="mt-1 p-3 border rounded-lg">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">Email:</span>{" "}
                      {selectedSale.customerContact || "Not provided"}
                    </p>
                    {selectedSale.paymentGateway && (
                      <p className="text-sm text-gray-500 mt-1">
                        Via: {selectedSale.paymentGateway}
                      </p>
                    )}
                  </div>
                </div>

                {selectedSale.product?.content && (
                  <div>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                      <span>🔓 Decrypted Content</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                        SENSITIVE
                      </span>
                    </span>
                    <div className="mt-2 p-4 bg-slate-900 rounded-lg overflow-x-auto">
                      <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                        {selectedSale.product.content}
                      </pre>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      This content is encrypted in the database and only decrypted for display here.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={() => setSelectedSale(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
