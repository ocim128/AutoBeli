
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';

export async function GET() {
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
