
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const res = await fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ password }),
            headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
            router.push('/admin/dashboard');
            router.refresh();
        } else {
            setError('Invalid password');
        }
    };

    return (
        <div className="flex h-[80vh] items-center justify-center">
            <div className="w-full max-w-sm rounded-lg border bg-white p-6 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-bold">Admin Access</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="Enter Admin Password"
                            className="w-full rounded-md border p-2 text-black"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <button
                        type="submit"
                        className="w-full rounded-md bg-black py-2 text-white hover:bg-gray-800"
                    >
                        Unlock
                    </button>
                </form>
            </div>
        </div>
    );
}
