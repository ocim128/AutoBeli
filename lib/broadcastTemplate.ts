const DEFAULT_BASE_URL = "http://localhost:3000";

function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export function buildProductUrl(slug: string): string {
  return `${getBaseUrl()}/product/${slug}`;
}

export function buildProductBroadcastSubject(productTitle: string): string {
  return `Baru tersedia: ${productTitle}`;
}

export function buildProductBroadcastBody(params: {
  productTitle: string;
  teaser: string;
  productSlug: string;
}): string {
  return [
    "Halo,",
    "",
    `${params.productTitle} baru saja tersedia.`,
    "",
    params.teaser.trim(),
    "",
    "Lihat detailnya di sini:",
    buildProductUrl(params.productSlug),
    "",
    "Kalau cocok, langsung cek sekarang.",
  ].join("\n");
}
