"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Language } from "@/lib/i18n";
import { getTranslation } from "@/lib/optimizedI18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [language, setLanguage] = useState<Language>(() =>
    pathname?.startsWith("/admin") ? "en" : "id"
  );

  useEffect(() => {
    if (pathname?.startsWith("/admin") && language !== "en") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLanguage("en");
    }
  }, [pathname, language]);

  // Use memoized translation function with optimized O(1) lookups
  const t = useMemo(() => (path: string) => getTranslation(language, path), [language]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
