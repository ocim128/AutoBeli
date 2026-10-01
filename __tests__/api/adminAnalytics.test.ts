/**
 * @vitest-environment node
 */
import { expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ aggregate: vi.fn() }));
vi.mock("@/lib/auth", () => ({ getSession: async () => ({ role: "ADMIN" }) }));
vi.mock("@/lib/db", () => ({
  getMongoClient: async () => ({
    db: () => ({ collection: () => ({ aggregate: mocks.aggregate }) }),
  }),
}));

import { GET } from "@/app/api/admin/analytics/route";

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
