/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { checkRateLimit, getClientIP, RATE_LIMITS, type RateLimitConfig } from '@/lib/rateLimit';

describe('Rate Limiting', () => {
    // Use a unique prefix for each test to avoid state leakage
    let testPrefix: string;

    beforeEach(() => {
        testPrefix = `test-${Date.now()}-${Math.random()}`;
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('checkRateLimit', () => {
        const defaultConfig: RateLimitConfig = { limit: 5, windowSeconds: 60 };

        it('allows first request', () => {
            const result = checkRateLimit(`${testPrefix}:first`, defaultConfig);
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(4);
            expect(result.limit).toBe(5);
        });

        it('tracks remaining requests correctly', () => {
            const key = `${testPrefix}:tracking`;

            // Make 5 requests (should all succeed)
            for (let i = 0; i < 5; i++) {
                const result = checkRateLimit(key, defaultConfig);
                expect(result.success).toBe(true);
                expect(result.remaining).toBe(4 - i);
            }
        });

        it('blocks requests after limit exceeded', () => {
            const key = `${testPrefix}:exceeded`;

            // Exhaust the limit
            for (let i = 0; i < 5; i++) {
                checkRateLimit(key, defaultConfig);
            }

            // 6th request should be blocked
            const result = checkRateLimit(key, defaultConfig);
            expect(result.success).toBe(false);
            expect(result.remaining).toBe(0);
        });

        it('resets after window expires', () => {
            const key = `${testPrefix}:reset`;

            // Exhaust the limit
            for (let i = 0; i < 5; i++) {
                checkRateLimit(key, defaultConfig);
            }

            // Verify blocked
            expect(checkRateLimit(key, defaultConfig).success).toBe(false);

            // Fast-forward past the window
            vi.advanceTimersByTime(61 * 1000);

            // Should be allowed again
            const result = checkRateLimit(key, defaultConfig);
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(4);
        });

        it('handles different identifiers independently', () => {
            const key1 = `${testPrefix}:user1`;
            const key2 = `${testPrefix}:user2`;

            // Exhaust limit for user1
            for (let i = 0; i < 5; i++) {
                checkRateLimit(key1, defaultConfig);
            }

            // user1 blocked
            expect(checkRateLimit(key1, defaultConfig).success).toBe(false);

            // user2 should still be allowed
            const result = checkRateLimit(key2, defaultConfig);
            expect(result.success).toBe(true);
            expect(result.remaining).toBe(4);
        });

        it('returns correct resetAt timestamp', () => {
            const key = `${testPrefix}:timestamp`;
            const now = Date.now();

            const result = checkRateLimit(key, defaultConfig);

            expect(result.resetAt).toBeGreaterThan(now);
            expect(result.resetAt).toBeLessThanOrEqual(now + 60 * 1000);
        });

        it('maintains resetAt across requests in same window', () => {
            const key = `${testPrefix}:same-window`;

            const result1 = checkRateLimit(key, defaultConfig);
            const result2 = checkRateLimit(key, defaultConfig);

            expect(result1.resetAt).toBe(result2.resetAt);
        });

        it('handles custom configurations', () => {
            const key = `${testPrefix}:custom`;
            const customConfig: RateLimitConfig = { limit: 2, windowSeconds: 10 };

            checkRateLimit(key, customConfig);
            checkRateLimit(key, customConfig);

            // 3rd request should be blocked
            const result = checkRateLimit(key, customConfig);
            expect(result.success).toBe(false);
            expect(result.limit).toBe(2);
        });

        it('handles limit of 1', () => {
            const key = `${testPrefix}:limit-one`;
            const singleConfig: RateLimitConfig = { limit: 1, windowSeconds: 60 };

            const result1 = checkRateLimit(key, singleConfig);
            expect(result1.success).toBe(true);
            expect(result1.remaining).toBe(0);

            const result2 = checkRateLimit(key, singleConfig);
            expect(result2.success).toBe(false);
        });
    });

    describe('getClientIP', () => {
        it('extracts IP from x-forwarded-for header', () => {
            const request = new Request('http://localhost', {
                headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
            });

            const ip = getClientIP(request);
            expect(ip).toBe('192.168.1.1');
        });

        it('extracts IP from cf-connecting-ip header (Cloudflare)', () => {
            const request = new Request('http://localhost', {
                headers: { 'cf-connecting-ip': '203.0.113.50' },
            });

            const ip = getClientIP(request);
            expect(ip).toBe('203.0.113.50');
        });

        it('extracts IP from x-real-ip header (nginx)', () => {
            const request = new Request('http://localhost', {
                headers: { 'x-real-ip': '172.16.0.1' },
            });

            const ip = getClientIP(request);
            expect(ip).toBe('172.16.0.1');
        });

        it('prioritizes x-forwarded-for over other headers', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'x-forwarded-for': '1.1.1.1',
                    'cf-connecting-ip': '2.2.2.2',
                    'x-real-ip': '3.3.3.3',
                },
            });

            const ip = getClientIP(request);
            expect(ip).toBe('1.1.1.1');
        });

        it('falls back to cf-connecting-ip when x-forwarded-for is missing', () => {
            const request = new Request('http://localhost', {
                headers: {
                    'cf-connecting-ip': '2.2.2.2',
                    'x-real-ip': '3.3.3.3',
                },
            });

            const ip = getClientIP(request);
            expect(ip).toBe('2.2.2.2');
        });

        it('returns "unknown" when no IP headers present', () => {
            const request = new Request('http://localhost');

            const ip = getClientIP(request);
            expect(ip).toBe('unknown');
        });

        it('trims whitespace from x-forwarded-for', () => {
            const request = new Request('http://localhost', {
                headers: { 'x-forwarded-for': '  192.168.1.1  , 10.0.0.1' },
            });

            const ip = getClientIP(request);
            expect(ip).toBe('192.168.1.1');
        });
    });

    describe('RATE_LIMITS presets', () => {
        it('has correct ORDER_CREATE limits', () => {
            expect(RATE_LIMITS.ORDER_CREATE.limit).toBe(10);
            expect(RATE_LIMITS.ORDER_CREATE.windowSeconds).toBe(60);
        });

        it('has correct LOGIN limits', () => {
            expect(RATE_LIMITS.LOGIN.limit).toBe(5);
            expect(RATE_LIMITS.LOGIN.windowSeconds).toBe(900); // 15 minutes
        });

        it('has correct API_GENERAL limits', () => {
            expect(RATE_LIMITS.API_GENERAL.limit).toBe(60);
            expect(RATE_LIMITS.API_GENERAL.windowSeconds).toBe(60);
        });

        it('has correct DELIVERY limits', () => {
            expect(RATE_LIMITS.DELIVERY.limit).toBe(30);
            expect(RATE_LIMITS.DELIVERY.windowSeconds).toBe(60);
        });
    });
});
