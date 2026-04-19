"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Providers } from "@/components/Providers";

function GlobalErrorContent({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  return (
    <div
      className="flex h-screen flex-col items-center justify-center text-center px-4"
      style={{ background: "#090909", color: "#f2eee6" }}
    >
      <span
        className="mb-3 block font-mono text-[0.7rem] font-medium uppercase tracking-[0.12em]"
        style={{ color: "#9c9588" }}
      >
        CRITICAL ERROR
      </span>
      <h2 className="text-3xl font-serif mb-4">{t("error.criticalError")}</h2>
      <p className="mb-8 max-w-lg" style={{ color: "#9c9588" }}>
        {t("error.criticalErrorDesc")}
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-3 rounded-lg font-semibold transition-all hover:brightness-110"
        style={{ background: "#ff5a36", color: "#fff3ee" }}
      >
        {t("error.reloadApp")}
      </button>
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
    <html>
      <body>
        <Providers>
          <GlobalErrorContent error={error} reset={reset} />
        </Providers>
      </body>
    </html>
  );
}
