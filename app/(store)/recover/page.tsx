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

    // Basic validation using shared patterns
    if (searchType === "email") {
      if (!REGEX_PATTERNS.email.test(searchValue.trim())) {
        setError(t("checkout.validEmail"));
        return;
      }
    } else {
      if (!REGEX_PATTERNS.objectId.test(searchValue.trim())) {
        setError(t("checkout.validOrderId"));
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
    <div className="min-h-[80vh] py-16 px-4">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <PageHeader
          eyebrow={t("checkout.orderRecovery")}
          title={t("checkout.recoverPurchase")}
          align="center"
          description={t("checkout.recoverPurchaseDesc")}
        />

        {/* Search Form Panel */}
        <Panel padding="lg">
          {/* Toggle Search Type */}
          <div className="mb-6 flex gap-1 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-1">
            <button
              type="button"
              aria-pressed={searchType === "email"}
              onClick={() => {
                setSearchType("email");
                setSearchValue("");
                setError(null);
                setResults(null);
              }}
              className={`flex-1 rounded-md px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
                searchType === "email"
                  ? "bg-[var(--panel)] text-[var(--foreground)]"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t("checkout.email")}
            </button>
            <button
              type="button"
              aria-pressed={searchType === "orderId"}
              onClick={() => {
                setSearchType("orderId");
                setSearchValue("");
                setError(null);
                setResults(null);
              }}
              className={`flex-1 rounded-md px-4 py-2 font-mono text-xs font-medium uppercase tracking-wider transition-colors ${
                searchType === "orderId"
                  ? "bg-[var(--panel)] text-[var(--foreground)]"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t("checkout.orderId")}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div
                role="alert"
                className="flex items-start gap-3 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger)]/10 px-4 py-3"
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

            {/* Search Input */}
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

            {/* Submit Button */}
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

        {/* Results */}
        {results && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
                {t("checkout.foundOrders").replace("{count}", String(results.length))}
              </span>
              <StatusBadge status="success">
                {t("checkout.result").replace("{count}", String(results.length))}
              </StatusBadge>
            </div>
            {results.map((order) => (
              <Link key={order.orderId} href={`/order/${order.orderId}`} className="group block">
                <Panel
                  padding="md"
                  className="transition-colors group-hover:border-[var(--line-strong)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-sm font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                        {order.productTitle}
                      </h3>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-xs text-[var(--success)]">
                          Rp {order.amountPaid.toLocaleString("id-ID")}
                        </span>
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {new Date(order.paidAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <span className="block font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
                        #{order.orderId.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]">
                      <span className="font-mono text-xs uppercase tracking-wider">
                        {t("checkout.access")}
                      </span>
                      <svg
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
        )}

        {/* Not Found Empty State */}
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

        {/* Back to Store Link */}
        <div className="flex justify-center pt-4">
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
