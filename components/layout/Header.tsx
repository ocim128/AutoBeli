"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

export function Header() {
  const { t, language, setLanguage } = useLanguage();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/#products", label: t("common.browse") },
    { href: "/recover", label: t("common.findMyOrder") },
  ];

  const isActive = (href: string) => {
    if (href === "/#products") return pathname === "/";
    return pathname === href;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[var(--background)]">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-4 md:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="group rounded-sm focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
        >
          <span className="flex flex-col">
            <span className="flex items-baseline gap-1.5">
              <span className="font-serif text-[1.35rem] font-semibold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
                AutoBeli
              </span>
              <span className="hidden h-1.5 w-1.5 rounded-full bg-[var(--accent)] sm:block" />
            </span>
            <span className="hidden font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)] md:block">
              {t("common.digitalStore")}
            </span>
          </span>
        </Link>

        {/* Desktop: Nav left, utilities right */}
        <div className="hidden items-center gap-3 md:flex">
          {/* Navigation links */}
          <nav
            className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1.5"
            aria-label="Main navigation"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2 rounded-sm",
                  isActive(link.href)
                    ? "bg-[var(--panel-2)] text-[var(--foreground)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                )}
              >
                {link.label}
                {/* Subtle active dot */}
                {isActive(link.href) && (
                  <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 h-[3px] w-[3px] rounded-full bg-[var(--accent)]" />
                )}
              </Link>
            ))}
          </nav>

          {/* Utility controls */}
          <div className="flex items-center gap-3 rounded-full border border-[var(--line)] bg-[var(--panel)] px-2 py-1.5">
            {/* Language Toggle */}
            <div className="flex items-center gap-0.5 rounded border border-[var(--line)] p-0.5">
              <button
                type="button"
                onClick={() => setLanguage("en")}
                aria-pressed={language === "en"}
                aria-label="English"
                className={cn(
                  "font-mono text-[11px] font-medium px-2 py-0.5 rounded-sm transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1",
                  language === "en"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                )}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage("id")}
                aria-pressed={language === "id"}
                aria-label="Bahasa Indonesia"
                className={cn(
                  "font-mono text-[11px] font-medium px-2 py-0.5 rounded-sm transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1",
                  language === "id"
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                )}
              >
                ID
              </button>
            </div>

            <ThemeToggle />
          </div>
        </div>

        {/* Mobile: Compact controls + Hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center gap-0.5 rounded border border-[var(--line)] p-0.5">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              aria-pressed={language === "en"}
              aria-label="English"
              className={cn(
                "font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-sm transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
                "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1",
                language === "en"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("id")}
              aria-pressed={language === "id"}
              aria-label="Bahasa Indonesia"
              className={cn(
                "font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-sm transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center",
                "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1",
                language === "id"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              ID
            </button>
          </div>

          <ThemeToggle compact />

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-sm text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-2"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sheet Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 border-[var(--line)] bg-[var(--panel)]">
          <div className="space-y-1">
            <SheetTitle className="font-serif text-lg font-semibold tracking-tight text-[var(--foreground)]">
              AutoBeli
            </SheetTitle>
            <p className="font-mono text-[0.58rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {t("common.digitalStore")}
            </p>
          </div>

          <nav className="flex flex-col gap-1 pt-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-3 text-sm font-mono uppercase tracking-[0.1em] rounded-sm transition-colors min-h-[44px] flex items-center",
                  "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1",
                  isActive(link.href)
                    ? "text-[var(--accent)] font-semibold"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 border-t border-[var(--line)] pt-5">
            <div className="mb-5">
              <ThemeToggle compact />
            </div>
            <p className="max-w-[15rem] text-sm leading-6 text-[var(--text-muted)]">
              {t("common.secureAutomatedDigital")}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
