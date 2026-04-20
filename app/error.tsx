"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";

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
      <div className="max-w-lg w-full animate-editorial-fade-in">
        <Panel featured padding="xl" className="text-center">
          {/* Mono eyebrow */}
          <span className="mb-4 block font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t("error.errorEyebrow").toUpperCase()}
          </span>

          {/* Serif title */}
          <h2 className="font-serif text-3xl md:text-4xl text-[var(--foreground)] mb-3 tracking-tight">
            {t("error.somethingWentWrong")}
          </h2>

          <p className="text-[var(--text-muted)] text-[0.95rem] mb-2 leading-relaxed max-w-sm mx-auto">
            {t("error.unexpectedError")}
          </p>

          {/* Error digest — subtle */}
          {error.digest && (
            <div className="mt-4 mb-0">
              <span className="inline-block px-3 py-1.5 rounded-md bg-[var(--panel-2)] text-[0.7rem] font-mono text-[var(--text-muted)] border border-[var(--line)] opacity-70">
                {t("error.reference")}: {error.digest}
              </span>
            </div>
          )}

          {/* Decorative rule */}
          <div className="flex items-center justify-center gap-3 my-8">
            <span className="block w-8 h-px bg-[var(--line-strong)]" />
            <span
              className="block w-1.5 h-1.5 rounded-full bg-[var(--accent)] opacity-60"
              aria-hidden="true"
            />
            <span className="block w-8 h-px bg-[var(--line-strong)]" />
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => reset()}
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
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{t("error.tryAgain")}</span>
            </button>
            <Link
              href="/"
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
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              {t("error.goBackHome")}
            </Link>
          </div>
        </Panel>
      </div>
    </div>
  );
}
