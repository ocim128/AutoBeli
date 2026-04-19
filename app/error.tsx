"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { CornerFrame } from "@/components/ui/corner-frame";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 bg-[var(--background)]">
      <CornerFrame size="lg" color="var(--accent)">
        <Panel variant="ghost" padding="lg" className="max-w-lg w-full text-center">
          {/* Mono eyebrow */}
          <span className="mb-3 block font-mono text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
            {t("error.errorEyebrow").toUpperCase()}
          </span>

          {/* Serif title */}
          <h2 className="font-serif text-3xl md:text-4xl text-[var(--foreground)] mb-3 tracking-tight">
            {t("error.somethingWentWrong")}
          </h2>

          <p className="text-[var(--text-muted)] mb-4 leading-relaxed">
            {t("error.unexpectedError")}
          </p>

          {error.digest && (
            <div className="mb-6 inline-block">
              <span className="px-3 py-1.5 rounded-md bg-[var(--panel-2)] text-xs font-mono text-[var(--text-muted)] border border-[var(--line)]">
                {t("error.reference")}: {error.digest}
              </span>
            </div>
          )}

          {/* Divider */}
          <div className="w-12 h-px bg-[var(--line-strong)] mx-auto my-6" />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-[var(--accent-foreground)] font-semibold rounded-lg hover:brightness-110 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{t("error.tryAgain")}</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              {t("error.goBackHome")}
            </Link>
          </div>
        </Panel>
      </CornerFrame>
    </div>
  );
}
