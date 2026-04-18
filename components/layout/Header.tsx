"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function Header() {
  const { t, language, setLanguage } = useLanguage();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Backdrop with subtle border */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-b border-indigo-100/50" />

      <div className="container mx-auto flex h-16 items-center justify-between px-4 relative">
        {/* Logo with kinetic geometry accent */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10">
            {/* Orbiting ring */}
            <div
              className="absolute inset-0 border border-indigo-200 rounded-xl animate-orbit-slow opacity-50 group-hover:opacity-100 transition-opacity"
              style={{ transformOrigin: "center" }}
            ></div>
            {/* Logo container */}
            <div className="absolute inset-1 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
              <span className="text-white font-bold text-base">A</span>
            </div>
            {/* Orbiting dot */}
            <div
              className="absolute -top-0.5 left-1/2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-orbit-fast"
              style={{ transformOrigin: "20px 22px" }}
            ></div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors leading-none">
              AutoBeli
            </span>
            <span className="text-[10px] text-indigo-500 uppercase tracking-wider leading-none mt-0.5 font-medium">
              {t("common.digitalStore")}
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2" aria-label="Main navigation">
          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === "id" ? "en" : "id")}
            aria-label="Switch language"
            className="relative px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all overflow-hidden group"
          >
            <span className="relative z-10">{language === "id" ? "EN" : "ID"}</span>
          </button>

          {/* Recover Link */}
          <Link
            href="/recover"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all group"
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
              {/* Geometric accent on hover */}
              <div className="absolute inset-0 scale-150 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  className="w-full h-full animate-orbit-fast"
                  viewBox="0 0 16 16"
                  style={{ transformOrigin: "center" }}
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    strokeOpacity="0.3"
                  />
                </svg>
              </div>
            </div>
            <span className="hidden sm:inline font-medium">{t("common.findMyOrder")}</span>
          </Link>

          {/* Browse Products Button */}
          <Link
            href="/#products"
            className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all overflow-hidden group"
          >
            {/* Orbiting accent inside button */}
            <span className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                <circle
                  cx="85"
                  cy="20"
                  r="15"
                  fill="none"
                  stroke="white"
                  strokeWidth="0.5"
                  className="animate-orbit-fast"
                  style={{ transformOrigin: "85px 20px" }}
                />
              </svg>
            </span>
            <span className="relative hidden sm:inline">{t("common.browse")}</span>
            <svg
              className="w-4 h-4 relative transition-transform group-hover:translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
