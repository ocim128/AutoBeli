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
    fetch("/api/admin/analytics")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch analytics");
        return res.json();
      })
      .then((data) => setData(data))
      .catch(() => setError("Failed to load analytics data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="h-80 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse flex items-center justify-center">
          <span className="text-gray-400">Loading charts...</span>
        </div>
        <div className="h-80 bg-white rounded-2xl border border-gray-100 shadow-sm animate-pulse flex items-center justify-center">
          <span className="text-gray-400">Loading stats...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return null; // Silently fail or show error
  }

  // Format date for chart (e.g., "Jan 11")
  const chartData = data.dailyRevenue.map((d) => ({
    ...d,
    shortDate: new Date(d.date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div className="space-y-8 mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
            Total Revenue
          </p>
          <p className="text-2xl font-black text-green-600">
            Rp {data.summary.totalRevenue.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
            Total Orders
          </p>
          <p className="text-2xl font-black text-gray-900">{data.summary.totalOrders}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">
            Avg. Order Value
          </p>
          <p className="text-2xl font-black text-indigo-600">
            Rp {data.summary.avgOrderValue.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Revenue Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6">Revenue (Last 7 Days)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="shortDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                  dy={10}
                />
                <YAxis hide={true} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-800">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            {payload[0].payload.date}
                          </p>
                          <p className="font-bold text-green-400">
                            Rp {payload[0].value?.toLocaleString("id-ID")}
                          </p>
                          <p className="text-xs text-slate-300">
                            {payload[0].payload.orders} orders
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === chartData.length - 1 ? "#6366f1" : "#e2e8f0"}
                      className="hover:fill-indigo-500 transition-colors duration-200"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black text-gray-900 mb-6">Top Products</h3>
          <div className="space-y-4">
            {data.topProducts.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No data available</p>
            ) : (
              data.topProducts.map((product, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                      {product.title}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">
                      {product.quantity} sold
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-black text-gray-900">
                      Rp {product.revenue.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          {data.topProducts.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between text-xs">
              <span className="text-gray-400 font-medium">Bestsellers ranking</span>
              <span className="text-indigo-600 font-black">View All →</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
