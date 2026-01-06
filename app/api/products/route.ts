import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Product } from "@/lib/definitions";
import { encryptContent, decryptContent } from "@/lib/crypto";
import { validate, createProductSchema, updateProductSchema } from "@/lib/validation";
import { invalidateProductCache } from "@/lib/products";

export async function POST(request: Request) {
  // Auth Check
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate input
    const validation = validate(createProductSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { title, slug, description, priceIdr, content, isActive } = validation.data!;

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Product>("products");

    // Check slug uniqueness
    const existing = await collection.findOne({ slug });
    if (existing) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
    }

    // Encrypt content
    const contentEncrypted = encryptContent(content);

    const newProduct: Product = {
      title,
      slug,
      description: description || "",
      priceIdr,
      contentEncrypted,
      isActive: isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await collection.insertOne(newProduct);

    // Invalidate product cache after creation
    invalidateProductCache();

    return NextResponse.json({ success: true, slug });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  // Admin list
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    const client = await clientPromise;
    const db = client.db();

    if (slug) {
      const product = await db.collection<Product>("products").findOne({ slug });

      if (!product) {
        return NextResponse.json({ error: "Product not found" }, { status: 404 });
      }

      // Decrypt content for admin view
      if (product.contentEncrypted) {
        // @ts-expect-error Adding decrypted content to Product object for admin response
        product.content = decryptContent(product.contentEncrypted);
      }

      return NextResponse.json({ product });
    }

    const products = await db
      .collection<Product>("products")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ products });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { originalSlug, title, description, priceIdr, content, isActive } = body;

    // Basic validation for originalSlug
    if (!originalSlug || typeof originalSlug !== "string") {
      return NextResponse.json({ error: "Original slug is required" }, { status: 400 });
    }

    // Validate update fields
    const updateValidation = validate(updateProductSchema, {
      slug: originalSlug,
      title,
      description,
      priceIdr: priceIdr ? parseInt(priceIdr) : undefined,
      content,
      isActive,
    });

    if (!updateValidation.success) {
      return NextResponse.json({ error: updateValidation.error }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Product>("products");

    const updateData: Partial<Product> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priceIdr !== undefined) updateData.priceIdr = parseInt(priceIdr);
    if (isActive !== undefined) updateData.isActive = isActive;

    if (content) {
      updateData.contentEncrypted = encryptContent(content);
    }

    const result = await collection.updateOne({ slug: originalSlug }, { $set: updateData });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Invalidate product cache after update
    invalidateProductCache(originalSlug);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
