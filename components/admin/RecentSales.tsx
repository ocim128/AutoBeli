"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import Spinner from "@/components/ui/Spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RecentSale {
  _id: string;
  amountPaid: number;
  paidAt: string;
  createdAt: string;
  customerContact?: string;
  paymentGateway?: string;
  quantity?: number;
  product?: {
    title: string;
    content?: string;
    priceIdr: number;
  };
}

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

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? "minute" : "minutes"} ago`;
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
  if (diffWeeks < 4) return `${diffWeeks} ${diffWeeks === 1 ? "week" : "weeks"} ago`;
  return `${diffMonths} ${diffMonths === 1 ? "month" : "months"} ago`;
}

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
      <Panel monoLabel="RECENT ORDERS">
        <div className="flex items-center justify-center py-12">
          <Spinner size={32} variant="classic" className="text-[var(--text-muted)]" />
        </div>
      </Panel>
    );
  }

  if (error) {
    return (
      <Panel monoLabel="RECENT ORDERS">
        <p className="font-mono text-sm text-red-400">{error}</p>
      </Panel>
    );
  }

  return (
    <>
      <Panel monoLabel="RECENT ORDERS">
        {sales.length === 0 ? (
          <p className="py-8 text-center font-mono text-sm text-[var(--text-muted)]">
            No sales yet. Your first sale will appear here.
          </p>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {sales.map((sale) => (
              <button
                key={sale._id}
                onClick={() => setSelectedSale(sale)}
                className="flex w-full items-center gap-4 px-1 py-3 text-left transition-colors hover:bg-[var(--panel-2)] first:pt-0 last:pb-0"
              >
                {/* Amount */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-[var(--foreground)]">
                    {sale.product?.title || "Unknown Product"}
                    {sale.quantity && sale.quantity > 1 && (
                      <span className="ml-2 font-mono text-[0.65rem] text-[var(--text-muted)]">
                        x{sale.quantity}
                      </span>
                    )}
                  </p>
                  <span className="font-mono text-[0.65rem] text-[var(--text-muted)]">
                    {sale.customerContact ? maskEmail(sale.customerContact) : "Anonymous buyer"}
                  </span>
                </div>

                {/* Amount */}
                <span className="shrink-0 font-serif text-sm text-[var(--success)]">
                  +Rp {sale.amountPaid.toLocaleString("id-ID")}
                </span>

                {/* Time */}
                <span className="shrink-0 font-mono text-[0.65rem] text-[var(--text-muted)]">
                  {getRelativeTime(sale.paidAt)}
                </span>
              </button>
            ))}
          </div>
        )}
      </Panel>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSale} onOpenChange={(open) => !open && setSelectedSale(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl text-[var(--foreground)]">
              Order Details
            </DialogTitle>
            <DialogDescription className="font-mono text-xs text-[var(--text-muted)]">
              Full order information
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              {/* Order ID & Product */}
              <div className="space-y-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-4">
                <div>
                  <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                    Order ID
                  </span>
                  <p className="mt-0.5 break-all font-mono text-xs text-[var(--foreground)]">
                    {selectedSale._id}
                  </p>
                </div>
                <div>
                  <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                    Product
                  </span>
                  <p className="mt-0.5 text-sm text-[var(--foreground)]">
                    {selectedSale.product?.title || "Unknown"}
                    {selectedSale.quantity && selectedSale.quantity > 1 && (
                      <StatusBadge status="neutral" className="ml-2">
                        {selectedSale.quantity} items
                      </StatusBadge>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                      Amount
                    </span>
                    <p className="mt-0.5 font-serif text-[var(--success)]">
                      Rp {selectedSale.amountPaid.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                      Date
                    </span>
                    <p className="mt-0.5 font-mono text-xs text-[var(--foreground)]">
                      {new Date(selectedSale.paidAt).toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div>
                <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Customer Info
                </span>
                <div className="mt-1 rounded-lg border border-[var(--line)] p-3">
                  <p className="font-mono text-xs text-[var(--foreground)]">
                    {selectedSale.customerContact || "Not provided"}
                  </p>
                  {selectedSale.paymentGateway && (
                    <p className="mt-1 font-mono text-[0.65rem] text-[var(--text-muted)]">
                      Via: {selectedSale.paymentGateway}
                    </p>
                  )}
                </div>
              </div>

              {/* Content */}
              {selectedSale.product?.content && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                      Decrypted Content
                    </span>
                    <StatusBadge status="error">SENSITIVE</StatusBadge>
                  </div>
                  <div className="mt-2 overflow-x-auto rounded-lg bg-[var(--panel-3)] p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm text-[var(--success)]">
                      {selectedSale.product.content}
                    </pre>
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    This content is encrypted in the database and only decrypted for display here.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter showCloseButton>
            <DialogClose render={<Button variant="outline" />}>Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
