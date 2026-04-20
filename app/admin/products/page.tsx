"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface ProductWithStock {
  slug: string;
  title: string;
  priceIdr: number;
  isActive: boolean;
  isSold?: boolean;
  createdAt: Date;
  stockItems?: Array<{ isSold: boolean }>;
}

function getStockInfo(product: ProductWithStock) {
  if (product.stockItems && product.stockItems.length > 0) {
    const available = product.stockItems.filter((item) => !item.isSold).length;
    const total = product.stockItems.length;
    return { available, total, hasStock: true };
  }
  return {
    available: product.isSold ? 0 : 1,
    total: 1,
    hasStock: false,
  };
}

export default function ProductList() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="CATALOG"
        title="Products"
        description="Manage your product catalog, stock, and delivery content."
      />

      <Panel padding="sm">
        <DataTableShell
          title="PRODUCTS"
          loading={loading}
          empty={filtered.length === 0 && !loading}
          emptyContent={
            <div className="flex flex-col items-center gap-3 py-8">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                No products found
              </span>
              <Link href="/admin/products/create">
                <Button size="sm">Create First Product</Button>
              </Link>
            </div>
          }
          toolbar={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs sm:w-56"
              />
              <Link href="/admin/products/create">
                <Button size="sm">Add New</Button>
              </Link>
            </div>
          }
        >
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[var(--line)] hover:bg-transparent">
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Title
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Price
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Stock
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Status
                </TableHead>
                <TableHead className="font-mono text-[0.7rem] uppercase tracking-wider text-[var(--text-muted)]">
                  Created
                </TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const stock = getStockInfo(p);
                const isSoldOut = stock.available === 0;

                return (
                  <TableRow
                    key={p.slug}
                    className="border-b border-[var(--line)] hover:bg-[var(--panel-2)]"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm text-[var(--foreground)]">
                          {p.title}
                        </span>
                        <span className="font-mono text-[0.65rem] text-[var(--text-muted)]">
                          /{p.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm tabular-nums text-[var(--foreground)]">
                      Rp {p.priceIdr.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-mono text-xs tabular-nums font-medium ${
                            isSoldOut ? "text-[var(--danger)]" : "text-[var(--success)]"
                          }`}
                        >
                          {stock.available}
                        </span>
                        <span className="font-mono text-[0.65rem] tabular-nums text-[var(--text-muted)]">
                          /{stock.total}
                        </span>
                        {stock.hasStock && (
                          <span className="ml-1 font-mono text-[0.55rem] uppercase tracking-wider text-[var(--accent)] bg-[var(--accent-soft)] px-1 py-px rounded-[var(--radius-sm)]">
                            Multi
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {isSoldOut ? (
                        <StatusBadge status="warning">Sold Out</StatusBadge>
                      ) : p.isActive ? (
                        <StatusBadge status="success">Active</StatusBadge>
                      ) : (
                        <StatusBadge status="neutral">Inactive</StatusBadge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-[0.7rem] text-[var(--text-muted)]">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label="Product actions"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:bg-[var(--panel-2)] hover:text-[var(--foreground)] transition-colors"
                        >
                          <svg
                            width="14"
                            height="14"
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
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem>
                            <Link href={`/admin/products/${p.slug}/edit`} className="flex w-full">
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link href={`/admin/products/${p.slug}/stock`} className="flex w-full">
                              Stock
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/admin/products/${p.slug}/broadcast`}
                              className="flex w-full"
                            >
                              Broadcast
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Link
                              href={`/admin/products/create?sourceSlug=${p.slug}`}
                              className="flex w-full"
                            >
                              Duplicate
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTableShell>

        {error && (
          <div className="mt-4 flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-4 py-2 text-sm text-[var(--danger)]">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              className="font-mono text-xs hover:text-[var(--danger)]"
            >
              DISMISS
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}
