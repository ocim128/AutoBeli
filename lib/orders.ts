
import clientPromise from '@/lib/db';
import { ObjectId } from 'mongodb';
import { Order, Product } from '@/lib/definitions';

export type OrderWithProduct = Order & { product: Product };

export async function getOrderWithProduct(orderId: string): Promise<OrderWithProduct | null> {
    try {
        const client = await clientPromise;
        const db = client.db();

        // Aggregation to join Order with Product
        const pipeline = [
            { $match: { _id: new ObjectId(orderId) } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'productId',
                    foreignField: '_id',
                    as: 'product',
                },
            },
            { $unwind: '$product' },
            // Exclude sensitive content
            { $project: { 'product.contentEncrypted': 0 } }
        ];

        const result = await db.collection<Order>('orders').aggregate(pipeline).toArray();

        if (result.length === 0) return null;
        return result[0] as OrderWithProduct;
    } catch (e) {
        console.error(e);
        return null;
    }
}
