"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Providers } from "@/components/Providers";

function GlobalErrorContent({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="flex h-screen flex-col items-center justify-center text-center px-4">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">{t("error.criticalError")}</h2>
      <p className="text-gray-600 mb-8 max-w-lg">{t("error.criticalErrorDesc")}</p>
      <button
        onClick={() => reset()}
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-indigo-700"
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
