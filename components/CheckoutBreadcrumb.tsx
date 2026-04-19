"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function CheckoutBreadcrumb({
  productSlug,
  productTitle,
}: {
  productSlug: string;
  productTitle: string;
}) {
  const { t } = useLanguage();

  return (
    <nav className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-[var(--text-muted)] mb-8">
      <Link href="/" className="hover:text-[var(--accent)] transition-colors">
        {t("common.store")}
      </Link>
      <span aria-hidden="true">/</span>
      <Link
        href={`/product/${productSlug}`}
        className="hover:text-[var(--accent)] transition-colors truncate max-w-[200px]"
      >
        {productTitle}
      </Link>
      <span aria-hidden="true">/</span>
      <span className="text-[var(--foreground)]">{t("checkout.title")}</span>
    </nav>
  );
}
