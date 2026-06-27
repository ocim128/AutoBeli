"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { formatIDR, formatDate, shortOrderId } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { StatusBadge } from "@/components/ui/status-badge";
import { CornerFrame } from "@/components/ui/corner-frame";
import ContentViewer from "@/components/ContentViewer";

interface OrderPaidProps {
  orderId: string;
  productTitle: string;
  amountPaid: number;
  createdAt: Date | string;
  paymentGateway: string;
  token: string | null;
}

export default function OrderPaid({
  orderId,
  productTitle,
  amountPaid,
  createdAt,
  paymentGateway,
  token,
}: OrderPaidProps) {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-[80vh] py-16 px-4">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Success Header */}
        <PageHeader
          eyebrow={t("checkout.orderDetails")}
          title={t("checkout.purchaseSuccessful")}
          align="center"
          description={t("checkout.purchaseSuccessfulDesc")}
          size="lg"
        />

        <div className="grid gap-8 md:grid-cols-12">
          {/* Order Brief Sidebar */}
          <div className="space-y-6 md:col-span-4">
            <Panel featured monoLabel={t("checkout.orderDetails")} padding="lg">
              <div className="space-y-0 divide-y divide-[var(--line)]">
                <div className="pb-4">
                  <span className="eyebrow-sm mb-1 block">{t("checkout.product")}</span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {productTitle}
                  </span>
                </div>
                <div className="py-4">
                  <span className="eyebrow-sm mb-1 block">{t("checkout.totalPaid")}</span>
                  <span className="font-mono text-lg font-medium text-[var(--success)]">
                    {formatIDR(amountPaid)}
                  </span>
                </div>
                <div className="py-4">
                  <span className="eyebrow-sm mb-1 block">{t("checkout.date")}</span>
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
                <div className="py-4">
                  <span className="eyebrow-sm mb-1 block">{t("checkout.paymentMethod")}</span>
                  <span className="text-sm text-[var(--foreground)]">{paymentGateway}</span>
                </div>
                <div className="pt-4">
                  <span className="eyebrow-sm mb-1 block">{t("checkout.orderId")}</span>
                  <CornerFrame size="sm">
                    <span className="block rounded bg-[var(--panel-2)] px-2 py-1 font-mono text-xs text-[var(--text-muted)]">
                      #{shortOrderId(orderId)}
                    </span>
                  </CornerFrame>
                </div>
              </div>

              {/* Status */}
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <StatusBadge status="success">{t("checkout.paid")}</StatusBadge>
              </div>
            </Panel>

            {/* Help link */}
            <Panel variant="ghost" padding="sm">
              <Link
                href="/recover"
                className="flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {t("checkout.findOtherOrders")}
              </Link>
            </Panel>
          </div>

          {/* Content Delivery Area */}
          <div className="md:col-span-8">
            {!token ? (
              <Panel variant="accent" padding="lg">
                <div className="flex flex-col items-center gap-5 py-4 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--panel-2)]">
                    <svg
                      className="h-5 w-5 text-[var(--text-muted)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <StatusBadge status="error">{t("checkout.deliveryError")}</StatusBadge>
                    <p className="max-w-md text-sm text-[var(--text-muted)]">
                      {t("checkout.deliveryErrorDesc")}
                    </p>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel padding="lg">
                <ContentViewer token={token} />
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
