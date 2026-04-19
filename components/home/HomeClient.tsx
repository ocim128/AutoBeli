"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Panel } from "@/components/ui/panel";
import { SectionEyebrow } from "@/components/ui/section-eyebrow";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CornerFrame } from "@/components/ui/corner-frame";
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

  return (
    <div className="space-y-20 pb-28 md:pb-24">
      <section className="grid-bg relative mx-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-6 py-24 md:mx-6 md:px-12 lg:mx-8">
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          <SectionEyebrow variant="accent">{t("home.instantDeliveryActive")}</SectionEyebrow>

          <h1 className="font-serif text-4xl leading-tight text-[var(--foreground)] md:text-5xl lg:text-6xl">
            {t("home.digitalContent")}
            <br />
            <span className="text-[var(--accent)]">{t("home.instantAccess")}</span>
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-[var(--text-muted)]">
            {t("home.heroDescription")}
          </p>

          <a
            href="#products"
            className="mt-2 inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 font-mono text-sm uppercase tracking-wider text-primary-foreground transition-all hover:bg-primary/80"
          >
            {t("common.browse")}
          </a>
        </div>
      </section>

      <section id="products" className="scroll-mt-24 space-y-10 px-4 md:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <PageHeader
            eyebrow={t("common.products")}
            title={t("home.availableAssets")}
            description={t("home.curatedCollection")}
            titleAs="h2"
          />
          <span className="shrink-0 font-mono text-xs tracking-wider text-[var(--text-muted)]">
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

function ProductCard({ product }: { product: Product }) {
  const { t } = useLanguage();
  const inStock = !product.availableStock || product.availableStock > 0;
  const preview = formatProductPreview(product.description);

  return (
    <Link href={`/product/${product.slug}`} className="group block h-full">
      <Panel
        padding="sm"
        className="flex h-full flex-col overflow-hidden p-0 transition-colors hover:border-[var(--line-strong)]"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-[var(--panel-2)]">
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
              <CornerFrame size="md">
                <span className="font-mono text-lg uppercase tracking-[0.2em] text-[var(--foreground)]/70">
                  {product.slug.split("-")[0]?.toUpperCase() || "DIGITAL"}
                </span>
              </CornerFrame>
            </div>
          )}

          <div className="absolute right-3 top-3">
            <StatusBadge status={inStock ? "success" : "error"}>
              {inStock ? t("home.instantDeliveryActive") : t("common.soldOut")}
            </StatusBadge>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          <span className="font-mono text-xs tracking-wider text-[var(--text-muted)]">
            IDR {product.priceIdr.toLocaleString("id-ID")}
          </span>

          <h3 className="line-clamp-1 font-serif text-lg leading-snug text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
            {product.title}
          </h3>

          <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
            {preview || t("product.defaultDescription")}
          </p>

          {product.availableStock && product.availableStock > 1 && (
            <span className="font-mono text-xs tracking-wider text-[var(--text-muted)]">
              {product.availableStock}x {t("product.stockAvailable")}
            </span>
          )}

          <span className="mt-2 inline-flex h-7 w-full items-center justify-center rounded-lg border border-[var(--line)] bg-background px-2.5 font-mono text-xs uppercase tracking-wider text-[var(--foreground)] transition-colors hover:bg-[var(--muted)]">
            {t("common.browse")}
          </span>
        </div>
      </Panel>
    </Link>
  );
}
