"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import BuyButton from "@/components/BuyButton";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { StatusBadge } from "@/components/ui/status-badge";
import LazyImage from "@/components/ui/LazyImage";
import type { SerializedProduct } from "@/lib/products";

export function ProductClient({
  product,
  paymentGateway,
}: {
  product: SerializedProduct;
  paymentGateway: "MOCK" | "PAKASIR";
}) {
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
  const slugMark = product.slug.split("-").slice(0, 2).join(" ").toUpperCase();
  const stockLabel =
    product.availableStock === undefined
      ? t("common.ready")
      : inStock
        ? `${product.availableStock}x ${t("product.stockAvailable")}`
        : t("common.soldOut");
  const trustItems = [t("common.securePayment"), t("common.instantDelivery"), stockLabel];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 pb-20 md:px-6">
      <div className="space-y-5 pt-1">
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

        <div className="max-w-4xl space-y-4">
          <SectionEyebrow variant="accent">
            {inStock ? t("home.instantDeliveryActive") : t("common.soldOut")}
          </SectionEyebrow>
          <h1 className="max-w-[13ch] font-serif text-[clamp(2.85rem,7vw,5.1rem)] leading-[0.94] tracking-[-0.045em] text-[var(--foreground)]">
            {product.title}
          </h1>
          <p className="max-w-2xl text-[1rem] leading-8 text-[var(--text-muted)] md:text-[1.05rem]">
            {t("product.secureCopy")}
          </p>
          <div className="flex flex-wrap gap-2">
            {trustItems.map((item) => (
              <span
                key={item}
                className="inline-flex min-h-10 items-center rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-[var(--text-muted)]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          <Panel featured padding="sm" className="group overflow-hidden p-0">
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
                  <div className="flex w-full max-w-lg flex-col gap-6 px-8 py-10 text-left">
                    <span className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                      {t("common.digitalStore")}
                    </span>
                    <div className="space-y-4">
                      <span className="block max-w-[10ch] font-serif text-[2.8rem] leading-[0.92] tracking-[-0.04em] text-[var(--foreground)] sm:text-[3.4rem]">
                        {product.title}
                      </span>
                      <span className="block h-px w-20 bg-[var(--line-strong)]" />
                    </div>
                    <span className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[var(--accent)]">
                      {slugMark}
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/18 via-black/6 to-transparent dark:from-black/40 dark:via-black/12" />
              <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-4">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-black/12 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/88 backdrop-blur-sm dark:bg-black/35">
                  {t("product.digitalAsset")}
                </span>
                <span className="inline-flex items-center rounded-full border border-white/20 bg-black/12 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/88 backdrop-blur-sm dark:bg-black/35">
                  {stockLabel}
                </span>
              </div>
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
            <Panel className="space-y-4">
              <SectionEyebrow>{t("product.overview")}</SectionEyebrow>
              <p className="whitespace-pre-line text-[0.96rem] leading-8 text-[var(--text-muted)]">
                {product.description || t("product.defaultDescription")}
              </p>
            </Panel>

            <Panel className="space-y-5">
              <SectionEyebrow variant="accent">{t("product.featuresLabel")}</SectionEyebrow>
              <div className="grid gap-3">
                {features.map((feature, index) => (
                  <div
                    key={feature.title}
                    className="rounded-[14px] border border-[var(--line)] bg-[var(--panel-2)] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <span className="block text-sm font-medium text-[var(--foreground)]">
                          {feature.title}
                        </span>
                        <span className="block text-xs leading-6 text-[var(--text-muted)]">
                          {feature.desc}
                        </span>
                      </div>
                      <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <div className="sticky top-28">
            <Panel featured padding="lg" className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
                    {t("product.fullAccessPrice")}
                  </span>
                  <StatusBadge status={inStock ? "success" : "error"}>
                    {inStock ? t("home.instantDeliveryActive") : t("common.soldOut")}
                  </StatusBadge>
                </div>
                <div className="flex items-end gap-2">
                  <span className="pb-2 font-mono text-sm uppercase tracking-[0.12em] text-[var(--text-muted)]">
                    Rp
                  </span>
                  <span className="font-serif text-[clamp(3rem,7vw,4.35rem)] leading-none tracking-[-0.05em] tabular-nums text-[var(--foreground)]">
                    {priceDisplay}
                  </span>
                </div>
                <p className="text-sm leading-7 text-[var(--text-muted)]">
                  {t("product.secureCopy")}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <PurchaseDetail label={t("common.stock")} value={stockLabel} />
                <PurchaseDetail
                  label={t("common.instantDelivery")}
                  value={inStock ? t("home.instantDeliveryActive") : t("common.soldOut")}
                />
                <PurchaseDetail
                  label={t("common.securePayment")}
                  value={paymentGateway === "PAKASIR" ? "Pakasir" : "Mock"}
                />
                <PurchaseDetail
                  label={t("product.digitalAsset")}
                  value={inStock ? t("common.ready") : t("common.soldOut")}
                />
              </div>

              <div className="border-t border-[var(--line)] pt-6">
                <BuyButton
                  slug={product.slug}
                  maxQuantity={inStock ? product.availableStock || 1 : 0}
                  paymentGateway={paymentGateway}
                />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--line)] bg-[var(--panel)] px-4 py-3">
      <span className="block font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className="mt-1.5 block text-sm text-[var(--foreground)]">{value}</span>
    </div>
  );
}
