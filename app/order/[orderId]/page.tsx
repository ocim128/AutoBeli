
import { getOrderWithProduct } from '@/lib/orders';
import { getOrderAccessToken } from '@/lib/delivery';
import { notFound, redirect } from 'next/navigation';
import ContentViewer from '@/components/ContentViewer';

interface Props {
    params: Promise<{ orderId: string }>;
}

export default async function OrderPage({ params }: Props) {
    const { orderId } = await params;

    // 1. Fetch Order Status
    const order = await getOrderWithProduct(orderId);
    if (!order) notFound();

    // 2. Handle Pending State
    if (order.status !== 'PAID') {
        // If not paid, redirect back to checkout (or show pending message)
        redirect(`/checkout/${orderId}`);
    }

    // 3. Retrieve Access Token (Server-Side)
    // This token is passed to the client component to "claim" the content.
    const token = await getOrderAccessToken(orderId);

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-green-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Purchase Successful!</h1>
                <p className="text-gray-500 mt-2">Order ID: {orderId}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">

                {/* Order Info Sidebar */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4">Order Details</h3>
                        <div className="space-y-3 text-sm">
                            <div>
                                <span className="block text-gray-500 text-xs uppercase">Product</span>
                                <span className="font-medium">{order.product.title}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase">Total Paid</span>
                                <span className="font-medium text-green-600">Rp {order.amountPaid.toLocaleString('id-ID')}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase">Date</span>
                                <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div>
                                <span className="block text-gray-500 text-xs uppercase">Payment</span>
                                <span className="font-medium bg-gray-100 px-2 py-1 rounded text-xs">{order.paymentGateway}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Delivery Area */}
                <div className="md:col-span-2">
                    {!token ? (
                        <div className="p-8 bg-red-50 text-red-700 rounded-xl border border-red-200">
                            <h3 className="font-bold text-lg mb-2">Delivery Error</h3>
                            <p>Payment was successful, but the access token could not be found. Please contact support.</p>
                        </div>
                    ) : (
                        <ContentViewer token={token} />
                    )}
                </div>

            </div>
        </div>
    );
}
