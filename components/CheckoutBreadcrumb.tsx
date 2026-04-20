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
    <nav
      aria-label="Breadcrumb"
      className="mb-10 flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-[var(--text-muted)]"
    >
      <Link
        href="/"
        className="rounded-sm transition-colors duration-200 hover:text-[var(--accent)]"
      >
        {t("common.store")}
      </Link>
      <span aria-hidden="true" className="text-[var(--line-strong)]">
        /
      </span>
      <Link
        href={`/product/${productSlug}`}
        className="max-w-[200px] truncate rounded-sm transition-colors duration-200 hover:text-[var(--accent)]"
      >
        {productTitle}
      </Link>
      <span aria-hidden="true" className="text-[var(--line-strong)]">
        /
      </span>
      <span className="font-medium text-[var(--foreground)]">{t("checkout.title")}</span>
    </nav>
  );
}
