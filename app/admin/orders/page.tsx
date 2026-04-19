"use client";

import { useEffect, useState } from "react";
import { OrderWithProduct } from "@/lib/orders";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/ui/page-header";
import { DataTableShell } from "@/components/ui/data-table-shell";
import { StatusBadge } from "@/components/ui/status-badge";
import { Panel } from "@/components/ui/panel";

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => res.json())
      .then((data) => {
        if (data.orders) setOrders(data.orders);
      })
      .catch(() => setError("Failed to load orders"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TRANSACTIONS"
        title="Orders"
        description="View and manage all customer orders."
      />

      <Panel padding="sm">
        <DataTableShell
          title="ORDERS"
          loading={loading}
          empty={orders.length === 0 && !loading}
          emptyContent={
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                No orders found
              </span>
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[var(--line)] hover:bg-transparent">
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  ID
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Product
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Amount
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Contact
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Status
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Gateway
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Date
                </TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow
                  key={order._id?.toString()}
                  className="border-b border-[var(--line)] hover:bg-[var(--panel-2)]"
                >
                  <TableCell className="font-mono text-xs text-[var(--text-muted)] max-w-[120px] truncate">
                    {order._id?.toString()}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {order.product?.title ? (
                      <span className="text-sm text-[var(--foreground)]">
                        {order.product.title}
                      </span>
                    ) : (
                      <span className="text-sm text-[var(--danger)]">Deleted Product</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-[var(--foreground)]">
                    Rp {(order.amountPaid || order.product?.priceIdr || 0).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.customerContact ? (
                      <span className="text-[var(--text-muted)]" title={order.customerContact}>
                        {order.customerContact}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-[var(--text-muted)]">--</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.status === "PAID" ? (
                      <StatusBadge status="success">Paid</StatusBadge>
                    ) : order.status === "PENDING" ? (
                      <StatusBadge status="pending">Pending</StatusBadge>
                    ) : (
                      <StatusBadge status="error">{order.status}</StatusBadge>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase text-[var(--text-muted)]">
                    {order.paymentGateway}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-[var(--text-muted)]">
                    {new Date(order.createdAt).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-muted)] hover:bg-[var(--panel-2)] hover:text-[var(--foreground)] transition-colors">
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          viewBox="0 0 24 24"
                        >
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>
                          <a href={`/admin/orders?id=${order._id}`} className="flex w-full">
                            View Order
                          </a>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableShell>

        {error && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            <span>{error}</span>
            <button onClick={() => setError("")} className="font-mono text-xs hover:text-red-300">
              DISMISS
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}
