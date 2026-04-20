"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import Link from "next/link";

interface OrderPendingProps {
  orderId: string;
  productTitle: string;
  amountPaid: number;
  createdAt: Date | string;
}

export default function OrderPending({
  orderId,
  productTitle,
  amountPaid,
  createdAt,
}: OrderPendingProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-poll for payment status updates.
  // The server page (order/[orderId]/page.tsx) calls syncOrderPaymentStatus()
  // on every render, so router.refresh() triggers a server re-check.
  // If status changed to PAID, the server renders OrderPaid instead.
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      router.refresh();
    }, 8000);

    // Stop polling after 3 minutes to avoid unnecessary server load
    expiryRef.current = setTimeout(() => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      expiryRef.current = null;
    }, 180_000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (expiryRef.current) clearTimeout(expiryRef.current);
    };
  }, [router]);

  return (
    <div className="min-h-[80vh] py-16 px-4">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Header */}
        <PageHeader
          eyebrow={t("checkout.orderDetails")}
          title={t("checkout.paymentVerification")}
          align="center"
          description={t("checkout.paymentVerificationDesc")}
          size="lg"
        />

        {/* Order Brief — featured panel */}
        <Panel featured monoLabel={t("checkout.orderSummary")} padding="lg">
          <div className="space-y-0 divide-y divide-[var(--line)]">
            <div className="flex items-start justify-between gap-4 pb-4">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {t("checkout.product")}
              </span>
              <span className="text-right text-sm font-medium text-[var(--foreground)]">
                {productTitle}
              </span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {t("checkout.amount")}
              </span>
              <span className="font-mono text-sm font-medium text-[var(--foreground)]">
                Rp {amountPaid.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {t("checkout.date")}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                {new Date(createdAt).toLocaleString(language === "id" ? "id-ID" : "en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {t("checkout.orderId")}
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">{orderId}</span>
            </div>
          </div>

          {/* Status row */}
          <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-5">
            <StatusBadge status="warning">{t("checkout.statusProcessing")}</StatusBadge>
            <span className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--warning)] opacity-40" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--warning)]" />
              </span>
              {t("checkout.waitingConfirmation")}
            </span>
          </div>
        </Panel>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={`/order/${orderId}`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-sm font-medium uppercase tracking-wider text-[var(--accent-foreground)] transition-colors hover:opacity-90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {t("checkout.checkStatus")}
          </Link>
          <Link
            href={`/checkout/${orderId}?retry=true`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-6 py-3 font-mono text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
          >
            {t("checkout.retryPayment")}
          </Link>
        </div>
      </div>
    </div>
  );
}
