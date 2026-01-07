import clientPromise from "@/lib/db";
import { Product } from "@/lib/definitions";
import cache, { CACHE_KEYS, CACHE_TTL, getOrFetch } from "@/lib/cache";

/**
 * Get all active products with caching and request deduplication
 * Cache TTL: 1 minute
 * Uses getOrFetch to prevent thundering herd on concurrent requests
 */
export async function getActiveProducts(): Promise<Product[]> {
  return getOrFetch(
    CACHE_KEYS.ACTIVE_PRODUCTS,
    async () => {
      const client = await clientPromise;
      const db = client.db();

      // Query uses compound index: {isActive: 1, createdAt: -1}
      // Exclude sold products (unique digital products can only be sold once)
      return db
        .collection<Product>("products")
        .find({ isActive: true, isSold: { $ne: true } })
        .project<Product>({ contentEncrypted: 0 }) // NEVER fetch content for list
        .sort({ createdAt: -1 })
        .toArray();
    },
    CACHE_TTL.PRODUCTS_LIST
  );
}

/**
 * Get a product by slug with caching and request deduplication
 * Cache TTL: 2 minutes
 * Uses getOrFetch to prevent thundering herd on concurrent requests
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  return getOrFetch(
    CACHE_KEYS.PRODUCT_BY_SLUG(slug),
    async () => {
      const client = await clientPromise;
      const db = client.db();

      // Query uses unique index: {slug: 1}
      // Exclude sold products (unique digital products can only be sold once)
      return db
        .collection<Product>("products")
        .findOne(
          { slug, isActive: true, isSold: { $ne: true } },
          { projection: { contentEncrypted: 0 } }
        );
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
