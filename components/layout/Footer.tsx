
export function Footer() {
    return (
        <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
            <div className="container mx-auto py-6 px-4 text-center">
                <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} AutoBeli. All rights reserved.
                </p>
            </div>
        </footer>
    );
}
