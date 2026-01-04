
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateProduct() {
    const router = useRouter();
    const [form, setForm] = useState({
        title: '',
        slug: '',
        description: '',
        priceIdr: 10000,
        content: '',
        isActive: true
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, isActive: e.target.checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create');
            }

            router.push('/admin/products');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

            <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded-lg bg-white shadow-sm">

                {/* Title */}
                <div>
                    <label className="block text-sm font-medium">Title</label>
                    <input
                        type="text"
                        name="title"
                        required
                        className="w-full border rounded p-2"
                        value={form.title}
                        onChange={(e) => {
                            // Auto-slug
                            const val = e.target.value;
                            setForm(prev => ({
                                ...prev,
                                title: val,
                                slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                            }));
                        }}
                    />
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-medium">Slug (URL)</label>
                    <input
                        type="text"
                        name="slug"
                        required
                        className="w-full border rounded p-2 bg-gray-50"
                        value={form.slug}
                        onChange={handleChange}
                    />
                </div>

                {/* Price */}
                <div>
                    <label className="block text-sm font-medium">Price (IDR)</label>
                    <input
                        type="number"
                        name="priceIdr"
                        required
                        min="0"
                        className="w-full border rounded p-2"
                        value={form.priceIdr}
                        onChange={handleChange}
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        name="description"
                        rows={3}
                        className="w-full border rounded p-2"
                        value={form.description}
                        onChange={handleChange}
                    />
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium">Content (The Product)</label>
                    <p className="text-xs text-gray-500 mb-1">This text will be encrypted and delivered only after payment.</p>
                    <textarea
                        name="content"
                        required
                        rows={6}
                        className="w-full border rounded p-2 font-mono text-sm bg-yellow-50"
                        placeholder="Paste your digital product content here..."
                        value={form.content}
                        onChange={handleChange}
                    />
                </div>

                {/* Active */}
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={form.isActive}
                        onChange={handleCheckbox}
                        className="h-4 w-4"
                    />
                    <label>Active (Visible in store)</label>
                </div>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Create Product'}
                    </button>
                </div>
            </form>
        </div>
    );
}
