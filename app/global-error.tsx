"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Providers } from "@/components/Providers";

function GlobalErrorContent({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  return (
    <div
      className="flex h-screen flex-col items-center justify-center text-center px-4"
      style={{
        background: "var(--background, #090909)",
        color: "var(--foreground, #f2eee6)",
      }}
    >
      <div
        style={{
          maxWidth: "480px",
          width: "100%",
          border: "1px solid var(--line-strong, rgba(255,255,255,0.22))",
          borderTop: "2px solid var(--accent, #ff5a36)",
          borderRadius: "14px",
          padding: "48px 32px",
          background: "var(--panel, #111111)",
        }}
      >
        {/* Mono eyebrow */}
        <span
          style={{
            display: "block",
            marginBottom: "16px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "0.65rem",
            fontWeight: 500,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--text-muted, #a89f92)",
          }}
        >
          {t("error.criticalError").toUpperCase()}
        </span>

        {/* Serif title */}
        <h2
          style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: "1.875rem",
            lineHeight: 1.2,
            marginBottom: "12px",
            letterSpacing: "-0.01em",
          }}
        >
          {t("error.criticalError")}
        </h2>

        {/* Description */}
        <p
          style={{
            color: "var(--text-muted, #a89f92)",
            fontSize: "0.95rem",
            lineHeight: 1.6,
            marginBottom: "8px",
          }}
        >
          {t("error.criticalErrorDesc")}
        </p>

        {/* Error digest — subtle */}
        {error.digest && (
          <span
            style={{
              display: "inline-block",
              marginTop: "12px",
              marginBottom: "0",
              padding: "6px 12px",
              borderRadius: "6px",
              background: "var(--panel-2, #151515)",
              border: "1px solid var(--line, rgba(255,255,255,0.1))",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.7rem",
              color: "var(--text-muted, #a89f92)",
              opacity: 0.7,
            }}
          >
            {error.digest}
          </span>
        )}

        {/* Decorative rule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            margin: "32px 0",
          }}
        >
          <span
            style={{
              display: "block",
              width: "32px",
              height: "1px",
              background: "var(--line-strong, rgba(255,255,255,0.22))",
            }}
          />
          <span
            style={{
              display: "block",
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "var(--accent, #ff5a36)",
              opacity: 0.6,
            }}
          />
          <span
            style={{
              display: "block",
              width: "32px",
              height: "1px",
              background: "var(--line-strong, rgba(255,255,255,0.22))",
            }}
          />
        </div>

        {/* Reload button */}
        <button
          onClick={() => reset()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            height: "44px",
            padding: "0 24px",
            borderRadius: "8px",
            background: "var(--accent, #ff5a36)",
            color: "var(--accent-foreground, #fff3ee)",
            fontWeight: 500,
            fontSize: "0.875rem",
            border: "none",
            cursor: "pointer",
            transition: "filter 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = "none";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {t("error.reloadApp")}
        </button>
      </div>
    </div>
  );
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <GlobalErrorContent error={error} reset={reset} />
        </Providers>
      </body>
    </html>
  );
}
