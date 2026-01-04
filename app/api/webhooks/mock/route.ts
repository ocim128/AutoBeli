
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { generateAccessToken } from '@/lib/tokens';
import { ObjectId } from 'mongodb';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId, signature } = body;

        // 1. Verify Mock Signature
        // For simplicity, let's say signature must be "MOCK-SIG-{orderId}"
        if (signature !== `MOCK-SIG-${orderId}`) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const client = await clientPromise;
        const db = client.db();
        const _id = new ObjectId(orderId);

        // 2. Check Order Status
        const order = await db.collection('orders').findOne({ _id });
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Idempotency check: if already paid, just return success
        if (order.status === 'PAID') {
            return NextResponse.json({ success: true, message: 'Already paid' });
        }

        // 3. Update Order to PAID
        await db.collection('orders').updateOne(
            { _id },
            {
                $set: {
                    status: 'PAID',
                    amountPaid: 10000, // In real app, amount from provider
                    updatedAt: new Date(),
                    paymentMetadata: { provider: 'mock', signature }
                }
            }
        );

        // 4. Generate Access Token
        await generateAccessToken(orderId);

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
