import { getSession } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import RecentSales from "@/components/admin/RecentSales";
import AnalyticsChart from "@/components/admin/AnalyticsChart";
import { PageHeader } from "@/components/ui/page-header";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="DASHBOARD"
        title="Dashboard"
        description="Welcome back, Admin. Here's your store overview."
      />

      {/* Quick Navigation — compact linked pills */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
        >
          Products
        </Link>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
        >
          Orders
        </Link>
        <Link
          href="/admin/settings"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
        >
          Settings
        </Link>
        <Link
          href="/admin/audience"
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--line)] bg-[var(--panel)] px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--foreground)]"
        >
          Audience
        </Link>
      </div>

      {/* Analytics Visualization */}
      <AnalyticsChart />

      {/* Recent Sales Widget */}
      <RecentSales />
    </div>
  );
}
