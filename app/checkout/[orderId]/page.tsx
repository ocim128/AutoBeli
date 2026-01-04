
import { getOrderWithProduct } from '@/lib/orders';
import { notFound, redirect } from 'next/navigation';
import MockPayButton from '@/components/MockPayButton';

interface Props {
    params: Promise<{ orderId: string }>;
}

export default async function CheckoutPage({ params }: Props) {
    const { orderId } = await params;
    const order = await getOrderWithProduct(orderId);

    if (!order) {
        notFound();
    }

    // If already paid, redirect to delivery page
    if (order.status === 'PAID') {
        redirect(`/order/${orderId}`);
    }

    return (
        <div className="max-w-3xl mx-auto py-12">
            <h1 className="text-3xl font-bold mb-8">Checkout</h1>

            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="p-6 bg-gray-50 border-b">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Order Summary</h2>
                    <p className="font-mono text-xs text-gray-400 mt-1">ID: {order._id?.toString()}</p>
                </div>

                <div className="p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{order.product.title}</h3>
                            <p className="text-gray-500 mt-1 text-sm">{order.product.description}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-bold">Rp {order.product.priceIdr.toLocaleString('id-ID')}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 space-y-4">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span>Rp {order.product.priceIdr.toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Service Fee</span>
                            <span>Rp 0</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t border-gray-100 pt-4">
                            <span>Total</span>
                            <span>Rp {order.product.priceIdr.toLocaleString('id-ID')}</span>
                        </div>
                    </div>

                    <div className="mt-8">
                        <MockPayButton orderId={orderId} amount={order.product.priceIdr} />
                        <p className="text-center text-xs text-gray-400 mt-3">
                            This is a simulation. No real money will be deducted.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
