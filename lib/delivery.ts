
import clientPromise from '@/lib/db';
import { AccessToken } from '@/lib/definitions';
import { ObjectId } from 'mongodb';

export async function getOrderAccessToken(orderId: string): Promise<string | null> {
    const client = await clientPromise;
    const db = client.db();

    const tokenRecord = await db.collection<AccessToken>('tokens').findOne({
        orderId: new ObjectId(orderId)
    });

    return tokenRecord ? tokenRecord.token : null;
}
