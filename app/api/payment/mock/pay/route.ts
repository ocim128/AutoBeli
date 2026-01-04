
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
        }

        // Simulate Payment Provider Processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Simulate "Provider" calling our Webhook
        // We use the BASE_URL from env or default to localhost
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const webhookRes = await fetch(`${baseUrl}/api/webhooks/mock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId,
                signature: `MOCK-SIG-${orderId}`, // Matching expected signature
                status: 'SUCCESS'
            })
        });

        if (!webhookRes.ok) {
            throw new Error('Webhook simulation failed');
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Payment failed' }, { status: 500 });
    }
}
