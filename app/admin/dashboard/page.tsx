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
    <div className="space-y-8">
      <PageHeader
        eyebrow="DASHBOARD"
        title="Dashboard"
        description="Welcome back, Admin. Here's your store overview."
      />

      {/* Quick Navigation */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/admin/products"
          className="group rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--panel-2)]"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
            Products
          </span>
          <h2 className="mt-1 font-serif text-lg text-[var(--foreground)]">Manage Products</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Create, edit, and activate text products.
          </p>
        </Link>
        <Link
          href="/admin/orders"
          className="group rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--panel-2)]"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
            Orders
          </span>
          <h2 className="mt-1 font-serif text-lg text-[var(--foreground)]">Manage Orders</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">View customer orders and status.</p>
        </Link>
        <Link
          href="/admin/settings"
          className="group rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--panel-2)]"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
            Settings
          </span>
          <h2 className="mt-1 font-serif text-lg text-[var(--foreground)]">Email Settings</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Review outbound email status and order recovery guidance.
          </p>
        </Link>
        <Link
          href="/admin/audience"
          className="group rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5 transition-colors hover:border-[var(--line-strong)] hover:bg-[var(--panel-2)]"
        >
          <span className="font-mono text-[0.65rem] uppercase tracking-wider text-[var(--text-muted)]">
            Audience
          </span>
          <h2 className="mt-1 font-serif text-lg text-[var(--foreground)]">Audience</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Manage saved customer emails and export the list.
          </p>
        </Link>
      </div>

      {/* Analytics Visualization */}
      <AnalyticsChart />

      {/* Recent Sales Widget */}
      <RecentSales />
    </div>
  );
}
