"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { KineticBackground } from "@/components/ui/KineticBackground";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-indigo-100/50 bg-gradient-to-b from-white to-indigo-50/30 mt-auto overflow-hidden">
      {/* Kinetic geometry background */}
      <KineticBackground variant="minimal" />

      <div className="container mx-auto py-12 px-4 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Copyright with geometric accent */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative w-10 h-10">
                {/* Orbiting ring */}
                <div
                  className="absolute inset-0 border border-indigo-200 rounded-xl animate-orbit-reverse opacity-40"
                  style={{ transformOrigin: "center" }}
                ></div>
                <div className="absolute inset-1 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <span className="text-white font-bold">A</span>
                </div>
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                AutoBeli
              </span>
            </Link>
            <p className="text-sm text-gray-400 flex items-center gap-2">
              <span className="w-1 h-1 bg-indigo-400 rounded-full animate-breathe"></span>©{" "}
              {currentYear} AutoBeli. {t("common.allRightsReserved")}
            </p>
          </div>

          {/* Navigation Links */}
          <nav
            className="flex flex-wrap items-center justify-center gap-6"
            aria-label="Footer navigation"
          >
            <Link
              href="/recover"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-colors group"
            >
              <div className="relative">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <span>{t("common.findMyOrder")}</span>
            </Link>
            <span className="w-px h-4 bg-indigo-200 hidden sm:block" />
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              {t("common.browse")}
            </Link>
            <span className="w-px h-4 bg-indigo-200 hidden sm:block" />
            <a
              href="https://wa.me/6287863442865"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-green-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              <span>{t("common.contactUs")}</span>
            </a>
          </nav>

          {/* Trust Badges with geometric styling */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <div className="relative">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="absolute inset-0 animate-breathe">
                  <svg className="w-full h-full" viewBox="0 0 16 16">
                    <circle
                      cx="8"
                      cy="8"
                      r="7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeOpacity="0.3"
                      className="text-green-500"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t("common.secure")}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-indigo-100 shadow-sm">
              <div className="relative">
                <svg
                  className="w-4 h-4 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <div
                  className="absolute inset-0 animate-breathe"
                  style={{ animationDelay: "0.5s" }}
                >
                  <svg className="w-full h-full" viewBox="0 0 16 16">
                    <circle
                      cx="8"
                      cy="8"
                      r="7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      strokeOpacity="0.3"
                      className="text-indigo-500"
                    />
                  </svg>
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {t("common.instant")}
              </span>
            </div>
          </div>
        </div>

        {/* Decorative orbiting element at bottom */}
        <div className="flex justify-center mt-8 pt-6 border-t border-indigo-100/50">
          <div className="relative w-16 h-16">
            <div
              className="absolute inset-0 border border-indigo-200/50 rounded-full animate-orbit-slow"
              style={{ transformOrigin: "center" }}
            ></div>
            <div
              className="absolute inset-2 border border-indigo-300/50 rounded-full animate-orbit-reverse"
              style={{ transformOrigin: "center" }}
            ></div>
            <div
              className="absolute inset-4 border border-indigo-400/50 rounded-full animate-orbit-medium"
              style={{ transformOrigin: "center" }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-breathe"></div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
