"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Panel } from "@/components/ui/panel";
import { MetricCard } from "@/components/ui/metric-card";
import Spinner from "@/components/ui/Spinner";

interface DailyData {
  date: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  title: string;
  revenue: number;
  quantity: number;
}

interface AnalyticsData {
  dailyRevenue: DailyData[];
  topProducts: TopProduct[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
  };
}

export default function AnalyticsChart() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setData(data);
      })
      .catch(() => {
        if (!cancelled) setError("Failed to load analytics data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} variant="classic" className="text-[var(--text-muted)]" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Panel monoLabel="ANALYTICS">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="font-mono text-sm text-[var(--text-muted)]">
            Failed to load analytics data.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 font-mono text-xs text-[var(--accent)] hover:underline"
          >
            Retry
          </button>
        </div>
      </Panel>
    );
  }

  const chartData = data.dailyRevenue.map((d) => ({
    ...d,
    shortDate: new Date(d.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Revenue"
          value={`Rp ${data.summary.totalRevenue.toLocaleString("id-ID")}`}
          sublabel="All time"
          trend="up"
        />
        <MetricCard
          label="Total Orders"
          value={data.summary.totalOrders}
          sublabel="All time"
          trend="flat"
        />
        <MetricCard
          label="Avg. Order Value"
          value={`Rp ${data.summary.avgOrderValue.toLocaleString("id-ID")}`}
          sublabel="Per transaction"
          trend="flat"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Daily Revenue Chart */}
        <Panel monoLabel="REVENUE / LAST 7 DAYS" className="lg:col-span-8">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--line)" />
                <XAxis
                  dataKey="shortDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "var(--text-muted)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                  }}
                  dy={10}
                />
                <YAxis hide={true} />
                <Tooltip
                  cursor={{ fill: "var(--panel-3)" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border border-[var(--line)] bg-[var(--panel-2)] px-4 py-3 shadow-xl">
                          <span className="mb-1 block font-mono text-[0.65rem] uppercase tracking-widest text-[var(--text-muted)]">
                            {payload[0].payload.date}
                          </span>
                          <p className="font-serif text-lg text-[var(--foreground)]">
                            Rp {payload[0].value?.toLocaleString("id-ID")}
                          </p>
                          <p className="font-mono text-xs text-[var(--text-muted)]">
                            {payload[0].payload.orders} orders
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]} barSize={40}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === chartData.length - 1 ? "var(--accent)" : "var(--panel-3)"}
                      className="transition-colors duration-200"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Top Products */}
        <Panel monoLabel="TOP PRODUCTS" className="lg:col-span-4">
          <div className="space-y-4">
            {data.topProducts.length === 0 ? (
              <p className="py-8 text-center font-mono text-sm text-[var(--text-muted)]">
                No data available
              </p>
            ) : (
              data.topProducts.map((product, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between border-b border-[var(--line)] pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[var(--foreground)]">{product.title}</p>
                    <span className="font-mono text-[0.65rem] uppercase text-[var(--text-muted)]">
                      {product.quantity} sold
                    </span>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="font-serif text-sm text-[var(--foreground)]">
                      Rp {product.revenue.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
