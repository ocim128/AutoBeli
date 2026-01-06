/**
 * Simple In-Memory Cache for Product Listings
 *
 * A lightweight TTL-based cache that stores product listings in memory.
 * This avoids hitting the database for every homepage request.
 *
 * Benefits:
 * - Zero external dependencies (no Redis required)
 * - Automatic expiration with configurable TTL
 * - Memory-efficient with automatic cleanup
 * - Type-safe with generics
 *
 * For larger scale, consider using Redis or Next.js ISR.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Run cleanup every 60 seconds to remove expired entries
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000);
      // Don't prevent Node from exiting
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Get a value from the cache
   * Returns undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.data as T;
  }

  /**
   * Set a value in the cache with TTL (in seconds)
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys that start with a prefix
   */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  stats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Stop the cleanup interval (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton instance with global preservation for HMR in development
declare global {
   
  var _memoryCache: MemoryCache | undefined;
}

let cache: MemoryCache;

if (process.env.NODE_ENV === "development") {
  // Preserve cache across HMR in development
  if (!global._memoryCache) {
    global._memoryCache = new MemoryCache();
  }
  cache = global._memoryCache;
} else {
  cache = new MemoryCache();
}

export default cache;

// ================================================
// CACHE KEY CONSTANTS
// ================================================

export const CACHE_KEYS = {
  ACTIVE_PRODUCTS: "products:active",
  PRODUCT_BY_SLUG: (slug: string) => `products:slug:${slug}`,
} as const;

// Default TTL values (in seconds)
export const CACHE_TTL = {
  PRODUCTS_LIST: 60, // 1 minute for product listings
  PRODUCT_DETAIL: 120, // 2 minutes for individual products
} as const;
