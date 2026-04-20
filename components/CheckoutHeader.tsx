"use client";

import { useLanguage } from "@/context/LanguageContext";
import { PageHeader } from "@/components/ui/page-header";

export default function CheckoutHeader() {
  const { t } = useLanguage();

  return (
    <PageHeader
      eyebrow={t("checkout.title")}
      title={t("checkout.completeOrder")}
      description={t("checkout.completeOrderDesc")}
      size="lg"
      className="mb-12"
    />
  );
}
