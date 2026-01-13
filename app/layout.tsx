import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Performance: Prevent FOIT (Flash of Invisible Text)
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

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

// Separate viewport export for Next.js 15+
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Allow pinch-to-zoom for accessibility
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        {/* Preconnect to font providers for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS prefetch for WhatsApp API */}
        <link rel="dns-prefetch" href="https://wa.me" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-indigo-600 text-white px-4 py-2 rounded-md font-medium shadow-lg"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content" className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <WhatsAppButton />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
