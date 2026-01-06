import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/70 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900 group-hover:text-indigo-600 transition-colors">
            AutoBeli
          </span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/admin"
            className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-indigo-500"></span>
            Admin Dashboard
          </Link>
        </nav>
      </div>
    </header>
  );
}
