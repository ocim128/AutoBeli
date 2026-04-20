"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import LazyImage from "@/components/ui/LazyImage";

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

  return (
    <div className="space-y-20 pb-28 md:pb-24">
      {/* ── Hero Section ─────────────────────────────── */}
      <section className="relative mx-4 md:mx-6 lg:mx-8">
        <Panel featured padding="xl" className="relative overflow-hidden">
          {/* Grid frame — only as a border accent, not behind content */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-3 rounded-lg border border-[var(--line)] opacity-40"
            style={{
              backgroundImage:
                "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              backgroundPosition: "center",
            }}
          />

          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-12">
            {/* Left: headline + CTA */}
            <div className="flex flex-1 flex-col items-center gap-5 text-center lg:items-start lg:text-left">
              <SectionEyebrow variant="accent">{t("home.instantDeliveryActive")}</SectionEyebrow>

              <h1 className="font-serif text-4xl leading-tight text-[var(--foreground)] md:text-5xl lg:text-[3.5rem]">
                {t("home.digitalContent")}
                <br />
                <span className="text-[var(--accent)]">{t("home.instantAccess")}</span>
              </h1>

              <p className="max-w-md text-base leading-relaxed text-[var(--text-muted)]">
                {t("home.heroDescription")}
              </p>

              <a
                href="#products"
                className="mt-1 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-mono text-sm uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/90"
              >
                {t("common.browse")}
              </a>

              {/* Trust signals */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:justify-start">
                <TrustSignal icon="shield" label={t("common.securePayment")} />
                <TrustSignal icon="zap" label={t("common.instantDelivery")} />
                <TrustSignal icon="check" label={t("common.certifiedSecure")} />
              </div>

              {featuredProducts.length > 0 && (
                <div className="flex w-full gap-3 overflow-x-auto pt-2 lg:hidden">
                  {featuredProducts.map((product) => (
                    <Link
                      key={product.slug}
                      href={`/product/${product.slug}`}
                      className="min-w-[220px] rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-3 text-left transition-colors hover:border-[var(--line-strong)]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-[var(--panel-3)]">
                          {product.imageUrl ? (
                            <LazyImage
                              src={product.imageUrl}
                              alt={product.title}
                              fill
                              objectFit="cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center">
                              <span className="font-serif text-[0.6rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                                {product.slug.split("-").slice(0, 2).join(" ").toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                            {product.title}
                          </span>
                          <span className="font-serif text-sm text-[var(--text-muted)]">
                            Rp {product.priceIdr.toLocaleString("id-ID")}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Right: featured product strip */}
            {featuredProducts.length > 0 && (
              <div className="hidden w-full max-w-[280px] shrink-0 flex-col gap-3 pt-2 lg:flex">
                {featuredProducts.map((product, i) => (
                  <Link
                    key={product.slug}
                    href={`/product/${product.slug}`}
                    className="group/card-strip flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-2.5 transition-all hover:border-[var(--line-strong)] hover:shadow-sm"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-[var(--panel-3)]">
                      {product.imageUrl ? (
                        <LazyImage
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          objectFit="cover"
                          className="transition-transform duration-300 group-hover/card-strip:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center">
                          <span className="font-serif text-[0.65rem] font-medium uppercase leading-none text-[var(--text-muted)]">
                            {product.slug.split("-").slice(0, 2).join(" ").toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium leading-snug text-[var(--foreground)] transition-colors group-hover/card-strip:text-[var(--accent)]">
                        {product.title}
                      </span>
                      <span className="font-serif text-sm tabular-nums text-[var(--text-muted)]">
                        Rp {product.priceIdr.toLocaleString("id-ID")}
                      </span>
                    </div>
                    <span className="font-mono text-[0.6rem] text-[var(--text-muted)]">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Panel>
      </section>

      {/* ── Product Grid ─────────────────────────────── */}
      <section id="products" className="scroll-mt-24 space-y-10 px-4 md:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <PageHeader
            eyebrow={t("common.products")}
            title={t("home.availableAssets")}
            description={t("home.curatedCollection")}
            titleAs="h2"
            size="lg"
          />
          <span className="shrink-0 font-mono text-xs tracking-wider text-[var(--text-muted)]">
            {products.length} {t("home.itemsLive")}
          </span>
        </div>

        {products.length === 0 ? (
          <EmptyState title={t("home.inventoryEmpty")} description={t("home.checkBack")} />
        ) : (
          <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Trust Signal (inline SVG icons, no deps) ──── */

function TrustSignal({ icon, label }: { icon: "shield" | "zap" | "check"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.08em] text-[var(--text-muted)]">
      {icon === "shield" && (
        <svg
          width="12"
          height="12"
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
          width="12"
          height="12"
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
          width="12"
          height="12"
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

/* ── Product Card ──────────────────────────────── */

function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguage();
  const inStock = product.availableStock === undefined || product.availableStock > 0;
  const preview = formatProductPreview(product.description);
  const slugFragments = product.slug.split("-").slice(0, 2).join(" ");

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--panel)] transition-[transform,box-shadow,border-color] duration-300 group-hover:-translate-y-0.5 group-hover:border-[var(--line-strong)] group-hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]">
        {/* ── Image / Typographic Poster ── */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--panel-3)]">
          {product.imageUrl ? (
            <LazyImage
              src={product.imageUrl}
              alt={product.title}
              fill
              objectFit="cover"
              className="transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6">
              {/* Decorative lines */}
              <span aria-hidden="true" className="h-px w-8 bg-[var(--line-strong)]" />
              <span className="font-serif text-2xl font-medium leading-tight tracking-tight text-[var(--text-muted)] md:text-3xl">
                {slugFragments.toUpperCase()}
              </span>
              <span aria-hidden="true" className="h-px w-8 bg-[var(--line-strong)]" />
            </div>
          )}

          {/* Stock badge — minimal, top-right */}
          {!inStock && (
            <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[0.6rem] font-medium uppercase tracking-[0.1em] border border-[var(--danger)]/35 text-[var(--danger)] bg-[var(--panel)]/80 backdrop-blur-sm">
              <span
                className="inline-block size-1 rounded-full bg-[var(--danger)]"
                aria-hidden="true"
              />
              {t("common.soldOut")}
            </span>
          )}
        </div>

        {/* ── Card body ── */}
        <div className="flex flex-1 flex-col gap-2 p-5">
          {/* Price — prominent */}
          <span className="font-serif text-xl tabular-nums leading-none text-[var(--foreground)]">
            Rp {product.priceIdr.toLocaleString("id-ID")}
          </span>

          {/* Title */}
          <h3 className="line-clamp-1 text-sm font-medium leading-snug text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
            {product.title}
          </h3>

          {/* Description — 2 lines max */}
          <p className="line-clamp-2 flex-1 text-[0.8rem] leading-relaxed text-[var(--text-muted)]">
            {preview || t("product.defaultDescription")}
          </p>

          {/* Stock count — subtle mono */}
          {product.availableStock && product.availableStock > 1 && (
            <span className="font-mono text-[0.65rem] tracking-wider text-[var(--text-muted)]">
              {product.availableStock}x {t("product.stockAvailable")}
            </span>
          )}

          {/* CTA button */}
          <span className="mt-2 inline-flex h-8 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--panel-2)] font-mono text-[0.7rem] uppercase tracking-[0.08em] text-[var(--foreground)] transition-colors group-hover:border-[var(--accent)] group-hover:bg-[var(--accent)]/5 group-hover:text-[var(--accent)]">
            {t("common.browse")}
          </span>
        </div>
      </div>
    </Link>
  );
}
