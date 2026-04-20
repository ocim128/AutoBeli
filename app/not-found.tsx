"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-[var(--background)]">
      <div className="max-w-md w-full animate-editorial-fade-in">
        <Panel featured padding="xl" className="text-center">
          {/* Mono eyebrow */}
          <span className="mb-4 block font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t("error.pageNotFound").toUpperCase()}
          </span>

          {/* Large serif 404 */}
          <h1 className="font-serif text-[8rem] leading-[0.85] text-[var(--foreground)] tracking-tight mb-2">
            404
          </h1>

          {/* Decorative rule */}
          <div className="flex items-center justify-center gap-3 my-8">
            <span className="block w-8 h-px bg-[var(--line-strong)]" />
            <span
              className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-60"
              aria-hidden="true"
            />
            <span className="block w-8 h-px bg-[var(--line-strong)]" />
          </div>

          {/* Description */}
          <p className="text-[var(--text-muted)] text-[0.95rem] mb-10 leading-relaxed max-w-xs mx-auto">
            {t("error.assetNotFoundDesc")}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg bg-[var(--accent)] text-[var(--accent-foreground)] font-medium text-sm transition-all hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t("error.returnToStore")}
            </Link>
            <Link
              href="/recover"
              className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-lg border border-[var(--line-strong)] text-[var(--text-muted)] text-sm font-medium transition-colors hover:text-[var(--foreground)] hover:border-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t("common.findMyOrder")}
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
