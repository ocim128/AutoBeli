import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} AutoBeli. All rights reserved.
          </p>
          <Link
            href="/recover"
            className="text-sm text-gray-500 hover:text-indigo-600 transition-colors font-medium"
          >
            Lost your purchase? Recover it here →
          </Link>
        </div>
      </div>
    </footer>
  );
}
