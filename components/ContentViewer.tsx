
'use client';

import { useState } from 'react';

export default function ContentViewer({ token }: { token: string }) {
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleReveal = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/delivery/${token}`);
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to unlock');

            setContent(data.content);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (content) {
            navigator.clipboard.writeText(content);
            alert('Copied to clipboard!');
        }
    };

    return (
        <div className="mt-8 bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
            <div className="bg-gray-900 px-6 py-4 flex items-center justify-between">
                <h3 className="text-white font-mono font-bold tracking-wider">SECURE_VAULT</h3>
                <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                </div>
            </div>

            <div className="p-8">
                {!content ? (
                    <div className="text-center py-10">
                        <div className="mb-6">
                            <svg className="mx-auto h-16 w-16 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Content Encrypted</h2>
                        <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                            You have valid access. Click below to decrypt and retrieve your digital product securely.
                        </p>
                        <button
                            onClick={handleReveal}
                            disabled={loading}
                            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition"
                        >
                            {loading ? 'Decrypting...' : 'Reveal Content'}
                        </button>
                        {error && <p className="text-red-600 mt-4">{error}</p>}
                    </div>
                ) : (
                    <div className="animate-fade-in relative">
                        <div className="absolute top-2 right-2">
                            <button
                                onClick={handleCopy}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded"
                            >
                                Copy
                            </button>
                        </div>
                        <pre className="bg-gray-50 p-6 rounded-lg font-mono text-sm text-gray-800 whitespace-pre-wrap break-all border overflow-x-auto max-h-[500px]">
                            {content}
                        </pre>
                        <div className="mt-4 text-center">
                            <p className="text-xs text-green-600 font-medium flex items-center justify-center">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Decrypted & Delivered via SSL
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
