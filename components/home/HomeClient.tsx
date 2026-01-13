"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { KineticBackground } from "@/components/ui/KineticBackground";

interface Product {
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  priceIdr: number;
  availableStock?: number;
}

export function HomeClient({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative text-center py-28 px-4 overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-50/50 via-white to-white border border-indigo-100/50">
        {/* Kinetic Geometry Background */}
        <KineticBackground variant="hero" />

        <div className="relative space-y-8">
          {/* Animated badge with geometric accent */}
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider shadow-lg shadow-indigo-500/10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            {t("home.instantDeliveryActive")}
            <svg
              className="w-4 h-4 animate-breathe"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="12" cy="12" r="8" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
            {t("home.digitalContent")} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-500">
              {t("home.instantAccess")}
            </span>
          </h1>

          <p className="max-w-lg mx-auto text-lg text-gray-500 leading-relaxed">
            {t("home.heroDescription")}
          </p>

          <div className="flex items-center justify-center gap-4 pt-4">
            <a
              href="#products"
              className="group relative px-8 py-4 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Button geometric accent */}
              <span className="absolute inset-0 opacity-20">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 40"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <circle
                    cx="80"
                    cy="20"
                    r="30"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    className="animate-orbit-fast"
                    style={{ transformOrigin: "80px 20px" }}
                  />
                </svg>
              </span>
              <span className="relative flex items-center gap-2">
                {t("common.browse")}
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </span>
            </a>
          </div>

          {/* Decorative orbiting elements below button */}
          <div className="flex justify-center pt-6">
            <div className="relative w-20 h-20">
              <div
                className="absolute inset-0 border border-indigo-200 rounded-full animate-orbit-slow"
                style={{ transformOrigin: "center" }}
              ></div>
              <div
                className="absolute inset-2 border border-indigo-300 rounded-full animate-orbit-reverse"
                style={{ transformOrigin: "center" }}
              ></div>
              <div
                className="absolute inset-4 border border-indigo-400 rounded-full animate-orbit-medium"
                style={{ transformOrigin: "center" }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-breathe"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section id="products" className="scroll-mt-24 relative">
        {/* Section header with geometric accent */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="flex items-start gap-4">
            {/* Geometric accent */}
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-indigo-100 items-center justify-center shrink-0">
              <svg
                className="w-6 h-6 text-indigo-600 animate-orbit-slow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                style={{ transformOrigin: "center" }}
              >
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="12" cy="4" r="1.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {t("home.availableAssets")}
              </h2>
              <p className="text-gray-500 mt-1">{t("home.curatedCollection")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-medium text-indigo-700">
            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-breathe"></span>
            {products.length} {t("home.itemsLive")}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="relative text-center py-24 bg-gradient-to-b from-gray-50 to-white rounded-2xl border border-gray-200 overflow-hidden">
            <KineticBackground variant="minimal" />
            <div className="relative">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-gray-700 font-semibold text-lg">{t("home.inventoryEmpty")}</p>
              <p className="text-gray-400 mt-2">{t("home.checkBack")}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.slug} href={`/product/${product.slug}`} className="group h-full">
                <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-300 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-2">
                  {/* Card Media Area */}
                  <div className="h-52 relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {/* Prominent animated geometric pattern */}
                        <svg
                          className="absolute inset-0 w-full h-full"
                          viewBox="0 0 200 200"
                          preserveAspectRatio="xMidYMid slice"
                        >
                          {/* Orbiting rings */}
                          <g
                            className="animate-orbit-slow"
                            style={{ transformOrigin: "100px 100px" }}
                          >
                            <circle
                              cx="100"
                              cy="100"
                              r="70"
                              fill="none"
                              stroke="#6366f1"
                              strokeWidth="1"
                              strokeOpacity="0.3"
                            />
                            <circle cx="170" cy="100" r="4" fill="#6366f1" fillOpacity="0.5" />
                          </g>
                          <g
                            className="animate-orbit-medium"
                            style={{ transformOrigin: "100px 100px" }}
                          >
                            <circle
                              cx="100"
                              cy="100"
                              r="50"
                              fill="none"
                              stroke="#818cf8"
                              strokeWidth="1.5"
                              strokeOpacity="0.4"
                              strokeDasharray="10 5"
                            />
                            <circle cx="150" cy="100" r="5" fill="#818cf8" fillOpacity="0.6" />
                          </g>
                          <g
                            className="animate-orbit-reverse"
                            style={{ transformOrigin: "100px 100px" }}
                          >
                            <circle
                              cx="100"
                              cy="100"
                              r="30"
                              fill="none"
                              stroke="#a5b4fc"
                              strokeWidth="1"
                              strokeOpacity="0.5"
                            />
                            <circle cx="70" cy="100" r="3" fill="#a5b4fc" fillOpacity="0.7" />
                          </g>
                          {/* Center point */}
                          <circle
                            cx="100"
                            cy="100"
                            r="6"
                            fill="#6366f1"
                            fillOpacity="0.8"
                            className="animate-breathe"
                          />
                        </svg>
                        <div className="relative text-center text-white z-10">
                          <span className="block text-3xl font-bold tracking-tight opacity-95">
                            {product.slug.split("-")[0]?.toUpperCase() || "DIGITAL"}
                          </span>
                          <span className="text-xs text-indigo-300 uppercase tracking-widest">
                            Rare Asset
                          </span>
                        </div>
                      </div>
                    )}
                    {/* Hover overlay with geometric accent */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex-grow">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {product.title}
                        </h3>
                        {product.availableStock && product.availableStock > 1 && (
                          <span className="shrink-0 px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg border border-indigo-100">
                            {product.availableStock}x
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 leading-relaxed line-clamp-2 text-sm">
                        {product.description || t("product.defaultDescription")}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between pt-5 border-t border-gray-100">
                      <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                          {t("home.priceIrd")}
                        </span>
                        <div className="text-xl font-bold text-gray-900">
                          Rp {product.priceIdr.toLocaleString("id-ID")}
                        </div>
                      </div>
                      {/* Animated arrow button */}
                      <div className="relative w-12 h-12 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 overflow-hidden">
                        {/* Orbiting accent on hover */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity">
                          <svg
                            className="w-full h-full animate-orbit-fast"
                            viewBox="0 0 48 48"
                            style={{ transformOrigin: "24px 24px" }}
                          >
                            <circle
                              cx="24"
                              cy="24"
                              r="18"
                              fill="none"
                              stroke="white"
                              strokeWidth="1"
                            />
                            <circle cx="42" cy="24" r="2" fill="white" />
                          </svg>
                        </div>
                        <svg
                          className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
