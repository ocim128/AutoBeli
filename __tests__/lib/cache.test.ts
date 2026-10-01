/**
 * @vitest-environment node
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import cache, { getOrFetch } from "@/lib/cache";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe("cache request invalidation", () => {
  beforeEach(() => cache.clear());
  afterEach(() => cache.clear());

  const key = "products:slug:premium-access";
  const invalidators = [
    ["key deletion", () => cache.delete(key)],
    ["prefix invalidation", () => cache.invalidatePrefix("products:slug:")],
    ["cache clear", () => cache.clear()],
  ] as const;

  it.each(invalidators)(
    "%s prevents a stale query from replacing fresh stock",
    async (_, invalidate) => {
      const stale = deferred<number>();
      const oldRequest = getOrFetch(key, () => stale.promise, 120);

      invalidate();
      const freshFetcher = vi.fn().mockResolvedValue(0);
      const freshRequest = getOrFetch(key, freshFetcher, 120);
      // Finish the newer query first, then the query that saw stock before the sale.
      expect(await freshRequest).toBe(0);
      stale.resolve(1);

      expect(await oldRequest).toBe(1);
      expect(freshFetcher).toHaveBeenCalledTimes(1);
      expect(cache.get(key)).toBe(0);
    }
  );

  it.each(invalidators)(
    "%s keeps the replacement query deduplicated when the stale query finishes",
    async (_, invalidate) => {
      const stale = deferred<number>();
      const fresh = deferred<number>();
      const oldRequest = getOrFetch(key, () => stale.promise, 120);

      invalidate();
      const freshFetcher = vi.fn(() => fresh.promise);
      const freshRequest = getOrFetch(key, freshFetcher, 120);
      stale.resolve(1);
      await oldRequest;

      expect(cache.get(key)).toBeUndefined();
      const duplicateFetcher = vi.fn().mockResolvedValue(2);
      const duplicateRequest = getOrFetch(key, duplicateFetcher, 120);
      fresh.resolve(0);

      expect(await freshRequest).toBe(0);
      expect(await duplicateRequest).toBe(0);
      expect(freshFetcher).toHaveBeenCalledTimes(1);
      expect(duplicateFetcher).not.toHaveBeenCalled();
      expect(cache.get(key)).toBe(0);
    }
  );

  it("deduplicates concurrent queries and caches their result", async () => {
    const result = deferred<number>();
    const fetcher = vi.fn(() => result.promise);
    const first = getOrFetch(key, fetcher, 120);
    const second = getOrFetch(key, fetcher, 120);
    result.resolve(3);

    expect(await first).toBe(3);
    expect(await second).toBe(3);
    expect(await getOrFetch(key, fetcher, 120)).toBe(3);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("leaves unrelated cached and pending keys intact during prefix invalidation", async () => {
    cache.set("settings:cached", true, 300);
    const settings = deferred<boolean>();
    const settingsFetcher = vi.fn(() => settings.promise);
    const first = getOrFetch("settings:pending", settingsFetcher, 300);
    cache.invalidatePrefix("products:");
    const second = getOrFetch("settings:pending", settingsFetcher, 300);
    settings.resolve(true);

    expect(await first).toBe(true);
    expect(await second).toBe(true);
    expect(settingsFetcher).toHaveBeenCalledTimes(1);
    expect(cache.get("settings:cached")).toBe(true);
  });

  it("allows a fresh query after a fetch rejects", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("Database unavailable"))
      .mockResolvedValueOnce(0);

    await expect(getOrFetch(key, fetcher, 120)).rejects.toThrow("Database unavailable");
    expect(cache.get(key)).toBeUndefined();
    expect(await getOrFetch(key, fetcher, 120)).toBe(0);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("does not cache missing products", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(1);

    expect(await getOrFetch(key, fetcher, 120)).toBeNull();
    expect(cache.get(key)).toBeUndefined();
    expect(await getOrFetch(key, fetcher, 120)).toBe(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
