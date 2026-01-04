
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getSession } from '@/lib/auth';

import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Rate limit
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`admin:orders:${ip}`, RATE_LIMITS.API_GENERAL);

    if (!rateLimitResult.success) {
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429 }
        );
    }

    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db();

        const orders = await db.collection('orders').aggregate([
            { $sort: { createdAt: -1 } },
            { $limit: 100 }, // Cap at 100 for now
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            { $project: { 'product.contentEncrypted': 0 } }
        ]).toArray();

        return NextResponse.json({ orders });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}
