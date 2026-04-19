"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { CornerFrame } from "@/components/ui/corner-frame";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center bg-[var(--background)]">
      <CornerFrame size="lg" color="var(--accent)">
        <Panel variant="ghost" padding="lg" className="max-w-md mx-auto">
          {/* Mono eyebrow */}
          <span className="mb-3 block font-mono text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {t("error.pageNotFound").toUpperCase()}
          </span>

          {/* Large serif 404 */}
          <h1 className="font-serif text-[7rem] leading-none text-[var(--foreground)] tracking-tight">
            404
          </h1>

          {/* Divider */}
          <div className="w-12 h-px bg-[var(--line-strong)] mx-auto my-6" />

          {/* Description */}
          <p className="text-[var(--text-muted)] mb-8 leading-relaxed">
            {t("error.assetNotFoundDesc")}
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold rounded-lg hover:brightness-110 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("error.returnToStore")}
            </Link>
            <Link
              href="/recover"
              className="inline-flex items-center gap-2 px-6 py-3 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {t("common.findMyOrder")}
            </Link>
          </div>
        </Panel>
      </CornerFrame>
    </div>
  );
}
