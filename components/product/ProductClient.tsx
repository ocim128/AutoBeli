"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import BuyButton from "@/components/BuyButton";
import { KineticBackground } from "@/components/ui/KineticBackground";
import ScrollAnimate from "@/components/ui/ScrollAnimate";
import type { SerializedProduct } from "@/lib/products";

export function ProductClient({ product }: { product: SerializedProduct }) {
  const { t } = useLanguage();

  const features = [
    {
      title: t("product.features.instantAccess"),
      desc: t("product.features.instantAccessDesc"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: t("product.features.secureEncryption"),
      desc: t("product.features.secureEncryptionDesc"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      ),
    },
    {
      title: t("product.features.permanentLink"),
      desc: t("product.features.permanentLinkDesc"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      ),
    },
    {
      title: t("product.features.supportIncluded"),
      desc: t("product.features.supportIncludedDesc"),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Breadcrumb with kinetic accent */}
      <ScrollAnimate animation="fade-up">
        <nav className="flex items-center text-xs font-semibold uppercase tracking-wider text-gray-400 mb-12 space-x-3 bg-white/80 backdrop-blur-sm w-fit px-5 py-2.5 rounded-full border border-indigo-100 shadow-sm">
          <Link
            href="/"
            className="hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            {t("common.store")}
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-indigo-600 truncate max-w-[200px]">{product.title}</span>
        </nav>
      </ScrollAnimate>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left side - Visual & Info (7 columns) */}
        <ScrollAnimate animation="scale" className="lg:col-span-7 min-w-0">
          {/* Product Hero Image with Kinetic Geometry */}
          <div className="space-y-10">
            <div className="aspect-[16/10] relative overflow-hidden rounded-3xl bg-gray-900 shadow-2xl shadow-indigo-500/20 flex items-center justify-center group">
              {product.imageUrl ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent z-10" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="relative z-20 w-full h-full flex flex-col justify-end p-8 md:p-10">
                    <div className="inline-flex items-center gap-2 w-fit px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 font-semibold tracking-wider uppercase text-xs mb-4">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-breathe"></span>
                      {t("product.digitalAsset")} #{product.slug.slice(-4)}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white capitalize leading-tight">
                      {product.title}
                    </h2>
                  </div>
                </>
              ) : (
                <>
                  {/* Kinetic Geometry Background for placeholder */}
                  <KineticBackground variant="subtle" className="opacity-40" />

                  {/* Animated orbital pattern */}
                  <svg
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 400 250"
                    preserveAspectRatio="xMidYMid slice"
                  >
                    <g className="animate-orbit-slow" style={{ transformOrigin: "200px 125px" }}>
                      <circle
                        cx="200"
                        cy="125"
                        r="100"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="1"
                        strokeOpacity="0.3"
                      />
                      <circle cx="300" cy="125" r="6" fill="#6366f1" fillOpacity="0.5" />
                    </g>
                    <g className="animate-orbit-medium" style={{ transformOrigin: "200px 125px" }}>
                      <circle
                        cx="200"
                        cy="125"
                        r="70"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                        strokeDasharray="10 5"
                      />
                      <circle cx="270" cy="125" r="8" fill="#818cf8" fillOpacity="0.6" />
                    </g>
                    <g className="animate-orbit-reverse" style={{ transformOrigin: "200px 125px" }}>
                      <circle
                        cx="200"
                        cy="125"
                        r="40"
                        fill="none"
                        stroke="#a5b4fc"
                        strokeWidth="1"
                        strokeOpacity="0.5"
                      />
                      <circle cx="160" cy="125" r="5" fill="#a5b4fc" fillOpacity="0.7" />
                    </g>
                    <circle
                      cx="200"
                      cy="125"
                      r="8"
                      fill="#6366f1"
                      fillOpacity="0.8"
                      className="animate-breathe"
                    />
                  </svg>

                  <div className="relative text-center p-12 z-20">
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white font-semibold tracking-wider uppercase text-xs mb-6">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-breathe"></span>
                      {t("product.digitalAsset")} #{product.slug.slice(-4)}
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white capitalize px-6">
                      {product.title}
                    </h2>
                  </div>
                </>
              )}
            </div>

            {/* Description Section */}
            <div className="space-y-8 bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    {t("product.overview")}
                  </h3>
                </div>
                <div className="prose prose-lg text-gray-600 leading-relaxed max-w-none">
                  <p className="whitespace-pre-line">
                    {product.description || t("product.defaultDescription")}
                  </p>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, i) => (
                  <ScrollAnimate key={i} animation="fade-up" delay={(i + 2) * 100}>
                    <div
                      className={`group flex gap-4 p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:border-indigo-200 hover:shadow-md transition-all`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {feature.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 leading-none mb-1.5">
                          {feature.title}
                        </div>
                        <div className="text-xs text-gray-500">{feature.desc}</div>
                      </div>
                    </div>
                  </ScrollAnimate>
                ))}
              </div>
            </div>
          </div>
        </ScrollAnimate>

        {/* Right side - Purchase Box (5 columns) */}
        <ScrollAnimate animation="slide-right" className="lg:col-span-5 min-w-0">
          <div className="sticky top-28 space-y-6">
            {/* Purchase Card with Kinetic Geometry */}
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-10 text-white shadow-2xl shadow-indigo-600/20 overflow-hidden">
              {/* Kinetic geometry accent */}
              <div className="absolute inset-0 pointer-events-none">
                <svg
                  className="absolute w-full h-full"
                  viewBox="0 0 300 400"
                  preserveAspectRatio="xMaxYMax slice"
                >
                  <g className="animate-orbit-slow" style={{ transformOrigin: "250px 350px" }}>
                    <circle
                      cx="250"
                      cy="350"
                      r="80"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="0.5"
                      strokeOpacity="0.15"
                    />
                    <circle cx="330" cy="350" r="4" fill="#6366f1" fillOpacity="0.3" />
                  </g>
                  <g className="animate-orbit-reverse" style={{ transformOrigin: "250px 350px" }}>
                    <circle
                      cx="250"
                      cy="350"
                      r="50"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="0.5"
                      strokeOpacity="0.2"
                      strokeDasharray="5 3"
                    />
                    <circle cx="200" cy="350" r="3" fill="#818cf8" fillOpacity="0.4" />
                  </g>
                </svg>
              </div>

              <div className="relative">
                {/* Header badges */}
                <div className="flex items-center justify-between mb-8">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-breathe"></span>
                    {t("home.instantDeliveryActive")}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-breathe" />
                    {product.availableStock && product.availableStock > 1 ? (
                      <span className="text-[10px] font-semibold text-gray-400">
                        {product.availableStock} {t("product.stockAvailable")}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-400">
                        {t("product.stockAvailable")}
                      </span>
                    )}
                  </div>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
                  {product.title}
                </h1>
                <p className="text-gray-400 text-sm mb-8 line-clamp-2">{t("product.secureCopy")}</p>

                {/* Price Section */}
                <div className="flex items-end gap-3 mb-8 border-b border-white/10 pb-8">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                      {t("product.fullAccessPrice")}
                    </span>
                    <span className="text-4xl md:text-5xl font-bold text-white tracking-tight">
                      Rp{product.priceIdr.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <span className="text-indigo-400 font-semibold mb-2">IDR</span>
                </div>

                <BuyButton slug={product.slug} maxQuantity={product.availableStock || 1} />

                {/* Payment Methods */}
                <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap justify-center gap-3 opacity-50">
                  <span className="text-[10px] font-bold uppercase tracking-wider border border-white/20 px-3 py-1.5 rounded-lg">
                    QRIS
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider border border-white/20 px-3 py-1.5 rounded-lg">
                    VA
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider border border-white/20 px-3 py-1.5 rounded-lg">
                    Wallet
                  </span>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <ScrollAnimate animation="fade-up" delay={200}>
              <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 border border-indigo-100 flex items-center gap-4">
                <div className="relative w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  {/* Orbiting accent */}
                  <div
                    className="absolute inset-0 rounded-xl border border-indigo-400/30 animate-orbit-slow"
                    style={{ transformOrigin: "center" }}
                  ></div>
                </div>
                <div>
                  <div className="text-sm font-bold text-indigo-900 leading-tight">
                    {t("common.securePayment")}
                  </div>
                  <p className="text-xs text-indigo-600/70">{t("common.processedBy")}</p>
                </div>
              </div>
            </ScrollAnimate>
          </div>
        </ScrollAnimate>
      </div>
    </div>
  );
}
