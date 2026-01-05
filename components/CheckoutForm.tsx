'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CheckoutFormProps {
    orderId: string;
    amount: number;
}

export default function CheckoutForm({ orderId, amount }: CheckoutFormProps) {
    const [contact, setContact] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!contact.trim()) {
            setError('Please enter your email or WhatsApp number');
            return;
        }

        setLoading(true);
        try {
            // Save contact info
            const contactRes = await fetch('/api/orders', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, contact: contact.trim() }),
            });

            if (!contactRes.ok) {
                const data = await contactRes.json();
                throw new Error(data.error || 'Failed to save contact');
            }

            // Process mock payment
            const payRes = await fetch('/api/payment/mock/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId }),
            });

            if (!payRes.ok) {
                const data = await payRes.json();
                throw new Error(data.error || 'Payment failed');
            }

            // Redirect to order page
            router.push(`/order/${orderId}`);
        } catch (error: any) {
            setError(error.message || 'Payment failed. Please try again.');
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
                <div role="alert" className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                    <span className="font-medium">Error: </span>{error}
                </div>
            )}

            <div>
                <label
                    htmlFor="contact"
                    className="block text-sm font-medium text-gray-700 mb-2"
                >
                    Email or WhatsApp Number
                </label>
                <input
                    type="text"
                    id="contact"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="e.g. example@mail.com or 08123456789"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-gray-900 placeholder-gray-400 ${error ? 'border-red-300' : 'border-gray-300'
                        }`}
                    disabled={loading}
                    aria-invalid={!!error}
                    aria-required="true"
                    aria-describedby="contact-hint"
                />
                <p id="contact-hint" className="text-xs text-gray-500 mt-2">
                    We&apos;ll send order confirmation to this contact
                </p>
            </div>

            <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="w-full bg-green-600 text-white font-bold py-4 px-6 rounded-lg text-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                    </span>
                ) : (
                    `Pay Rp ${amount.toLocaleString('id-ID')}`
                )}
            </button>
        </form>
    );
}
