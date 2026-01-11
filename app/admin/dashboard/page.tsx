import { getSession, logoutAdmin } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import RecentSales from "@/components/admin/RecentSales";
import AnalyticsChart from "@/components/admin/AnalyticsChart";

export default async function AdminDashboard() {
  const session = await getSession(); // Verify server-side for extra safety
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-10">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-8 md:p-12 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -mr-32 -mt-32" />

        <div className="relative">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-indigo-200 font-medium">
            Welcome back, Admin. Here&apos;s your store overview.
          </p>
        </div>

        <div className="flex items-center gap-4 relative">
          <form
            action={async () => {
              "use server";
              await logoutAdmin();
              redirect("/admin/login");
            }}
          >
            <button className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-6 rounded-2xl backdrop-blur-md transition-all">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      {/* Quick Stats & Navigation */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link
          href="/admin/products"
          className="block rounded-lg border p-6 hover:bg-gray-50 transition"
        >
          <h2 className="text-xl font-semibold">Manage Products</h2>
          <p className="text-gray-500">Create, edit, and activate text products.</p>
        </Link>
        <Link
          href="/admin/orders"
          className="block rounded-lg border p-6 hover:bg-gray-50 transition"
        >
          <h2 className="text-xl font-semibold">Manage Orders</h2>
          <p className="text-gray-500">View customer orders and status.</p>
        </Link>
        <Link
          href="/admin/settings"
          className="block rounded-lg border p-6 hover:bg-gray-50 transition"
        >
          <h2 className="text-xl font-semibold">Email Settings</h2>
          <p className="text-gray-500">Configure Mailgun email notifications.</p>
        </Link>
      </div>

      {/* Analytics Visualization */}
      <AnalyticsChart />

      {/* Recent Sales Widget */}
      <RecentSales />
    </div>
  );
}
