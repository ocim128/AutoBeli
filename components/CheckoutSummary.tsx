"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { StatusBadge } from "@/components/ui/status-badge";

interface CheckoutSummaryProps {
  orderId: string;
  productTitle: string;
  productDescription?: string;
  orderStatus: string;
  priceIdr: number;
  quantity: number;
  totalAmount: number;
}

export default function CheckoutSummary({
  orderId,
  productTitle,
  productDescription,
  orderStatus,
  priceIdr,
  quantity,
  totalAmount,
}: CheckoutSummaryProps) {
  const { t } = useLanguage();

  return (
    <div className="lg:col-span-5 lg:order-2">
      <div className="sticky top-28 space-y-5">
        {/* Order Brief Panel */}
        <Panel padding="lg" featured>
          {/* Eyebrow + Order ID */}
          <div className="flex items-center justify-between mb-6">
            <SectionEyebrow>{t("checkout.orderSummary")}</SectionEyebrow>
            <span className="font-mono text-[0.65rem] text-[var(--text-muted)] tracking-wider">
              #{orderId.slice(-8).toUpperCase()}
            </span>
          </div>

          {/* Product Title — prominent serif */}
          <div className="mb-5">
            <h3 className="font-serif text-2xl text-[var(--foreground)] leading-tight line-clamp-2 mb-1.5">
              {productTitle}
            </h3>
            {productDescription && (
              <p className="text-sm text-[var(--text-muted)] line-clamp-2 leading-relaxed">
                {productDescription}
              </p>
            )}
          </div>

          {/* Status */}
          <div className="mb-6">
            <StatusBadge status={orderStatus === "EXPIRED" ? "error" : "pending"}>
              {orderStatus}
            </StatusBadge>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--line)] mb-6" />

          {/* Price Breakdown — mono numbers */}
          <div className="space-y-3.5 text-sm">
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {t("checkout.unitPrice")}
              </span>
              <span className="font-mono text-sm tabular-nums text-[var(--text-muted)]">
                Rp {priceIdr.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {t("checkout.quantity")}
              </span>
              <span className="font-mono text-sm tabular-nums text-[var(--text-muted)]">
                {quantity}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                {t("checkout.serviceFee")}
              </span>
              <span className="font-mono text-sm tabular-nums text-[var(--success)]">
                {t("checkout.free")}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-[var(--line)] my-6" />

          {/* Total — very prominent serif */}
          <div className="flex justify-between items-end">
            <span className="font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
              {t("checkout.total")}
            </span>
            <div className="text-right">
              <span className="font-serif text-3xl text-[var(--foreground)] tracking-tight">
                Rp {totalAmount.toLocaleString("id-ID")}
              </span>
              <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--accent)] mt-0.5">
                IDR
              </span>
            </div>
          </div>
        </Panel>

        {/* Trust Indicators — subtle and refined */}
        <div className="grid grid-cols-2 gap-3">
          <Panel padding="sm" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[var(--success)]/8 flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5 text-[var(--success)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[0.7rem] font-medium text-[var(--foreground)]">
                {t("common.secure")}
              </p>
              <p className="text-[0.6rem] text-[var(--text-muted)]">{t("checkout.sslEncrypted")}</p>
            </div>
          </Panel>
          <Panel padding="sm" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[var(--accent-soft)] flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5 text-[var(--accent)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <p className="text-[0.7rem] font-medium text-[var(--foreground)]">
                {t("common.instant")}
              </p>
              <p className="text-[0.6rem] text-[var(--text-muted)]">{t("checkout.autoDelivery")}</p>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
