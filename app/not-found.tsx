"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"
          style={{ animationDelay: "1.5s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
          style={{ animationDelay: "3s" }}
        />
      </div>

      {/* 404 Number */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-3xl opacity-20 scale-150" />
        <h1 className="relative text-[10rem] md:text-[14rem] font-black tracking-tighter leading-none">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
            404
          </span>
        </h1>
      </div>

      {/* Content */}
      <div className="relative max-w-md mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase tracking-widest mb-6">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          {t("error.pageNotFound")}
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
          {t("error.assetNotFound")}
        </h2>
        <p className="text-gray-500 mb-10 font-medium leading-relaxed">
          {t("error.assetNotFoundDesc")}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="group flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-900/20 hover:bg-black hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
          >
            <svg
              className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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
            className="flex items-center gap-2 px-6 py-4 text-gray-600 font-bold hover:text-indigo-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      </div>

      {/* Decorative floating elements */}
      <div className="absolute bottom-10 left-10 opacity-20 pointer-events-none hidden md:block">
        <div className="w-20 h-20 border-2 border-indigo-300 rounded-2xl rotate-12 animate-float" />
      </div>
      <div
        className="absolute top-20 right-20 opacity-20 pointer-events-none hidden md:block"
        style={{ animationDelay: "1s" }}
      >
        <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full animate-float" />
      </div>
    </div>
  );
}
