import { getMongoClient } from "@/lib/db";
import { Product } from "@/lib/definitions";
import cache, { CACHE_KEYS, CACHE_TTL, getOrFetch } from "@/lib/cache";

export interface SerializedStockItem {
  id: string;
  isSold: boolean;
  soldAt?: string;
  orderId?: string;
}

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
  stockItems?: SerializedStockItem[];
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
    stockItems: product.stockItems?.map((item) => ({
      id: item.id,
      isSold: item.isSold,
      orderId: item.orderId?.toString(),
      soldAt: item.soldAt ? new Date(item.soldAt).toISOString() : undefined,
    })),
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
      const client = await getMongoClient();
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
