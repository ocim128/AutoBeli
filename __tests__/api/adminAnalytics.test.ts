/**
 * @vitest-environment node
 */
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ aggregate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: async () => ({ role: "ADMIN" }) }));
vi.mock("@/lib/db", () => ({
  getMongoClient: async () => ({
    db: () => ({ collection: () => ({ aggregate: mocks.aggregate }) }),
  }),
}));

import { GET } from "@/app/api/admin/analytics/route";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

it("starts all dashboard reads before waiting and preserves the response", async () => {
  const resolveQueries: ((value: unknown[]) => void)[] = [];
  mocks.aggregate.mockImplementation(() => ({
    toArray: () => new Promise<unknown[]>((resolve) => resolveQueries.push(resolve)),
  }));
  const responsePromise = GET(new Request("http://localhost/api/admin/analytics"));
  await vi.waitFor(() => expect(resolveQueries).toHaveLength(3));
  resolveQueries[0]([]);
  resolveQueries[1]([{ title: "Test product", revenue: 10000 }]);
  resolveQueries[2]([{ totalRevenue: 10000, totalOrders: 2, avgOrderValue: 5000 }]);
  const response = await responsePromise;
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({
    dailyRevenue: expect.arrayContaining([expect.objectContaining({ revenue: 0, orders: 0 })]),
    topProducts: [{ title: "Test product", revenue: 10000 }],
    summary: { totalRevenue: 10000, totalOrders: 2, avgOrderValue: 5000 },
  });
});

it.each(["UTC", "Asia/Jakarta", "America/New_York"])(
  "uses exactly seven UTC dates when the host timezone is %s",
  async (timezone) => {
    vi.stubEnv("TZ", timezone);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-02T00:00:00.000Z"));
    mocks.aggregate.mockReset();
    mocks.aggregate
      .mockReturnValueOnce({
        toArray: async () => [
          { _id: "2026-09-26", revenue: 10000, orders: 1 },
          { _id: "2026-10-02", revenue: 25000, orders: 2 },
        ],
      })
      .mockReturnValue({ toArray: async () => [] });

    const response = await GET(new Request("http://localhost/api/admin/analytics"));
    const { dailyRevenue } = await response.json();

    expect(mocks.aggregate.mock.calls[0][0][0].$match.paidAt).toEqual({
      $gte: new Date("2026-09-26T00:00:00.000Z"),
      $lt: new Date("2026-10-03T00:00:00.000Z"),
    });
    expect(dailyRevenue.map((row: { date: string }) => row.date)).toEqual([
      "2026-09-26",
      "2026-09-27",
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
    ]);
    expect(dailyRevenue[0]).toEqual({ date: "2026-09-26", revenue: 10000, orders: 1 });
    expect(dailyRevenue[6]).toEqual({ date: "2026-10-02", revenue: 25000, orders: 2 });
    expect(dailyRevenue[1]).toEqual({ date: "2026-09-27", revenue: 0, orders: 0 });
  }
);
