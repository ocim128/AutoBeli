"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Field } from "@/components/ui/field";
import { MetricCard } from "@/components/ui/metric-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "sonner";

interface StockItem {
  id: string;
  content: string;
  isSold: boolean;
  soldAt?: string;
  orderId?: string;
}

interface StockPageProps {
  params: Promise<{ slug: string }>;
}

interface BulkPreviewItem {
  email: string;
  username: string;
  password: string;
  sessionid: string;
  twoFALink?: string;
  rawContent: string;
}

interface BulkError {
  line: number;
  content: string;
}

export default function StockManagementPage({ params }: StockPageProps) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [legacyContent, setLegacyContent] = useState<string | null>(null);
  const [productTitle, setProductTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newContent, setNewContent] = useState("");
  const [addingStock, setAddingStock] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Bulk stock states
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkContent, setBulkContent] = useState("");
  const [addingBulk, setAddingBulk] = useState(false);
  const [bulkPreview, setBulkPreview] = useState<BulkPreviewItem[]>([]);
  const [bulkErrors, setBulkErrors] = useState<BulkError[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  // Fetch product and stock data
  useEffect(() => {
    if (!slug) return;

    const fetchData = async () => {
      try {
        const productRes = await fetch(`/api/products?slug=${slug}`);
        const productData = await productRes.json();
        if (productData.product) {
          setProductTitle(productData.product.title);
        }

        const stockRes = await fetch(`/api/products/stock?slug=${slug}`);
        const stockData = await stockRes.json();

        if (stockData.stockItems) {
          setStockItems(stockData.stockItems);
        }
        if (stockData.legacyContent) {
          setLegacyContent(stockData.legacyContent);
        }
      } catch (err) {
        console.error("Failed to load stock data:", err);
        setError("Failed to load stock data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    setAddingStock(true);
    setError("");

    try {
      const res = await fetch("/api/products/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, content: newContent.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add stock");
      }

      // Refresh stock list
      const stockRes = await fetch(`/api/products/stock?slug=${slug}`);
      const stockData = await stockRes.json();
      if (stockData.stockItems) {
        setStockItems(stockData.stockItems);
      }

      setNewContent("");
      toast.success("Stock item added successfully.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add stock");
      }
    } finally {
      setAddingStock(false);
    }
  };

  const handleDeleteStock = async (stockItemId: string) => {
    try {
      const res = await fetch("/api/products/stock", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, stockItemId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }

      setStockItems((prev) => prev.filter((item) => item.id !== stockItemId));
      setDeleteTarget(null);
      toast.success("Stock item removed.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete stock item");
      }
    }
  };

  const handleEditStock = async (stockItemId: string) => {
    if (!editContent.trim()) return;

    try {
      const res = await fetch("/api/products/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, stockItemId, content: editContent.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update");
      }

      setStockItems((prev) =>
        prev.map((item) =>
          item.id === stockItemId ? { ...item, content: editContent.trim() } : item
        )
      );

      setEditingId(null);
      setEditContent("");
      toast.success("Stock item updated.");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update stock item");
      }
    }
  };

  const startEditing = (item: StockItem) => {
    setEditingId(item.id);
    setEditContent(item.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  // Bulk stock handlers
  const handlePreviewBulk = async () => {
    if (!bulkContent.trim()) return;

    try {
      const { convertBulkRawInput } = await import("@/lib/stockConverter");
      const { converted, errors } = convertBulkRawInput(bulkContent);
      setBulkPreview(converted);
      setBulkErrors(errors);
      setShowPreview(true);
    } catch (err) {
      console.error("Preview error:", err);
      setError("Failed to preview bulk input");
    }
  };

  const handleAddBulkStock = async () => {
    if (!bulkContent.trim()) return;

    setAddingBulk(true);
    setError("");

    try {
      const res = await fetch("/api/products/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, bulkRaw: bulkContent.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add bulk stock");
      }

      // Refresh stock list
      const stockRes = await fetch(`/api/products/stock?slug=${slug}`);
      const stockData = await stockRes.json();
      if (stockData.stockItems) {
        setStockItems(stockData.stockItems);
      }

      setBulkContent("");
      setBulkPreview([]);
      setBulkErrors([]);
      setShowPreview(false);

      toast.success(`Successfully added ${data.addedCount} stock item(s).`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add bulk stock");
      }
    } finally {
      setAddingBulk(false);
    }
  };

  if (loading && !slug)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );

  const availableCount = stockItems.filter((item) => !item.isSold).length;
  const soldCount = stockItems.filter((item) => item.isSold).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <PageHeader
          eyebrow="STOCK MANAGEMENT"
          title={productTitle || slug}
          description={`/${slug}`}
        />
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-mono text-xs hover:text-red-300">
            DISMISS
          </button>
        </div>
      )}

      {/* Stock Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard label="Total Stock" value={stockItems.length} />
        <MetricCard
          label="Available"
          value={availableCount}
          trend={availableCount > 0 ? "up" : "flat"}
        />
        <MetricCard label="Sold" value={soldCount} />
      </div>

      {/* Legacy Content Notice */}
      {legacyContent && stockItems.length === 0 && (
        <Panel variant="accent" padding="md">
          <div className="flex items-start gap-3">
            <StatusBadge status="warning">Legacy</StatusBadge>
            <div>
              <p className="text-sm text-[var(--foreground)]">
                This product has a single content item (old system). Add new stock items below to
                enable multi-stock mode.
              </p>
              <details className="mt-3">
                <summary className="cursor-pointer font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--foreground)]">
                  View legacy content
                </summary>
                <pre className="mt-2 rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3 text-xs font-mono text-[var(--text-muted)] overflow-auto max-h-32">
                  {legacyContent}
                </pre>
              </details>
            </div>
          </div>
        </Panel>
      )}

      {/* Add New Stock Form */}
      <Panel monoLabel="ADD STOCK" title="New Stock Item">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setBulkMode(false)}
            className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors ${
              !bulkMode
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--line)]"
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setBulkMode(true)}
            className={`font-mono text-xs uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors ${
              bulkMode
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)] border border-[var(--line)]"
            }`}
          >
            Bulk
          </button>
        </div>

        {!bulkMode ? (
          /* Single Stock Form */
          <form onSubmit={handleAddStock} className="space-y-4">
            <Field label="Content (Unique data to sell)" monoLabel htmlFor="newContent">
              <Textarea
                id="newContent"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Enter the unique content for this stock item..."
                rows={4}
                className="font-mono text-sm"
                required
              />
            </Field>
            <div className="flex justify-end">
              <Button type="submit" disabled={addingStock || !newContent.trim()} size="sm">
                {addingStock ? "Adding..." : "Add Stock Item"}
              </Button>
            </div>
          </form>
        ) : (
          /* Bulk Stock Form */
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-muted)]">
              Paste multiple lines of raw data. Each line will be processed and converted to a stock
              item.
            </p>
            <Field
              label="Raw Input (one line = one stock item)"
              monoLabel
              htmlFor="bulkContent"
              helper="Format A: email_prefix post *follower year @username =sessionid [password] [2FA:secret] | Format B: email@akunlama.com username password #sessionid:token &2FASECRET"
            >
              <Textarea
                id="bulkContent"
                value={bulkContent}
                onChange={(e) => {
                  setBulkContent(e.target.value);
                  setShowPreview(false);
                }}
                placeholder={`catm881100my0 62 *2152  2016 @hatm881100 =3274316224%3ARD1A7icsUgwZQw%3A10
csseed240my00 57 *180  2019 @psseed240 =13115626853%3AsXmi2TaS4UQEry%3A0 @asem777`}
                rows={6}
                className="font-mono text-sm"
              />
            </Field>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviewBulk}
                disabled={!bulkContent.trim()}
              >
                Preview
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddBulkStock}
                disabled={addingBulk || !bulkContent.trim()}
              >
                {addingBulk ? "Adding..." : "Add All Stock"}
              </Button>
            </div>

            {/* Preview Section */}
            {showPreview && (
              <div className="space-y-3 pt-4 border-t border-[var(--line)]">
                <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  Preview -- {bulkPreview.length} items to add
                  {bulkErrors.length > 0 && (
                    <span className="text-[var(--danger)] ml-2">({bulkErrors.length} errors)</span>
                  )}
                </span>

                {/* Errors */}
                {bulkErrors.length > 0 && (
                  <div className="rounded-lg border border-red-500/25 bg-red-500/10 p-3">
                    <p className="font-mono text-xs uppercase tracking-wider text-red-400 mb-2">
                      Failed to parse {bulkErrors.length} line(s):
                    </p>
                    <ul className="text-xs text-red-400 space-y-1">
                      {bulkErrors.map((err, i) => (
                        <li key={i} className="font-mono">
                          <span className="bg-red-500/20 px-1 rounded">Line {err.line}:</span>{" "}
                          {err.content.substring(0, 50)}...
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Preview Items */}
                <div className="space-y-2 max-h-64 overflow-auto">
                  {bulkPreview.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          #{index + 1}
                        </span>
                        <span className="text-sm font-medium text-[var(--accent)]">
                          {item.email}
                        </span>
                      </div>
                      <pre className="text-xs text-[var(--text-muted)] font-mono whitespace-pre-wrap">
                        {item.rawContent}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Panel>

      {/* Stock Items List */}
      <Panel monoLabel="INVENTORY" title={`Stock Items (${stockItems.length})`} padding="sm">
        {stockItems.length === 0 ? (
          <div className="py-8 text-center">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
              No stock items yet. Add your first stock item above.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-[var(--line)]">
            {stockItems.map((item, index) => (
              <div key={item.id} className={`p-4 ${item.isSold ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-[var(--text-muted)]">
                        #{index + 1}
                      </span>
                      {item.isSold ? (
                        <StatusBadge status="info">Sold</StatusBadge>
                      ) : (
                        <StatusBadge status="success">Available</StatusBadge>
                      )}
                      {item.soldAt && (
                        <span className="font-mono text-xs text-[var(--text-muted)]">
                          {new Date(item.soldAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {editingId === item.id ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <Button size="xs" onClick={() => handleEditStock(item.id)}>
                            Save
                          </Button>
                          <Button size="xs" variant="outline" onClick={cancelEditing}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <pre className="text-sm font-mono text-[var(--text-muted)] bg-[var(--panel-2)] border border-[var(--line)] p-3 rounded-md overflow-auto max-h-24">
                        {item.content}
                      </pre>
                    )}

                    {item.orderId && (
                      <div className="mt-2">
                        <Link
                          href={`/admin/orders?id=${item.orderId}`}
                          className="font-mono text-xs text-[var(--accent)] hover:underline"
                        >
                          View Order
                        </Link>
                      </div>
                    )}
                  </div>

                  {!item.isSold && editingId !== item.id && (
                    <div className="flex gap-2 shrink-0 items-center">
                      <Button size="xs" variant="outline" onClick={() => startEditing(item)}>
                        Edit
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger>
                          <Button size="xs" variant="destructive">
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Stock Item</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This stock item will be permanently
                              removed from inventory.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteStock(item.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Quick Actions */}
      <div className="flex gap-4 justify-center">
        <Link
          href={`/admin/products/${slug}/edit`}
          className="font-mono text-xs uppercase tracking-wider text-[var(--accent)] hover:underline"
        >
          Edit Product Details
        </Link>
        <Link
          href="/admin/products"
          className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--foreground)]"
        >
          Back to Products
        </Link>
      </div>
    </div>
  );
}
