/**
 * Lightweight in-memory rate limiter
 * No Redis required - uses a simple Map with automatic cleanup
 * 
 * Memory usage: ~50 bytes per entry (IP + timestamps)
 * Max entries: 10,000 (auto-cleanup of oldest when exceeded)
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

// Store: key -> { count, resetAt }
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (runs every 60 seconds)
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
    if (cleanupInterval) return;
    cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, entry] of rateLimitStore.entries()) {
            if (entry.resetAt < now) {
                rateLimitStore.delete(key);
            }
        }
        // If store is too large, remove oldest entries
        if (rateLimitStore.size > 10000) {
            const entries = Array.from(rateLimitStore.entries());
            entries.sort((a, b) => a[1].resetAt - b[1].resetAt);
            const toRemove = entries.slice(0, 1000);
            toRemove.forEach(([key]) => rateLimitStore.delete(key));
        }
    }, 60000);
}

// Start cleanup on module load
if (typeof window === 'undefined') {
    startCleanup();
}

export interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    limit: number;
    /** Time window in seconds */
    windowSeconds: number;
}

export interface RateLimitResult {
    success: boolean;
    limit: number;
    remaining: number;
    resetAt: number;
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns RateLimitResult with success status and metadata
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const key = identifier;

    const entry = rateLimitStore.get(key);

    // If no entry or window expired, create new entry
    if (!entry || entry.resetAt < now) {
        const newEntry: RateLimitEntry = {
            count: 1,
            resetAt: now + windowMs,
        };
        rateLimitStore.set(key, newEntry);
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            resetAt: newEntry.resetAt,
        };
    }

    // Increment count
    entry.count++;

    // Check if over limit
    if (entry.count > config.limit) {
        return {
            success: false,
            limit: config.limit,
            remaining: 0,
            resetAt: entry.resetAt,
        };
    }

    return {
        success: true,
        limit: config.limit,
        remaining: config.limit - entry.count,
        resetAt: entry.resetAt,
    };
}

/**
 * Get client IP from request headers
 * Works with Vercel, Cloudflare, and standard proxies
 */
export function getClientIP(request: Request): string {
    // Vercel
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    // Cloudflare
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
        return cfConnectingIP;
    }

    // Real IP header (nginx)
    const realIP = request.headers.get('x-real-ip');
    if (realIP) {
        return realIP;
    }

    return 'unknown';
}

// Pre-configured rate limiters for common use cases
export const RATE_LIMITS = {
    // Order creation: 10 requests per minute
    ORDER_CREATE: { limit: 10, windowSeconds: 60 },
    // Login attempts: 5 per 15 minutes
    LOGIN: { limit: 5, windowSeconds: 900 },
    // API general: 60 requests per minute
    API_GENERAL: { limit: 60, windowSeconds: 60 },
    // Content delivery: 30 requests per minute
    DELIVERY: { limit: 30, windowSeconds: 60 },
} as const;
