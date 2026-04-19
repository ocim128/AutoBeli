"use client";

import { PageHeader } from "@/components/ui/page-header";
import { useLanguage } from "@/context/LanguageContext";

export function ApiDocPageClient() {
  const { t } = useLanguage();

  return (
    <PageHeader
      eyebrow={t("apiDoc.eyebrow")}
      title={t("apiDoc.title")}
      description={t("apiDoc.description")}
    />
  );
}
