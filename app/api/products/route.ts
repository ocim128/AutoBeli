
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/db';
import { getSession } from '@/lib/auth';
import { Product } from '@/lib/definitions';
import { encryptContent } from '@/lib/crypto';

export async function POST(request: Request) {
    // Auth Check
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { title, slug, description, priceIdr, content, isActive } = body;

        if (!title || !slug || !priceIdr || !content) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Product>('products');

        // Check slug uniqueness
        const existing = await collection.findOne({ slug });
        if (existing) {
            return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
        }

        // Encrypt content
        const contentEncrypted = encryptContent(content);

        const newProduct: Product = {
            title,
            slug,
            description,
            priceIdr: parseInt(priceIdr),
            contentEncrypted,
            isActive: isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await collection.insertOne(newProduct);

        return NextResponse.json({ success: true, slug });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
}

export async function GET() {
    // Admin list
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await clientPromise;
        const db = client.db();
        const products = await db.collection<Product>('products')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        return NextResponse.json({ products });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { originalSlug, title, description, priceIdr, content, isActive } = body;

        const client = await clientPromise;
        const db = client.db();
        const collection = db.collection<Product>('products');

        const updateData: any = {
            title,
            description,
            priceIdr: parseInt(priceIdr),
            isActive: isActive ?? true,
            updatedAt: new Date(),
        };

        if (content) {
            updateData.contentEncrypted = encryptContent(content);
        }

        const result = await collection.updateOne(
            { slug: originalSlug },
            { $set: updateData }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
