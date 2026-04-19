import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-[var(--accent-foreground)] focus:shadow-lg"
      >
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="pb-16 md:pb-20">
        {children}
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
