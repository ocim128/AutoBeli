"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="max-w-lg w-full">
        <div className="bg-gradient-to-br from-white to-red-50/50 p-10 md:p-14 rounded-[2.5rem] shadow-2xl shadow-red-100/50 border border-red-100/50 text-center relative overflow-hidden">
          {/* Decorative corner gradient */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-red-400/10 to-orange-400/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-gradient-to-br from-pink-400/10 to-red-400/10 rounded-full blur-2xl" />

          <div className="relative">
            {/* Error Icon */}
            <div className="relative mb-8 inline-block">
              <div className="absolute inset-0 bg-red-400/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3 tracking-tight">
              {t("error.somethingWentWrong")}
            </h2>
            <p className="text-gray-500 mb-4 leading-relaxed">{t("error.unexpectedError")}</p>

            {error.digest && (
              <div className="mb-8 inline-block">
                <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-xs font-mono text-gray-500">
                  {t("error.reference")}: {error.digest}
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <button
                onClick={() => reset()}
                className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-gradient-to-r from-red-500 to-orange-500 text-white font-black py-4 px-8 rounded-2xl shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:-translate-y-1 active:translate-y-0 transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 font-bold py-4 px-6 rounded-2xl hover:bg-gray-50 hover:text-gray-900 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          </div>
        </div>
      </div>
    </div>
  );
}
