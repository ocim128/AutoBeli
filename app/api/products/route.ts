import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Product } from "@/lib/definitions";
import { encryptContent, decryptContent } from "@/lib/crypto";
import { validate, createProductSchema, updateProductSchema } from "@/lib/validation";
import { invalidateProductCache } from "@/lib/products";

/**
 * @swagger
 * /api/products:
 *   get:
 *     description: Returns list of products or a single product by slug
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Product slug to fetch specific product
 *     responses:
 *       200:
 *         description: Success
 *   post:
 *     description: Create a new product (Admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - slug
 *               - priceIdr
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               description:
 *                 type: string
 *               priceIdr:
 *                 type: integer
 *               content:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Created
 *       401:
 *         description: Unauthorized
 *   put:
 *     description: Update a product (Admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - originalSlug
 *             properties:
 *               originalSlug:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priceIdr:
 *                 type: integer
 *               content:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated
 *       404:
 *         description: Product not found
 */

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

    const { title, slug, description, priceIdr, content, imageUrl, isActive } = validation.data!;

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
      imageUrl: imageUrl || "",
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

      // Decrypt content for admin view (legacy products)
      if (product.contentEncrypted) {
        // @ts-expect-error Adding decrypted content to Product object for admin response
        product.content = decryptContent(product.contentEncrypted);
      }

      // Calculate stock stats for admin
      const stockStats = {
        total: 0,
        available: 0,
        sold: 0,
        hasStockSystem: false,
      };

      if (product.stockItems && product.stockItems.length > 0) {
        stockStats.hasStockSystem = true;
        stockStats.total = product.stockItems.length;
        stockStats.available = product.stockItems.filter((item) => !item.isSold).length;
        stockStats.sold = product.stockItems.filter((item) => item.isSold).length;
      } else if (!product.isSold) {
        // Legacy product with single content
        stockStats.total = 1;
        stockStats.available = 1;
        stockStats.sold = 0;
      } else if (product.isSold) {
        stockStats.total = 1;
        stockStats.available = 0;
        stockStats.sold = 1;
      }

      return NextResponse.json({
        product,
        stockStats,
      });
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
    const { originalSlug, title, description, priceIdr, content, imageUrl, isActive } = body;

    // Basic validation for originalSlug
    if (!originalSlug || typeof originalSlug !== "string") {
      return NextResponse.json({ error: "Original slug is required" }, { status: 400 });
    }

    // Validate update fields
    const updateValidation = validate(updateProductSchema, {
      slug: originalSlug,
      title,
      description,
      priceIdr:
        priceIdr !== undefined
          ? typeof priceIdr === "string"
            ? parseInt(priceIdr)
            : priceIdr
          : undefined,
      content,
      imageUrl,
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
    if (priceIdr !== undefined)
      updateData.priceIdr = typeof priceIdr === "string" ? parseInt(priceIdr) : priceIdr;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;

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
