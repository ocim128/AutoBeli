
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function BuyButton({ slug, priceIdr }: { slug: string, priceIdr: number }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleBuy = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ slug }),
            });

            if (!res.ok) throw new Error('Failed to create order');

            const data = await res.json();
            router.push(`/checkout/${data.orderId}`);
        } catch (error) {
            alert('Error creating order. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="pt-4">
            <button
                onClick={handleBuy}
                disabled={loading}
                className="w-full bg-gray-900 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg hover:bg-indigo-600 hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
                {loading ? 'Processing...' : `Beli Sekarang - Rp ${priceIdr.toLocaleString('id-ID')}`}
            </button>
            <p className="text-center text-sm text-gray-400 mt-4">
                Instant digital delivery via secure token.
            </p>
        </div>
    );
}
