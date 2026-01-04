
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

import { checkRateLimit, getClientIP, RATE_LIMITS } from '@/lib/rateLimit';

export async function GET(request: Request) {
    // Basic protection against health check spam
    const ip = getClientIP(request);
    const rateLimitResult = checkRateLimit(`health:${ip}`, RATE_LIMITS.API_GENERAL);

    if (!rateLimitResult.success) {
        return NextResponse.json({ status: 'busy' }, { status: 429 });
    }

    try {
        const client = await clientPromise;
        // Just a quick ping to see if we can talk to the server
        await client.db('admin').command({ ping: 1 });

        return NextResponse.json(
            { status: 'ok', database: 'connected' },
            { status: 200 }
        );
    } catch (e) {
        console.error(e);
        return NextResponse.json(
            { status: 'error', database: 'disconnected', error: String(e) },
            { status: 500 }
        );
    }
}
