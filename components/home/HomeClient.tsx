"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { formatIDR } from "@/lib/format";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import LazyImage from "@/components/ui/lazy-image";

interface Product {
  slug: string;
  title: string;
  description?: string;
  imageUrl?: string;
  priceIdr: number;
  availableStock?: number;
}

function formatProductPreview(description?: string) {
  if (!description) return undefined;

  const circleMarker = String.fromCodePoint(0x2b55);
  const bulletMarker = String.fromCharCode(0x2022);

  return description
    .split(circleMarker)
    .join("")
    .split(bulletMarker)
    .join(" - ")
    .replace(/\s+/g, " ")
    .trim();
}

export function HomeClient({ products }: { products: Product[] }) {
  const { t } = useLanguage();

  const featuredProducts = products.slice(0, 3);
  const heroProduct = featuredProducts[0];
  const secondaryFeaturedProducts = featuredProducts.slice(1);
  const heroPreview = formatProductPreview(heroProduct?.description);

  return (
    <div className="space-y-16">
      <section className="relative mx-4 md:mx-6 lg:mx-8">
        <Panel featured padding="lg" className="relative overflow-hidden md:p-10 lg:px-12 lg:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at top left, var(--accent-soft), transparent 38%)",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-4 rounded-[22px] border border-[var(--line)] opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              backgroundPosition: "center",
            }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--accent) 18%, var(--accent) 82%, transparent 100%)",
            }}
          />

          <div className="relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.08fr)_380px] lg:items-start lg:gap-12">
            <div className="flex max-w-[42rem] flex-col gap-6">
              <SectionEyebrow variant="accent" className="text-[0.72rem] tracking-[0.16em]">
                {t("home.instantDeliveryActive")}
              </SectionEyebrow>

              <div className="space-y-5">
                <h1 className="max-w-[10ch] font-serif text-[clamp(3rem,7vw,5.75rem)] leading-[0.9] tracking-[-0.04em] text-[var(--foreground)]">
                  {t("home.digitalContent")}
                  <br />
                  <span className="text-[var(--accent)]">{t("home.instantAccess")}</span>
                </h1>

                <p className="max-w-xl text-[1rem] leading-8 text-[var(--text-muted)] md:text-[1.05rem]">
                  {t("home.heroDescription")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="#products"
                  className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 font-mono text-[0.72rem] uppercase tracking-[0.16em] text-primary-foreground shadow-[0_14px_34px_rgba(var(--accent-rgb),0.2)] transition-all hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  {t("common.browse")}
                </a>
                <span className="inline-flex h-11 items-center rounded-full border border-[var(--line)] bg-[var(--panel-2)] px-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[var(--foreground)]">
                  {products.length} {t("home.itemsLive")}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <TrustSignal icon="shield" label={t("common.securePayment")} />
                <TrustSignal icon="zap" label={t("common.instantDelivery")} />
                <TrustSignal icon="check" label={t("common.certifiedSecure")} />
              </div>
            </div>

            {heroProduct && (
              <div className="w-full max-w-[420px] justify-self-end">
                <Link
                  href={`/product/${heroProduct.slug}`}
                  className="group block rounded-[24px] border border-[var(--line-strong)] bg-[var(--panel)] p-4 shadow-[0_18px_40px_rgba(23,19,16,0.08)] transition-all hover:-translate-y-1 hover:border-[var(--accent)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                >
                  <div className="relative aspect-[4/4.6] overflow-hidden rounded-[18px] bg-[var(--panel-2)]">
                    {heroProduct.imageUrl ? (
                      <LazyImage
                        src={heroProduct.imageUrl}
                        alt={heroProduct.title}
                        fill
                        objectFit="cover"
                        className="transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col justify-between p-6">
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                          {t("common.digitalStore")}
                        </span>
                        <div className="space-y-3">
                          <span className="block max-w-[8ch] text-[2.2rem] font-medium uppercase leading-[0.9] tracking-[-0.035em] text-[var(--accent)] opacity-80">
                            {heroProduct.slug.split("-").slice(0, 2).join(" ").toUpperCase()}
                          </span>
                          <span className="block h-px w-16 bg-[var(--line-strong)]" />
                        </div>
                      </div>
                    )}

                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
                      <div className="space-y-2">
                        {heroProduct.availableStock !== undefined &&
                          heroProduct.availableStock > 0 && (
                            <span className="inline-flex items-center rounded-full border border-white/15 bg-black/35 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white/80 backdrop-blur-sm">
                              {heroProduct.availableStock}x {t("product.stockAvailable")}
                            </span>
                          )}
                        {heroProduct.availableStock === 0 && (
                          <span className="inline-flex items-center rounded-full border border-[var(--danger)]/45 bg-black/40 px-3 py-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                            {t("common.soldOut")}
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[1.35rem] leading-none tracking-[0.03em] tabular-nums text-white">
                        {formatIDR(heroProduct.priceIdr)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="line-clamp-2 text-[1.7rem] font-medium leading-[1.02] tracking-[-0.03em] text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                        {heroProduct.title}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm leading-7 text-[var(--text-muted)]">
                        {heroPreview || t("product.defaultDescription")}
                      </p>
                    </div>
                    <span className="eyebrow-sm shrink-0 pt-1">01</span>
                  </div>
                </Link>

                {secondaryFeaturedProducts.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    {secondaryFeaturedProducts.map((product, index) => (
                      <Link
                        key={product.slug}
                        href={`/product/${product.slug}`}
                        className="group flex items-center gap-3 rounded-[18px] border border-[var(--line)] bg-[var(--panel-2)] p-3 transition-all hover:border-[var(--line-strong)] hover:bg-[var(--panel)]"
                      >
                        <div className="relative size-14 shrink-0 overflow-hidden rounded-[12px] bg-[var(--panel-3)]">
                          {product.imageUrl ? (
                            <LazyImage
                              src={product.imageUrl}
                              alt={product.title}
                              fill
                              objectFit="cover"
                              className="transition-transform duration-300 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center px-2 text-center">
                              <span className="text-[0.72rem] font-medium uppercase leading-none tracking-[0.04em] text-[var(--accent)]">
                                {product.slug.split("-").slice(0, 2).join(" ").toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                            {product.title}
                          </span>
                          <span className="mt-1 block font-mono text-[0.92rem] leading-none tracking-[0.03em] tabular-nums text-[var(--text-muted)]">
                            {formatIDR(product.priceIdr)}
                          </span>
                        </div>
                        <span className="eyebrow-sm">{String(index + 2).padStart(2, "0")}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>
      </section>

      <section id="products" className="scroll-mt-24 space-y-8 px-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader
            eyebrow={t("common.products")}
            title={t("home.availableAssets")}
            description={t("home.curatedCollection")}
            titleAs="h2"
            size="default"
            className="max-w-2xl"
          />
          <span className="inline-flex h-10 shrink-0 items-center rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {products.length} {t("home.itemsLive")}
          </span>
        </div>

        {products.length === 0 ? (
          <EmptyState title={t("home.inventoryEmpty")} description={t("home.checkBack")} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function TrustSignal({ icon, label }: { icon: "shield" | "zap" | "check"; label: string }) {
  return (
    <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3.5 py-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
      {icon === "shield" && (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )}
      {icon === "zap" && (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )}
      {icon === "check" && (
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
      {label}
    </span>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguage();
  const inStock = product.availableStock === undefined || product.availableStock > 0;
  const preview = formatProductPreview(product.description);
  const slugFragments = product.slug.split("-").slice(0, 2).join(" ");
  const availabilityLabel =
    product.availableStock === undefined
      ? t("common.instantDelivery")
      : inStock
        ? `${product.availableStock}x ${t("product.stockAvailable")}`
        : t("common.soldOut");

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--panel)] shadow-[0_12px_28px_rgba(23,19,16,0.05)] transition-[transform,box-shadow,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-[var(--line-strong)] group-hover:shadow-[0_18px_40px_rgba(23,19,16,0.1)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.22)] dark:group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.34)]">
        <div className="relative aspect-[5/3] overflow-hidden border-b border-[var(--line)] bg-[var(--panel-2)]">
          {product.imageUrl ? (
            <LazyImage
              src={product.imageUrl}
              alt={product.title}
              fill
              objectFit="cover"
              className="transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col justify-between p-5">
              <span className="font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                {t("common.digitalStore")}
              </span>
              <div className="space-y-3">
                <span className="block max-w-[10ch] text-[1.9rem] font-medium uppercase leading-[0.9] tracking-[-0.035em] text-[var(--accent)] opacity-80">
                  {slugFragments.toUpperCase()}
                </span>
                <span className="block h-px w-14 bg-[var(--line-strong)]" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-4 p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <h3 className="line-clamp-2 min-w-0 flex-1 text-[1.38rem] font-medium leading-[1.02] tracking-[-0.03em] text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
              {product.title}
            </h3>
            <span
              className={[
                "eyebrow-sm shrink-0 rounded-full border px-3 py-1",
                inStock
                  ? "border-[var(--line)] bg-[var(--panel-2)]"
                  : "border-[var(--danger)]/35 bg-[var(--accent-soft)] !text-[var(--danger)]",
              ].join(" ")}
            >
              {availabilityLabel}
            </span>
          </div>

          <p className="line-clamp-3 flex-1 text-sm leading-7 text-[var(--text-muted)]">
            {preview || t("product.defaultDescription")}
          </p>

          <span className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--accent)] px-5 font-mono text-[1.05rem] leading-none tracking-[0.04em] tabular-nums text-[var(--accent-foreground)] shadow-[0_12px_30px_rgba(var(--accent-rgb),0.16)] transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_16px_34px_rgba(var(--accent-rgb),0.22)]">
            {formatIDR(product.priceIdr)}
          </span>
        </div>
      </div>
    </Link>
  );
}
