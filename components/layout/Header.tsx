import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-gray-200/50" />

      <div className="container mx-auto flex h-18 items-center justify-between px-4 py-4 relative">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
            <div className="relative w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-300 shadow-lg">
              <span className="text-white font-black text-lg">A</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors leading-none">
              AutoBeli
            </span>
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-none mt-0.5">
              Digital Store
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-2">
          {/* Recover Link */}
          <Link
            href="/recover"
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all"
          >
            <svg
              className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity"
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
            <span className="hidden sm:inline">Find My Order</span>
          </Link>

          {/* Browse Products Button */}
          <Link
            href="/#products"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <span className="hidden sm:inline">Browse</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Link>
        </nav>
      </div>
    </header>
  );
}
