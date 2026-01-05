'use client';

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center px-4">
            <div className="bg-red-50 p-6 rounded-2xl max-w-md w-full border border-red-100 shadow-sm">
                <h2 className="text-2xl font-bold text-red-700 mb-2">Something went wrong!</h2>
                <p className="text-red-600 mb-6">
                    We encountered an unexpected error while processing your request.
                    {error.digest && <span className="block mt-2 text-xs opacity-70 font-mono">Reference: {error.digest}</span>}
                </p>
                <button
                    onClick={
                        // Attempt to recover by trying to re-render the segment
                        () => reset()
                    }
                    className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
