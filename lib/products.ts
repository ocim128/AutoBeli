import clientPromise from "@/lib/db";
import { Product } from "@/lib/definitions";
import cache, { CACHE_KEYS, CACHE_TTL, getOrFetch } from "@/lib/cache";

/**
 * Get all active products with caching and request deduplication
 * Cache TTL: 1 minute
 * Uses getOrFetch to prevent thundering herd on concurrent requests
 * Products are available if:
 * - Legacy products: not marked as sold
 * - Stock products: have at least one unsold stock item
 */
export async function getActiveProducts(): Promise<(Product & { availableStock?: number })[]> {
  return getOrFetch(
    CACHE_KEYS.ACTIVE_PRODUCTS,
    async () => {
      const client = await clientPromise;
      const db = client.db();

      // Get all active products
      const products = await db
        .collection<Product>("products")
        .find({ isActive: true })
        .project<Product>({ contentEncrypted: 0, "stockItems.contentEncrypted": 0 })
        .sort({ createdAt: -1 })
        .toArray();

      // Filter and add available stock count
      return products.filter((product) => {
        if (product.stockItems && product.stockItems.length > 0) {
          // Stock-based product: check for unsold items
          const availableCount = product.stockItems.filter((item) => !item.isSold).length;
          (product as Product & { availableStock: number }).availableStock = availableCount;
          return availableCount > 0;
        } else {
          // Legacy product: check isSold flag
          (product as Product & { availableStock: number }).availableStock = product.isSold ? 0 : 1;
          return !product.isSold;
        }
      });
    },
    CACHE_TTL.PRODUCTS_LIST
  );
}

/**
 * Get a product by slug with caching and request deduplication
 * Cache TTL: 2 minutes
 * Uses getOrFetch to prevent thundering herd on concurrent requests
 */
export async function getProductBySlug(
  slug: string
): Promise<(Product & { availableStock?: number }) | null> {
  return getOrFetch(
    CACHE_KEYS.PRODUCT_BY_SLUG(slug),
    async () => {
      const client = await clientPromise;
      const db = client.db();

      const product = await db
        .collection<Product>("products")
        .findOne(
          { slug, isActive: true },
          { projection: { contentEncrypted: 0, "stockItems.contentEncrypted": 0 } }
        );

      if (!product) return null;

      // Calculate available stock
      if (product.stockItems && product.stockItems.length > 0) {
        const availableCount = product.stockItems.filter((item) => !item.isSold).length;
        (product as Product & { availableStock: number }).availableStock = availableCount;
        // Product is not available if no stock
        if (availableCount === 0) return null;
      } else {
        // Legacy product
        (product as Product & { availableStock: number }).availableStock = product.isSold ? 0 : 1;
        if (product.isSold) return null;
      }

      return product;
    },
    CACHE_TTL.PRODUCT_DETAIL
  );
}

/**
 * Invalidate product caches
 * Call this after creating, updating, or deleting products
 */
export function invalidateProductCache(slug?: string): void {
  // Always invalidate the active products list
  cache.delete(CACHE_KEYS.ACTIVE_PRODUCTS);

  // If a specific slug is provided, invalidate that too
  if (slug) {
    cache.delete(CACHE_KEYS.PRODUCT_BY_SLUG(slug));
  } else {
    // Invalidate all product slug caches
    cache.invalidatePrefix("products:slug:");
  }
}
