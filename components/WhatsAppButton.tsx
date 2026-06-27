"use client";

import { useLanguage } from "@/context/LanguageContext";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

export function WhatsAppButton() {
  const { t } = useLanguage();

  return (
    <div className="fixed bottom-5 right-5 z-40 md:bottom-6 md:right-6">
      <a
        href="https://wa.me/6287863442865"
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 rounded-[14px] border border-[#1fa855] bg-[#25D366] px-3.5 py-2.5 shadow-[0_10px_24px_rgba(37,211,102,0.22)] transition-all hover:bg-[#1ebe5a] hover:shadow-[0_14px_30px_rgba(37,211,102,0.3)]"
        aria-label={t("common.contactUs")}
      >
        <WhatsAppIcon className="size-[1.125rem] shrink-0 text-white transition-colors" />
        <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-white transition-colors xl:inline">
          {t("common.chatWhatsApp")}
        </span>
      </a>
    </div>
  );
}
