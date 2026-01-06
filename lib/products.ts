import clientPromise from "@/lib/db";
import { Product } from "@/lib/definitions";
import cache, { CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

/**
 * Get all active products with caching
 * Cache TTL: 1 minute
 */
export async function getActiveProducts(): Promise<Product[]> {
  // Check cache first
  const cached = cache.get<Product[]>(CACHE_KEYS.ACTIVE_PRODUCTS);
  if (cached) {
    return cached;
  }

  const client = await clientPromise;
  const db = client.db();

  // Query uses compound index: {isActive: 1, createdAt: -1}
  // Exclude sold products (unique digital products can only be sold once)
  const products = await db
    .collection<Product>("products")
    .find({ isActive: true, isSold: { $ne: true } })
    .project<Product>({ contentEncrypted: 0 }) // NEVER fetch content for list
    .sort({ createdAt: -1 })
    .toArray();

  // Store in cache
  cache.set(CACHE_KEYS.ACTIVE_PRODUCTS, products, CACHE_TTL.PRODUCTS_LIST);

  return products;
}

/**
 * Get a product by slug with caching
 * Cache TTL: 2 minutes
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Check cache first
  const cacheKey = CACHE_KEYS.PRODUCT_BY_SLUG(slug);
  const cached = cache.get<Product | null>(cacheKey);
  if (cached !== undefined) {
    return cached;
  }

  const client = await clientPromise;
  const db = client.db();

  // Query uses unique index: {slug: 1}
  // Exclude sold products (unique digital products can only be sold once)
  const product = await db
    .collection<Product>("products")
    .findOne(
      { slug, isActive: true, isSold: { $ne: true } },
      { projection: { contentEncrypted: 0 } }
    );

  // Store in cache (even null results to avoid repeated queries)
  cache.set(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);

  return product;
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
