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
import { collectUnsoldUsernames } from "@/lib/stockConverter";
import { toast } from "sonner";

interface ProductWithStock {
  slug: string;
  title: string;
  priceIdr: number;
  isActive: boolean;
  isSold?: boolean;
  createdAt: Date;
  stockItems?: Array<{ isSold: boolean }>;
}

interface StockResponse {
  stockItems?: Array<{ content: string; isSold: boolean }>;
  legacyContent?: string | null;
  error?: string;
}

function collectUnsoldContent(
  stockItems: Array<{ content: string; isSold: boolean }>,
  legacyContent?: string | null
) {
  const contentList = stockItems
    .filter((item) => !item.isSold)
    .map((item) => item.content.trim())
    .filter(Boolean);

  if (stockItems.length > 0 || !legacyContent?.trim()) {
    return contentList;
  }

  return [legacyContent.trim()];
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
  const [copyingSlug, setCopyingSlug] = useState<string | null>(null);
  const [copyingAll, setCopyingAll] = useState(false);
  const [copyingAllUnsold, setCopyingAllUnsold] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .catch(() => setError("Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  const getUnsoldUsernamesForProduct = async (product: ProductWithStock) => {
    const res = await fetch(`/api/products/stock?slug=${encodeURIComponent(product.slug)}`);
    const data = (await res.json()) as StockResponse;

    if (!res.ok) {
      throw new Error(data.error || `Failed to load stock for ${product.slug}`);
    }

    return collectUnsoldUsernames(data.stockItems || [], data.legacyContent);
  };

  const getUnsoldContentForProduct = async (product: ProductWithStock) => {
    const res = await fetch(`/api/products/stock?slug=${encodeURIComponent(product.slug)}`);
    const data = (await res.json()) as StockResponse;

    if (!res.ok) {
      throw new Error(data.error || `Failed to load stock for ${product.slug}`);
    }

    return collectUnsoldContent(data.stockItems || [], data.legacyContent);
  };

  const copyUsernamesToClipboard = async (usernames: string[], successLabel: string) => {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard is unavailable in this browser");
    }

    if (usernames.length === 0) {
      throw new Error("No usernames found in unsold content");
    }

    await navigator.clipboard.writeText(usernames.join("\n"));
    toast.success(successLabel);
  };

  const copyUnsoldContentToClipboard = async (contentList: string[], successLabel: string) => {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard is unavailable in this browser");
    }

    if (contentList.length === 0) {
      throw new Error("No unsold content found");
    }

    await navigator.clipboard.writeText(contentList.join("\n\n"));
    toast.success(successLabel);
  };

  const handleCopyAllUsernames = async (product: ProductWithStock) => {
    setCopyingSlug(product.slug);
    setError("");

    try {
      const usernames = await getUnsoldUsernamesForProduct(product);
      await copyUsernamesToClipboard(
        usernames,
        `Copied ${usernames.length} unsold username${usernames.length > 1 ? "s" : ""}.`
      );
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Failed to copy usernames");
    } finally {
      setCopyingSlug(null);
    }
  };

  const handleCopyAllProductsUsernames = async () => {
    setCopyingAll(true);
    setError("");

    try {
      const productsWithStock = products.filter((product) => getStockInfo(product).available > 0);
      const usernameLists = await Promise.all(
        productsWithStock.map((product) => getUnsoldUsernamesForProduct(product))
      );
      const usernames = usernameLists.flat();

      await copyUsernamesToClipboard(
        usernames,
        `Copied ${usernames.length} unsold username${usernames.length > 1 ? "s" : ""} from ${productsWithStock.length} product${productsWithStock.length > 1 ? "s" : ""}.`
      );
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Failed to copy usernames");
    } finally {
      setCopyingAll(false);
    }
  };

  const handleCopyAllUnsold = async () => {
    setCopyingAllUnsold(true);
    setError("");

    try {
      const productsWithStock = products.filter((product) => getStockInfo(product).available > 0);
      const contentLists = await Promise.all(
        productsWithStock.map((product) => getUnsoldContentForProduct(product))
      );
      const contentList = contentLists.flat();

      await copyUnsoldContentToClipboard(
        contentList,
        `Copied ${contentList.length} unsold item${contentList.length > 1 ? "s" : ""} from ${productsWithStock.length} product${productsWithStock.length > 1 ? "s" : ""}.`
      );
    } catch (copyError) {
      setError(copyError instanceof Error ? copyError.message : "Failed to copy unsold content");
    } finally {
      setCopyingAllUnsold(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );
  const hasAvailableProducts = products.some((product) => getStockInfo(product).available > 0);

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
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyAllProductsUsernames}
                disabled={
                  loading ||
                  !hasAvailableProducts ||
                  copyingAll ||
                  copyingAllUnsold ||
                  copyingSlug !== null
                }
              >
                {copyingAll ? "Copying All..." : "Copy All Usernames"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyAllUnsold}
                disabled={
                  loading ||
                  !hasAvailableProducts ||
                  copyingAll ||
                  copyingAllUnsold ||
                  copyingSlug !== null
                }
              >
                {copyingAllUnsold ? "Copying Unsold..." : "Copy All Unsold"}
              </Button>
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
                        <DropdownMenuContent align="end" className="w-48">
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
                          <DropdownMenuItem
                            disabled={
                              isSoldOut || copyingAll || copyingAllUnsold || copyingSlug === p.slug
                            }
                            onClick={() => handleCopyAllUsernames(p)}
                          >
                            {copyingSlug === p.slug ? "Copying..." : "Copy All Usernames"}
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
