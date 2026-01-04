
import Link from 'next/link';

export function Header() {
    return (
        <header className="border-b border-gray-200 bg-white shadow-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="text-xl font-bold text-gray-900">
                    AutoBeli
                </Link>
                <nav>
                    {/* Placeholder for future nav items */}
                    <span className="text-sm text-gray-500">Phase 2 Skeleton</span>
                </nav>
            </div>
        </header>
    );
}
