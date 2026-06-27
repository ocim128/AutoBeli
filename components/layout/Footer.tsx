"use client";

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

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
            <p className="eyebrow-sm mt-2">{t("common.digitalStore")}</p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
              {t("common.secureAutomatedDigital")}
            </p>
          </div>

          <div className="space-y-4">
            <p className="eyebrow-sm">{t("common.navigation")}</p>
            <nav className="flex flex-col gap-3">
              <Link
                href="/#products"
                className="eyebrow-sm text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                {t("common.browse")}
              </Link>
              <Link
                href="/recover"
                className="eyebrow-sm text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
              >
                {t("common.findMyOrder")}
              </Link>
            </nav>
          </div>

          <div className="space-y-4">
            <p className="eyebrow-sm">{t("common.contact")}</p>
            <a
              href="https://wa.me/6287863442865"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 eyebrow-sm text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)]"
            >
              <WhatsAppIcon className="h-3 w-3" />
              {t("common.contactUs")}
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--line)] pt-5">
          <span className="eyebrow-sm inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[var(--success)]" />
            {t("common.securePayment")}
          </span>
          <span className="eyebrow-sm inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[var(--accent)]" />
            {t("common.instantDelivery")}
          </span>
          <span className="eyebrow-sm inline-flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[var(--warning)]" />
            {t("common.findMyOrder")}
          </span>
        </div>

        <div className="mt-6 border-t border-[var(--line)] pt-5">
          <p className="eyebrow-sm">
            &copy; {currentYear} AutoBeli. {t("common.allRightsReserved")}
          </p>
        </div>
      </div>
    </footer>
  );
}
