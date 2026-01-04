
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function MockPayButton({ orderId, amount }: { orderId: string, amount: number }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handlePay = async () => {
        if (!confirm(`Confirm Mock Payment of Rp ${amount}?`)) return;

        setLoading(true);
        try {
            const res = await fetch('/api/payment/mock/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });

            if (!res.ok) throw new Error('Payment failed');

            const data = await res.json();

            // Redirect to unlock page
            router.push(`/order/${orderId}`);
        } catch (error) {
            alert('Payment failed. Try again.');
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-green-700 transition"
        >
            {loading ? 'Processing...' : 'Pay Now (Mock)'}
        </button>
    );
}
