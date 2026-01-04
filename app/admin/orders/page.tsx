
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { OrderWithProduct } from '@/lib/orders';

// We'll fetch orders via a new API endpoint since we need dynamic joined data
export default function AdminOrders() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/orders')
            .then(res => res.json())
            .then(data => {
                if (data.orders) setOrders(data.orders);
            })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8">Loading orders...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Orders</h1>
                <Link href="/admin/dashboard" className="text-sm underline">Back to Dashboard</Link>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="p-4">ID</th>
                            <th className="p-4">Product</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Gateway</th>
                            <th className="p-4">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 && (
                            <tr><td colSpan={7} className="p-4 text-center text-gray-500">No orders found.</td></tr>
                        )}
                        {orders.map((order) => (
                            <tr key={order._id} className="border-b last:border-0 hover:bg-gray-50 transition">
                                <td className="p-4 font-mono text-xs text-gray-500">
                                    {order._id}
                                </td>
                                <td className="p-4 font-medium max-w-xs truncate" title={order.product?.title || 'Unknown'}>
                                    {order.product?.title || <span className="text-red-400">Deleted Product</span>}
                                </td>
                                <td className="p-4">
                                    Rp {(order.amountPaid || order.product?.priceIdr || 0).toLocaleString('id-ID')}
                                </td>
                                <td className="p-4">
                                    {order.customerContact ? (
                                        <span className="text-gray-700" title={order.customerContact}>
                                            {order.customerContact}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-gray-500 uppercase">{order.paymentGateway}</td>
                                <td className="p-4 text-gray-500">
                                    {new Date(order.createdAt).toLocaleString('id-ID')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
