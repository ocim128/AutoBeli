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
    <header className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[var(--panel)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-1.5 group">
          <span className="font-serif text-xl font-semibold tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--accent)]">
            AutoBeli
          </span>
          <span className="hidden h-1.5 w-1.5 rounded-full bg-[var(--accent)] sm:block" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "font-sans text-sm tracking-wide transition-colors",
                isActive(link.href)
                  ? "text-[var(--accent)]"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              )}
            >
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <span className="h-4 w-px bg-[var(--line)]" />

          {/* Language Toggle */}
          <div className="flex items-center gap-0.5 rounded border border-[var(--line)] p-0.5">
            <button
              onClick={() => setLanguage("en")}
              className={cn(
                "font-mono text-[11px] font-medium px-2 py-0.5 rounded-sm transition-colors",
                language === "en"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("id")}
              className={cn(
                "font-mono text-[11px] font-medium px-2 py-0.5 rounded-sm transition-colors",
                language === "id"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
              )}
            >
              ID
            </button>
          </div>

          <ThemeToggle />
        </nav>

        {/* Mobile: Language + Hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <div className="flex items-center gap-0.5 rounded border border-[var(--line)] p-0.5">
            <button
              onClick={() => setLanguage("en")}
              className={cn(
                "font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-sm transition-colors",
                language === "en"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                  : "text-[var(--text-muted)]"
              )}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("id")}
              className={cn(
                "font-mono text-[10px] font-medium px-1.5 py-0.5 rounded-sm transition-colors",
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
            onClick={() => setMobileOpen(true)}
            className="text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="bg-[var(--panel)] border-[var(--line)] w-72">
          <SheetTitle className="font-serif text-lg text-[var(--foreground)]">AutoBeli</SheetTitle>

          <nav className="flex flex-col gap-1 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "block px-3 py-2.5 text-sm font-sans tracking-wide rounded-sm transition-colors",
                  isActive(link.href)
                    ? "text-[var(--accent)] bg-[var(--accent-soft)]"
                    : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--panel-2)]"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 border-t border-[var(--line)] pt-4">
            <div className="mb-4">
              <ThemeToggle compact />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              {t("common.digitalStore")}
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
