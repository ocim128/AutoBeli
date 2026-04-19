"use client";

import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import Spinner from "@/components/ui/Spinner";

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
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] py-16 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <PageHeader
          eyebrow={t("checkout.orderDetails")}
          title={t("checkout.paymentVerification")}
          align="center"
          description={t("checkout.paymentVerificationDesc")}
        />

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-3">
          <StatusBadge status="warning">{t("checkout.statusProcessing")}</StatusBadge>
          <Spinner size={20} className="text-amber-400" variant="classic" />
        </div>

        {/* Order Summary Panel */}
        <Panel monoLabel={t("checkout.orderSummary")} title={t("checkout.orderDetails")}>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {t("checkout.product")}
              </span>
              <span className="text-sm text-[var(--foreground)]">{productTitle}</span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {t("checkout.amount")}
              </span>
              <span className="font-mono text-sm font-medium text-[var(--foreground)]">
                Rp {amountPaid.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {t("checkout.date")}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                {new Date(createdAt).toLocaleString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {t("checkout.orderId")}
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">{orderId}</span>
            </div>
          </div>
        </Panel>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
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
          </a>
          <a
            href={`/checkout/${orderId}?retry=true`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-6 py-3 font-mono text-sm font-medium uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
          >
            {t("checkout.retryPayment")}
          </a>
        </div>

        {/* Waiting indicator */}
        <div className="flex items-center justify-center gap-2 pt-4 text-sm text-[var(--text-muted)]">
          <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          <span>{t("checkout.waitingConfirmation")}</span>
        </div>
      </div>
    </div>
  );
}
