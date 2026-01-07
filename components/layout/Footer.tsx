import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-gray-100 bg-gradient-to-b from-gray-50 to-white mt-auto overflow-hidden">
      {/* Subtle decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="container mx-auto py-12 px-4 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          {/* Logo & Copyright */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-indigo-500/20">
                <span className="text-white font-black text-lg">A</span>
              </div>
              <span className="text-lg font-black tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
                AutoBeli
              </span>
            </Link>
            <p className="text-sm text-gray-400 font-medium">
              © {currentYear} AutoBeli. All rights reserved.
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/recover"
              className="group flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition-all font-medium"
            >
              <svg
                className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span>Find My Order</span>
            </Link>
            <span className="w-px h-4 bg-gray-200 hidden sm:block" />
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
            >
              Browse Products
            </Link>
          </nav>

          {/* Trust Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/80 rounded-full">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Secure
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100/80 rounded-full">
              <svg
                className="w-4 h-4 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
                Instant
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
