"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--line)] bg-[var(--panel)]">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.8fr)]">
          <div className="max-w-sm">
            <Link href="/" className="group inline-flex items-baseline gap-1.5">
              <span className="font-serif text-xl font-semibold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                AutoBeli
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            </Link>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {t("common.digitalStore")}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
              {t("common.secureAutomatedDigital")}
            </p>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {t("common.navigation")}
            </p>
            <nav className="flex flex-col gap-3">
              <Link
                href="/#products"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                {t("common.browse")}
              </Link>
              <Link
                href="/recover"
                className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                {t("common.findMyOrder")}
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {t("common.contact")}
            </p>
            <a
              href="https://wa.me/6287863442865"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t("common.contactUs")}
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--line)] pt-5">
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="h-1 w-1 rounded-full bg-[var(--success)]" />
            {t("common.securePayment")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            {t("common.instantDelivery")}
          </span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
            {t("common.findMyOrder")}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
          <p className="font-mono text-[10px] text-[var(--text-muted)] opacity-70">
            &copy; {currentYear} AutoBeli. {t("common.allRightsReserved")}
          </p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/#products"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              {t("common.browse")}
            </Link>
            <Link
              href="/recover"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              {t("common.findMyOrder")}
            </Link>
            <a
              href="https://wa.me/6287863442865"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              {t("common.contactUs")}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
