import { NextResponse } from "next/server";
import clientPromise from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Product, StockItem } from "@/lib/definitions";
import { encryptContent, decryptContent } from "@/lib/crypto";
import { invalidateProductCache } from "@/lib/products";
import { v4 as uuidv4 } from "uuid";

/**
 * @swagger
 * /api/products/stock:
 *   post:
 *     description: Add a stock item to a product (Admin only)
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
 *               - slug
 *               - content
 *             properties:
 *               slug:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock item added
 *       404:
 *         description: Product not found
 *   delete:
 *     description: Remove a stock item from a product (Admin only)
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
 *               - slug
 *               - stockItemId
 *             properties:
 *               slug:
 *                 type: string
 *               stockItemId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stock item removed
 *       404:
 *         description: Product or stock item not found
 *   get:
 *     description: Get all stock items for a product with decrypted content (Admin only)
 *     tags: [Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Stock items list
 *       404:
 *         description: Product not found
 */

// Add a new stock item
export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, content } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Product slug is required" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Product>("products");

    const product = await collection.findOne({ slug });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Create new stock item
    const newStockItem: StockItem = {
      id: uuidv4(),
      contentEncrypted: encryptContent(content.trim()),
      isSold: false,
    };

    // Add to stockItems array
    await collection.updateOne(
      { slug },
      {
        $push: { stockItems: newStockItem },
        $set: { updatedAt: new Date(), isSold: false }, // Reset isSold since we have new stock
      }
    );

    // Invalidate cache
    invalidateProductCache(slug);

    return NextResponse.json({
      success: true,
      stockItemId: newStockItem.id,
      stockCount: (product.stockItems?.length || 0) + 1,
    });
  } catch (e) {
    console.error("Failed to add stock item:", e);
    return NextResponse.json({ error: "Failed to add stock item" }, { status: 500 });
  }
}

// Get stock items for a product
export async function GET(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Product slug is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const product = await db.collection<Product>("products").findOne({ slug });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Decrypt stock item contents for admin view
    const stockItems = (product.stockItems || []).map((item) => ({
      id: item.id,
      content: decryptContent(item.contentEncrypted),
      isSold: item.isSold,
      soldAt: item.soldAt,
      orderId: item.orderId?.toString(),
    }));

    // Also handle legacy content
    let legacyContent = null;
    if (product.contentEncrypted && (!product.stockItems || product.stockItems.length === 0)) {
      legacyContent = decryptContent(product.contentEncrypted);
    }

    return NextResponse.json({
      stockItems,
      legacyContent,
      totalStock: stockItems.length,
      availableStock: stockItems.filter((item) => !item.isSold).length,
    });
  } catch (e) {
    console.error("Failed to get stock items:", e);
    return NextResponse.json({ error: "Failed to get stock items" }, { status: 500 });
  }
}

// Remove a stock item
export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, stockItemId } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Product slug is required" }, { status: 400 });
    }

    if (!stockItemId || typeof stockItemId !== "string") {
      return NextResponse.json({ error: "Stock item ID is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Product>("products");

    const product = await collection.findOne({ slug });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const stockItem = product.stockItems?.find((item) => item.id === stockItemId);
    if (!stockItem) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    // Prevent deletion of sold items
    if (stockItem.isSold) {
      return NextResponse.json({ error: "Cannot delete a sold stock item" }, { status: 400 });
    }

    // Remove the stock item
    await collection.updateOne({ slug }, { $pull: { stockItems: { id: stockItemId } } });

    // Check remaining stock
    const remainingItems = (product.stockItems || []).filter(
      (item) => item.id !== stockItemId && !item.isSold
    );

    // If no stock left and no legacy content, mark as sold out
    if (remainingItems.length === 0 && !product.contentEncrypted) {
      await collection.updateOne({ slug }, { $set: { isSold: true, updatedAt: new Date() } });
    }

    // Invalidate cache
    invalidateProductCache(slug);

    return NextResponse.json({
      success: true,
      remainingStock: remainingItems.length,
    });
  } catch (e) {
    console.error("Failed to delete stock item:", e);
    return NextResponse.json({ error: "Failed to delete stock item" }, { status: 500 });
  }
}

// Update a stock item content (PATCH)
export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { slug, stockItemId, content } = body;

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Product slug is required" }, { status: 400 });
    }

    if (!stockItemId || typeof stockItemId !== "string") {
      return NextResponse.json({ error: "Stock item ID is required" }, { status: 400 });
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection<Product>("products");

    const product = await collection.findOne({ slug });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const stockItemIndex = product.stockItems?.findIndex((item) => item.id === stockItemId);
    if (stockItemIndex === undefined || stockItemIndex === -1) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    // Update the stock item content
    await collection.updateOne(
      { slug },
      {
        $set: {
          [`stockItems.${stockItemIndex}.contentEncrypted`]: encryptContent(content.trim()),
          updatedAt: new Date(),
        },
      }
    );

    // Invalidate cache
    invalidateProductCache(slug);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Failed to update stock item:", e);
    return NextResponse.json({ error: "Failed to update stock item" }, { status: 500 });
  }
}
