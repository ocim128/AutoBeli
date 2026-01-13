"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { translations, Language } from "@/lib/i18n";

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

  // Memoize the translation function to prevent recreation on every render
  const t = useCallback(
    (path: string) => {
      const keys = path.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let current: any = translations[language];
      for (const key of keys) {
        if (current === undefined || current[key] === undefined) {
          // Fallback to defaults or English if missing
          return path;
        }
        current = current[key];
      }
      return current as string;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
