"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { formatIDR, formatDate, shortOrderId } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";

interface OrderPendingProps {
  orderId: string;
  productTitle: string;
  amount: number; // Final payable amount (stored Qris amount for Qris orders)
  createdAt: Date | string;
  isQris?: boolean;
  expiresAt?: number; // Qris payment expiry, epoch milliseconds
  isExpired?: boolean;
}

const POLL_INTERVAL_MS = 8000;
const EXPIRY_GRACE_MS = 30_000;
const FALLBACK_POLL_CUTOFF_MS = 180_000;

export default function OrderPending({
  orderId,
  productTitle,
  amount,
  createdAt,
  isQris = false,
  expiresAt,
  isExpired = false,
}: OrderPendingProps) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-poll for payment status updates.
  // The server page (order/[orderId]/page.tsx) calls syncOrderPaymentStatus()
  // on every render, so router.refresh() triggers a server re-check.
  // If status changed to PAID, the server renders OrderPaid instead.
  // Qris orders poll until the provider expiry plus a short grace period;
  // other gateways keep the fixed three-minute cutoff.
  useEffect(() => {
    if (isExpired) return;

    const cutoff = expiresAt ? expiresAt + EXPIRY_GRACE_MS : Date.now() + FALLBACK_POLL_CUTOFF_MS;

    pollingRef.current = setInterval(() => {
      if (Date.now() > cutoff) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = null;
        return;
      }
      router.refresh();
    }, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [router, expiresAt, isExpired]);

  if (isExpired) {
    return (
      <div className="min-h-[80vh] py-16 px-4">
        <div className="mx-auto max-w-2xl space-y-10">
          <PageHeader
            eyebrow={t("checkout.orderDetails")}
            title={t("checkout.paymentExpired")}
            align="center"
            description={t("checkout.paymentExpiredDesc")}
            size="lg"
          />

          <Panel featured monoLabel={t("checkout.orderSummary")} padding="lg">
            <div className="space-y-0 divide-y divide-[var(--line)]">
              <div className="flex items-start justify-between gap-4 pb-4">
                <span className="eyebrow-sm">{t("checkout.product")}</span>
                <span className="text-right text-sm font-medium text-[var(--foreground)]">
                  {productTitle}
                </span>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="eyebrow-sm">{t("checkout.orderId")}</span>
                <span className="font-mono text-xs text-[var(--text-muted)]">
                  #{shortOrderId(orderId)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-5">
              <StatusBadge status="error">{t("checkout.paymentExpired")}</StatusBadge>
            </div>
          </Panel>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={`/checkout/${orderId}?retry=true`}
              className={buttonVariants({ size: "xl" })}
            >
              {t("checkout.createNewPayment")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] py-16 px-4">
      <div className="mx-auto max-w-2xl space-y-10">
        {/* Header */}
        <PageHeader
          eyebrow={t("checkout.orderDetails")}
          title={t("checkout.paymentVerification")}
          align="center"
          description={
            isQris ? t("checkout.scanQrInstruction") : t("checkout.paymentVerificationDesc")
          }
          size="lg"
        />

        {/* Qris QR code */}
        {isQris && (
          <Panel featured padding="lg" className="space-y-5">
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/payment/qris/image?orderId=${orderId}`}
                alt="Qris QR code"
                width={280}
                height={280}
                className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white p-2"
              />
            </div>
            <div className="space-y-2 text-center">
              <p className="eyebrow-sm">{t("checkout.payExactAmount")}</p>
              <p className="font-serif text-3xl tracking-tight text-[var(--foreground)]">
                {formatIDR(amount)}
              </p>
              {expiresAt && (
                <p className="text-xs text-[var(--text-muted)]">
                  {t("checkout.expiresAt")}{" "}
                  {formatDate(new Date(expiresAt), language === "id" ? "id-ID" : "en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </Panel>
        )}

        {/* Order Brief — featured panel */}
        <Panel featured monoLabel={t("checkout.orderSummary")} padding="lg">
          <div className="space-y-0 divide-y divide-[var(--line)]">
            <div className="flex items-start justify-between gap-4 pb-4">
              <span className="eyebrow-sm">{t("checkout.product")}</span>
              <span className="text-right text-sm font-medium text-[var(--foreground)]">
                {productTitle}
              </span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="eyebrow-sm">{t("checkout.amount")}</span>
              <span className="font-mono text-sm font-medium text-[var(--foreground)]">
                {formatIDR(amount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="eyebrow-sm">{t("checkout.date")}</span>
              <span className="text-sm text-[var(--text-muted)]">
                {formatDate(createdAt, language === "id" ? "id-ID" : "en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-4">
              <span className="eyebrow-sm">{t("checkout.orderId")}</span>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                #{shortOrderId(orderId)}
              </span>
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
          <Link href={`/order/${orderId}`} className={buttonVariants({ size: "xl" })}>
            <svg
              className="size-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
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
            className={buttonVariants({ variant: "outline", size: "xl" })}
          >
            {t("checkout.retryPayment")}
          </Link>
        </div>
      </div>
    </div>
  );
}
