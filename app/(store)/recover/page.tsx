"use client";

import { useState } from "react";
import Link from "next/link";
import { REGEX_PATTERNS } from "@/lib/validation";
import Spinner from "@/components/ui/Spinner";
import { Panel } from "@/components/ui/panel";
import { PageHeader } from "@/components/ui/page-header";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { useLanguage } from "@/context/LanguageContext";

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
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults(null);

    if (!searchValue.trim()) {
      setError(
        t("checkout.pleaseEnter").replace(
          "{type}",
          searchType === "email"
            ? t("checkout.emailAddress").toLowerCase()
            : t("checkout.orderId").toLowerCase()
        )
      );
      return;
    }

    if (searchType === "email") {
      if (!REGEX_PATTERNS.email.test(searchValue.trim())) {
        setError(t("checkout.validEmail"));
        return;
      }
    } else if (!REGEX_PATTERNS.objectId.test(searchValue.trim())) {
      setError(t("checkout.validOrderId"));
      return;
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
          setError(t("checkout.tooManyAttempts"));
        } else if (res.status === 404) {
          setError(data.message || t("checkout.noOrdersInfo"));
        } else {
          setError(data.error || t("checkout.searchFailed"));
        }
        return;
      }

      if (data.success && data.orders && data.orders.length > 0) {
        setResults(data.orders);
      } else {
        setError(t("checkout.noPaidOrders"));
      }
    } catch {
      setError(t("checkout.networkError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] px-4 py-16">
      <div className="mx-auto max-w-xl space-y-8">
        <PageHeader
          eyebrow={t("checkout.orderRecovery")}
          title={t("checkout.recoverPurchase")}
          align="center"
          description={t("checkout.recoverPurchaseDesc")}
          size="lg"
        />

        <Panel padding="lg">
          <div className="mb-6 flex rounded-lg border border-[var(--line)] p-0.5">
            {(["email", "orderId"] as const).map((type) => (
              <button
                key={type}
                type="button"
                aria-pressed={searchType === type}
                onClick={() => {
                  setSearchType(type);
                  setSearchValue("");
                  setError(null);
                  setResults(null);
                }}
                className={`flex min-h-[44px] flex-1 items-center justify-center rounded-md px-4 py-2 font-mono text-[0.65rem] font-medium uppercase tracking-[0.12em] transition-all ${
                  searchType === type
                    ? "bg-[var(--panel-2)] text-[var(--foreground)] shadow-sm"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {type === "email" ? t("checkout.email") : t("checkout.orderId")}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3"
              >
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-[var(--danger)]">{error}</span>
              </div>
            )}

            <Field
              label={searchType === "email" ? t("checkout.emailAddress") : t("checkout.orderId")}
              monoLabel
              htmlFor="search-input"
              helper={
                searchType === "email" ? t("checkout.enterEmail") : t("checkout.enterOrderId")
              }
            >
              <Input
                type={searchType === "email" ? "email" : "text"}
                id="search-input"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={
                  searchType === "email"
                    ? t("checkout.placeholderEmail")
                    : t("checkout.placeholderOrderId")
                }
                disabled={loading}
                className="h-10 bg-[var(--panel-2)] font-mono text-sm"
              />
            </Field>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-3 rounded-lg border border-[var(--accent)] bg-[var(--accent)] px-6 py-3 font-mono text-sm font-medium uppercase tracking-wider text-[var(--accent-foreground)] transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Spinner size={18} className="text-current" variant="classic" />
                  <span>{t("checkout.searching")}</span>
                </>
              ) : (
                <>
                  <span>{t("checkout.findMyOrders")}</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </Panel>

        {results && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.65rem] font-medium uppercase tracking-[0.1em] text-[var(--text-muted)]">
                {t("checkout.foundOrders").replace("{count}", String(results.length))}
              </span>
              <StatusBadge status="success">
                {t("checkout.result").replace("{count}", String(results.length))}
              </StatusBadge>
            </div>
            <div className="space-y-2">
              {results.map((order) => (
                <Link key={order.orderId} href={`/order/${order.orderId}`} className="group block">
                  <Panel
                    padding="md"
                    className="transition-colors group-hover:border-[var(--line-strong)]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <h3 className="truncate text-sm font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                          {order.productTitle}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs text-[var(--success)]">
                            Rp {order.amountPaid.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[var(--line)]" aria-hidden="true">
                            /
                          </span>
                          <span className="font-mono text-[0.65rem] text-[var(--text-muted)]">
                            {new Date(order.paidAt).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]">
                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.12em]">
                          {t("checkout.access")}
                        </span>
                        <svg
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </Panel>
                </Link>
              ))}
            </div>
          </div>
        )}

        {results && results.length === 0 && (
          <EmptyState
            title={t("checkout.noOrdersFound")}
            description={t("checkout.noOrdersFoundDesc")}
            icon={
              <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        )}

        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] transition-colors hover:text-[var(--accent)]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            {t("error.returnToStore")}
          </Link>
        </div>
      </div>
    </div>
  );
}
