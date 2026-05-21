import { getMongoClient } from "@/lib/db";
import { Product } from "@/lib/definitions";
import cache, { CACHE_KEYS, CACHE_TTL, getOrFetch } from "@/lib/cache";

export interface SerializedProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  priceIdr: number;
  imageUrl?: string;
  isActive: boolean;
  isSold?: boolean;
  availableStock?: number;
  createdAt?: string;
  updatedAt?: string;
}

export function serializeProductForClient(
  product: Product & { availableStock?: number }
): SerializedProduct {
  return {
    _id: product._id?.toString() ?? "",
    title: product.title,
    slug: product.slug,
    description: product.description,
    priceIdr: product.priceIdr,
    imageUrl: product.imageUrl,
    isActive: product.isActive,
    isSold: product.isSold,
    availableStock: product.availableStock,
    createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : undefined,
    updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : undefined,
  };
}

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
      const client = await getMongoClient();
      const db = client.db();

      const products = await db
        .collection<Product>("products")
        .aggregate<Product & { availableStock: number }>([
          { $match: { isActive: true } },
          {
            $addFields: {
              availableStock: {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ["$stockItems", []] } }, 0] },
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ["$stockItems", []] },
                        as: "item",
                        cond: { $ne: ["$$item.isSold", true] },
                      },
                    },
                  },
                  { $cond: [{ $eq: ["$isSold", true] }, 0, 1] },
                ],
              },
            },
          },
          { $match: { availableStock: { $gt: 0 } } },
          { $project: { contentEncrypted: 0, stockItems: 0 } },
          { $sort: { createdAt: -1 } },
        ])
        .toArray();

      return products;
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
      const client = await getMongoClient();
      const db = client.db();

      const products = await db
        .collection<Product>("products")
        .aggregate<Product & { availableStock: number }>([
          { $match: { slug, isActive: true } },
          {
            $addFields: {
              availableStock: {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ["$stockItems", []] } }, 0] },
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ["$stockItems", []] },
                        as: "item",
                        cond: { $ne: ["$$item.isSold", true] },
                      },
                    },
                  },
                  { $cond: [{ $eq: ["$isSold", true] }, 0, 1] },
                ],
              },
            },
          },
          { $match: { availableStock: { $gt: 0 } } },
          { $project: { contentEncrypted: 0, stockItems: 0 } },
          { $limit: 1 },
        ])
        .toArray();

      return products[0] ?? null;
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
