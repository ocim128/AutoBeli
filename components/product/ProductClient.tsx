"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import BuyButton from "@/components/BuyButton";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { StatusBadge } from "@/components/ui/status-badge";
import { CornerFrame } from "@/components/ui/corner-frame";
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

  const inStock = !product.availableStock || product.availableStock > 0;
  const priceDisplay = product.priceIdr.toLocaleString("id-ID");

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-20 md:px-6">
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

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        <div className="min-w-0 space-y-8 lg:col-span-7">
          <Panel padding="sm" className="group overflow-hidden p-0">
            <div className="relative aspect-[16/10] bg-[var(--panel-2)]">
              {product.imageUrl ? (
                <LazyImage
                  src={product.imageUrl}
                  alt={product.title}
                  fill
                  objectFit="cover"
                  className="transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CornerFrame size="lg">
                    <span className="font-serif text-3xl text-[var(--text-muted)]">
                      {product.title}
                    </span>
                  </CornerFrame>
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <SectionEyebrow>{t("product.overview")}</SectionEyebrow>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-[var(--text-muted)]">
              {product.description || t("product.defaultDescription")}
            </p>
          </Panel>

          <Panel>
            <SectionEyebrow>{t("product.featuresLabel")}</SectionEyebrow>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)]/40 p-4"
                >
                  <span className="block font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    [{String(index + 1).padStart(2, "0")}]
                  </span>
                  <span className="mt-3 block font-serif text-sm text-[var(--foreground)]">
                    {feature.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">
                    {feature.desc}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className="sticky top-28">
            <Panel
              padding="lg"
              className="framed-panel overflow-hidden rounded-[14px] border-[var(--line-strong)] bg-[var(--panel)] p-6 md:p-7"
            >
              <div className="space-y-7">
                <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-5">
                  <StatusBadge status={inStock ? "success" : "error"}>
                    {inStock ? t("home.instantDeliveryActive") : t("common.soldOut")}
                  </StatusBadge>

                  {product.availableStock ? (
                    <div className="text-right">
                      <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {t("common.stock")}
                      </span>
                      <span className="mt-1 block font-mono text-sm text-[var(--foreground)]">
                        {product.availableStock}x {t("product.stockAvailable")}
                      </span>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="block font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {t("product.digitalAsset")}
                      </span>
                      <span className="mt-1 block font-mono text-sm text-[var(--foreground)]">
                        {t("common.ready")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <SectionEyebrow variant="accent">{t("common.payment")}</SectionEyebrow>
                  <h1 className="font-serif text-3xl leading-none text-[var(--foreground)] md:text-[2.6rem]">
                    {product.title}
                  </h1>
                  <p className="max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
                    {t("product.secureCopy")}
                  </p>
                </div>

                <CornerFrame size="md" color="var(--accent)">
                  <div className="rounded-[12px] border border-[var(--line)] bg-[var(--panel-2)]/90 p-5">
                    <span className="block font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                      {t("product.fullAccessPrice")}
                    </span>

                    <div className="mt-4 flex items-start gap-3">
                      <span className="mt-3 font-mono text-sm uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        Rp
                      </span>
                      <span className="font-serif text-[clamp(3.2rem,9vw,4.75rem)] leading-none tracking-[-0.05em] text-[var(--foreground)]">
                        {priceDisplay}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--line)] pt-3">
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        IDR
                      </span>
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {t("product.digitalAsset")}
                      </span>
                    </div>
                  </div>
                </CornerFrame>

                <BuyButton slug={product.slug} maxQuantity={product.availableStock || 1} />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
