
import clientPromise from '@/lib/db';
import { Product } from '@/lib/definitions';

export async function getActiveProducts(): Promise<Product[]> {
    const client = await clientPromise;
    const db = client.db();

    // Projection: Exclude contentEncrypted
    const products = await db.collection<Product>('products')
        .find({ isActive: true })
        .project<Product>({ contentEncrypted: 0 }) // NEVER fetch content for list
        .sort({ createdAt: -1 })
        .toArray();

    // Serializing for Next.js (converting ObjectId/Date to string if needed, 
    // but Server Components handle Dates well usually, though passing to client components might need clean objects.
    // We'll return raw for now as we render server-side).
    return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
    const client = await clientPromise;
    const db = client.db();

    const product = await db.collection<Product>('products')
        .findOne({ slug, isActive: true }, { projection: { contentEncrypted: 0 } });

    return product;
}
