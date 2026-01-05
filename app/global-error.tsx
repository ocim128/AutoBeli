'use client';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html>
            <body>
                <div className="flex h-screen flex-col items-center justify-center text-center px-4">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Critical Error!</h2>
                    <p className="text-gray-600 mb-8 max-w-lg">
                        A critical error occurred and the application cannot continue.
                    </p>
                    <button
                        onClick={() => reset()}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:bg-indigo-700"
                    >
                        Reload Application
                    </button>
                </div>
            </body>
        </html>
    );
}
