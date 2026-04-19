"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--panel)] mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-baseline gap-1.5 group">
              <span className="font-serif text-lg font-semibold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                AutoBeli
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            </Link>
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              {t("common.digitalStore")}
            </p>
          </div>

          {/* Navigation Column */}
          <div>
            <h4 className="font-mono text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">
              {t("common.navigation")}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/#products"
                  className="font-sans text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {t("common.browse")}
                </Link>
              </li>
              <li>
                <Link
                  href="/recover"
                  className="font-sans text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  {t("common.findMyOrder")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h4 className="font-mono text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">
              {t("common.contact")}
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://wa.me/6287863442865"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-sm text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-2"
                >
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  {t("common.contactUs")}
                </a>
              </li>
            </ul>
          </div>

          {/* Trust Indicators Column */}
          <div>
            <h4 className="font-mono text-[10px] font-medium uppercase tracking-widest text-[var(--text-muted)] mb-3">
              {t("common.trust")}
            </h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  {t("common.securePayment")}
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  {t("common.instantDelivery")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <Separator className="my-6 bg-[var(--line)]" />
        <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="font-mono text-[10px] text-[var(--text-muted)]">
            &copy; {currentYear} AutoBeli. {t("common.allRightsReserved")}
          </p>
          <p className="font-mono text-[10px] text-[var(--text-muted)]">
            {t("common.secureAutomatedDigital")}
          </p>
        </div>
      </div>
    </footer>
  );
}
