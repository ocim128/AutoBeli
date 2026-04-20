"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

/* ── Nav links ── */
const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/admin/products", label: "Products", icon: ProductsIcon },
  { href: "/admin/orders", label: "Orders", icon: OrdersIcon },
  { href: "/admin/audience", label: "Audience", icon: AudienceIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
] as const;

/* ──────────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/admin/login";

  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* verify session cookie via lightweight fetch */
  async function checkAuth() {
    try {
      const res = await fetch("/api/auth/check", { credentials: "include" });
      setAuthed(res.ok);
    } catch {
      setAuthed(false);
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  /* close sidebar on route change (mobile) */
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/login", { method: "DELETE", credentials: "include" });
    setAuthed(false);
    router.push("/admin/login");
    router.refresh();
  }

  /* ── Loading state ── */
  if (checking) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-[var(--background)]"
        role="status"
        aria-live="polite"
      >
        <svg
          className="h-5 w-5 animate-spin text-[var(--text-muted)]"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <span className="sr-only">Checking admin session</span>
      </main>
    );
  }

  /* ── Login page: no sidebar ── */
  if (isLoginPage) {
    return (
      <main
        id="main-content"
        className="flex min-h-screen items-center justify-center bg-[var(--background)]"
      >
        {children}
      </main>
    );
  }

  /* ── Not authenticated but not on login: just render children (pages redirect themselves) ── */
  if (!authed) {
    return (
      <main id="main-content" className="min-h-screen bg-[var(--background)]">
        {children}
      </main>
    );
  }

  /* ── Authenticated shell ── */
  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
            fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-[var(--line)]
            bg-[var(--panel)] transition-transform duration-200 ease-out
            lg:static lg:translate-x-0
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
      >
        {/* Brand */}
        <div className="flex h-14 items-center border-b border-[var(--line)] px-5">
          <span className="font-serif text-lg font-semibold tracking-tight text-[var(--foreground)]">
            AutoBeli
          </span>
          <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            admin
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pt-5 pb-3">
          <span className="block px-3 pb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">
            Navigation
          </span>
          <div className="space-y-0.5">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    group flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.8125rem] font-medium transition-colors
                    ${
                      active
                        ? "border-l-2 border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--foreground)]"
                        : "border-l-2 border-transparent text-[var(--text-muted)] hover:bg-[var(--panel-2)] hover:text-[var(--foreground)]"
                    }
                  `}
                >
                  <span
                    className={
                      active ? "text-[var(--accent)]" : "opacity-50 group-hover:opacity-80"
                    }
                  >
                    <Icon />
                  </span>
                  {label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="border-t border-[var(--line)] p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-[0.8125rem] font-medium text-[var(--text-muted)] transition-colors hover:bg-[var(--panel-2)] hover:text-[var(--danger)]"
          >
            <LogoutIcon />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-14 items-center gap-3 border-b border-[var(--line)] bg-[var(--panel)] px-4 lg:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--text-muted)] transition-colors hover:text-[var(--foreground)] lg:hidden"
            aria-label="Toggle sidebar"
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-mono text-[11px] tracking-wide text-[var(--text-muted)] hidden sm:inline">
            admin{pathname.replace("/admin", "") || "/dashboard"}
          </span>
        </header>

        {/* Page content */}
        <main id="main-content" className="flex-1 p-5 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Tiny inline SVG icons ── */
function DashboardIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      className="shrink-0"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function ProductsIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      className="shrink-0"
    >
      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
function OrdersIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      className="shrink-0"
    >
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function AudienceIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      className="shrink-0"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      className="shrink-0"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      viewBox="0 0 24 24"
      className="shrink-0"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
