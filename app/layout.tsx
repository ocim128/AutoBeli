import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Cormorant_Garamond } from "next/font/google";
import { IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

/* ── Fonts ─────────────────────────────────── */

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  preload: true,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: true,
});

/* ── Metadata ──────────────────────────────── */

export const metadata: Metadata = {
  title: "AutoBeli - Digital Text Store",
  description: "Secure, instant digital content delivery.",
  keywords: ["digital", "store", "content", "instant", "delivery", "Indonesia"],
  authors: [{ name: "AutoBeli" }],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "AutoBeli - Digital Text Store",
    description: "Secure, instant digital content delivery.",
    type: "website",
    locale: "id_ID",
    siteName: "AutoBeli",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3ede0" },
    { media: "(prefers-color-scheme: dark)", color: "#090909" },
  ],
};

/* ── Root Layout ───────────────────────────── */

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${cormorantGaramond.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded-md bg-[var(--accent)] px-4 py-2 font-medium text-[var(--accent-foreground)] shadow-lg"
          >
            Skip to content
          </a>
          {children}
        </Providers>
      </body>
    </html>
  );
}
