"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import BuyButton from "@/components/BuyButton";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { StatusBadge } from "@/components/ui/status-badge";
import LazyImage from "@/components/ui/LazyImage";
import type { SerializedProduct } from "@/lib/products";

export function ProductClient({ product }: { product: SerializedProduct }) {
  const { t } = useLanguage();

  const features = [
    {
      title: t("product.features.instantAccess"),
      desc: t("product.features.instantAccessDesc"),
    },
    {
      title: t("product.features.secureEncryption"),
      desc: t("product.features.secureEncryptionDesc"),
    },
    {
      title: t("product.features.permanentLink"),
      desc: t("product.features.permanentLinkDesc"),
    },
    {
      title: t("product.features.supportIncluded"),
      desc: t("product.features.supportIncludedDesc"),
    },
  ];

  const inStock = product.availableStock === undefined || product.availableStock > 0;
  const priceDisplay = product.priceIdr.toLocaleString("id-ID");

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 md:px-6">
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]"
      >
        <Link href="/" className="transition-colors hover:text-[var(--accent)]">
          {t("common.store")}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[var(--text-muted)]">{t("common.products")}</span>
        <span aria-hidden="true">/</span>
        <span className="max-w-[200px] truncate text-[var(--foreground)]">{product.title}</span>
      </nav>

      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
        {/* ── Left column: media + content ── */}
        <div className="min-w-0 space-y-10 lg:col-span-7">
          {/* Product image or typographic poster */}
          <Panel padding="sm" className="group overflow-hidden p-0">
            <div className="relative aspect-[16/10] bg-[var(--panel-2)]">
              {product.imageUrl ? (
                <LazyImage
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  objectFit="cover"
                  className="transition-transform duration-700 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-[var(--panel-3)]">
                  <div className="flex flex-col items-center gap-3 px-8 text-center">
                    <span
                      aria-hidden="true"
                      className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[var(--text-muted)]"
                    >
                      &#x2015;&#x2015;
                    </span>
                    <span className="font-serif text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">
                      {product.title}
                    </span>
                    <span
                      aria-hidden="true"
                      className="font-mono text-[0.6rem] uppercase tracking-[0.22em] text-[var(--text-muted)]"
                    >
                      &#x2015;&#x2015;
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Panel>

          {/* Overview */}
          <Panel>
            <SectionEyebrow>{t("product.overview")}</SectionEyebrow>
            <p className="mt-4 whitespace-pre-line font-serif text-[0.92rem] leading-[1.75] text-[var(--text-muted)]">
              {product.description || t("product.defaultDescription")}
            </p>
          </Panel>

          {/* Features */}
          <Panel>
            <SectionEyebrow variant="accent">{t("product.featuresLabel")}</SectionEyebrow>
            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)]/40 p-5"
                >
                  <span className="block font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-3 block font-serif text-sm leading-snug text-[var(--foreground)]">
                    {feature.title}
                  </span>
                  <span className="mt-1.5 block text-xs leading-relaxed text-[var(--text-muted)]">
                    {feature.desc}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── Right column: sticky purchase brief ── */}
        <div className="min-w-0 lg:col-span-5">
          <div className="sticky top-28">
            <Panel featured padding="lg" className="space-y-7">
              {/* Product title */}
              <div>
                <h1 className="font-serif text-2xl leading-snug text-[var(--foreground)] md:text-3xl">
                  {product.title}
                </h1>
                <p className="mt-2 max-w-md text-[0.8rem] leading-relaxed text-[var(--text-muted)]">
                  {t("product.secureCopy")}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--line)]" />

              {/* Price block */}
              <div className="space-y-2">
                <span className="block font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {t("product.fullAccessPrice")}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-sm uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Rp
                  </span>
                  <span className="font-serif text-[clamp(2.8rem,7vw,4rem)] leading-none tracking-[-0.04em] tabular-nums text-[var(--foreground)]">
                    {priceDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    IDR
                  </span>
                  <span className="text-[var(--line)]" aria-hidden="true">
                    ·
                  </span>
                  <span className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {t("product.digitalAsset")}
                  </span>
                </div>
              </div>

              {/* Stock status */}
              <div className="flex items-center justify-between gap-4">
                <StatusBadge status={inStock ? "success" : "error"}>
                  {inStock ? t("home.instantDeliveryActive") : t("common.soldOut")}
                </StatusBadge>

                {product.availableStock ? (
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {product.availableStock}x {t("product.stockAvailable")}
                  </span>
                ) : (
                  <span className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {t("common.ready")}
                  </span>
                )}
              </div>

              {/* Divider */}
              <div className="border-t border-[var(--line)]" />

              {/* Buy action */}
              <BuyButton slug={product.slug} maxQuantity={product.availableStock || 1} />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
