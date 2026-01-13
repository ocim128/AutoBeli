"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
        // Fetch product info
        const productRes = await fetch(`/api/products?slug=${slug}`);
        const productData = await productRes.json();
        if (productData.product) {
          setProductTitle(productData.product.title);
        }

        // Fetch stock items
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
    if (!confirm("Are you sure you want to delete this stock item?")) return;

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

      // Remove from local state
      setStockItems((prev) => prev.filter((item) => item.id !== stockItemId));
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

      // Update local state
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === stockItemId ? { ...item, content: editContent.trim() } : item
        )
      );

      setEditingId(null);
      setEditContent("");
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
      // Import the converter dynamically for client-side preview
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

      // Reset bulk form
      setBulkContent("");
      setBulkPreview([]);
      setBulkErrors([]);
      setShowPreview(false);

      // Show success message with count
      alert(`Successfully added ${data.addedCount} stock item(s)!`);
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

  if (loading && !slug) return <div>Initializing...</div>;
  if (loading) return <div>Loading stock data...</div>;

  const availableCount = stockItems.filter((item) => !item.isSold).length;
  const soldCount = stockItems.filter((item) => item.isSold).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stock Management</h1>
          <p className="text-gray-500">{productTitle || slug}</p>
        </div>
        <button onClick={() => router.back()} className="px-4 py-2 border rounded hover:bg-gray-50">
          Back
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <button onClick={() => setError("")} className="float-right font-bold">
            ×
          </button>
        </div>
      )}

      {/* Stock Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-3xl font-bold text-gray-900">{stockItems.length}</div>
          <div className="text-sm text-gray-500">Total Stock</div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-3xl font-bold text-green-600">{availableCount}</div>
          <div className="text-sm text-gray-500">Available</div>
        </div>
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{soldCount}</div>
          <div className="text-sm text-gray-500">Sold</div>
        </div>
      </div>

      {/* Legacy Content Notice */}
      {legacyContent && stockItems.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded mb-6">
          <strong>Legacy Product:</strong> This product has a single content item (old system). Add
          new stock items below to enable multi-stock mode.
          <details className="mt-2">
            <summary className="cursor-pointer text-sm">View legacy content</summary>
            <pre className="mt-2 p-2 bg-yellow-100 rounded text-xs overflow-auto max-h-32">
              {legacyContent}
            </pre>
          </details>
        </div>
      )}

      {/* Add New Stock Form */}
      <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
        {/* Mode Tabs */}
        <div className="flex gap-4 mb-4 border-b">
          <button
            onClick={() => setBulkMode(false)}
            className={`pb-2 px-1 font-semibold ${!bulkMode ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📝 Single Stock
          </button>
          <button
            onClick={() => setBulkMode(true)}
            className={`pb-2 px-1 font-semibold ${bulkMode ? "text-indigo-600 border-b-2 border-indigo-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            📦 Bulk Stock
          </button>
        </div>

        {!bulkMode ? (
          /* Single Stock Form */
          <>
            <h2 className="text-lg font-semibold mb-4">Add Single Stock Item</h2>
            <form onSubmit={handleAddStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Content (Unique data to sell)
                </label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter the unique content for this stock item..."
                  rows={4}
                  className="w-full border rounded p-3 font-mono text-sm bg-yellow-50"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingStock || !newContent.trim()}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                  {addingStock ? "Adding..." : "+ Add Stock Item"}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* Bulk Stock Form */
          <>
            <h2 className="text-lg font-semibold mb-2">Bulk Add Stock Items</h2>
            <p className="text-sm text-gray-500 mb-4">
              Paste multiple lines of raw data. Each line will be processed and converted to a stock
              item.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Raw Input (one line = one stock item)
                </label>
                <textarea
                  value={bulkContent}
                  onChange={(e) => {
                    setBulkContent(e.target.value);
                    setShowPreview(false);
                  }}
                  placeholder={`catm881100my0♦62 *2152 ♠2016 @hatm881100 =3274316224%3ARD1A7icsUgwZQw%3A10
csseed240my00♦57 *180 ♠2019 @psseed240 =13115626853%3AsXmi2TaS4UQEry%3A0 @asem777
cayleenbarronku15ssrm♦52 *64 ♠2023 @aracelyhooperys10 =58471294198%3AvNXktennj6Xd52%3A0 2FA:MHMZGO4DGK65C4SSMAU74Z2G32IFPGAY`}
                  rows={6}
                  className="w-full border rounded p-3 font-mono text-sm bg-blue-50"
                />
                <div className="text-xs text-gray-400 mt-1">
                  Format: email_prefix♦post *follower ♠year @username =sessionid [password]
                  [2FA:secret]
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handlePreviewBulk}
                  disabled={!bulkContent.trim()}
                  className="px-4 py-2 border border-indigo-600 text-indigo-600 rounded hover:bg-indigo-50 disabled:opacity-50"
                >
                  👁️ Preview
                </button>
                <button
                  type="button"
                  onClick={handleAddBulkStock}
                  disabled={addingBulk || !bulkContent.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                >
                  {addingBulk ? "Adding..." : "📦 Add All Stock"}
                </button>
              </div>

              {/* Preview Section */}
              {showPreview && (
                <div className="mt-4 border-t pt-4">
                  <h3 className="font-semibold text-sm mb-3">
                    Preview ({bulkPreview.length} items to add)
                    {bulkErrors.length > 0 && (
                      <span className="text-red-600 ml-2">({bulkErrors.length} errors)</span>
                    )}
                  </h3>

                  {/* Errors */}
                  {bulkErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                      <p className="text-red-700 font-medium text-sm mb-2">
                        Failed to parse {bulkErrors.length} line(s):
                      </p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {bulkErrors.map((err, i) => (
                          <li key={i}>
                            <span className="font-mono bg-red-100 px-1 rounded">
                              Line {err.line}:
                            </span>{" "}
                            {err.content.substring(0, 50)}...
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Preview Items */}
                  <div className="space-y-3 max-h-64 overflow-auto">
                    {bulkPreview.map((item, index) => (
                      <div key={index} className="bg-gray-50 rounded p-3 border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                          <span className="text-sm font-medium text-indigo-700">{item.email}</span>
                        </div>
                        <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap">
                          {item.rawContent}
                        </pre>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Stock Items List */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Stock Items ({stockItems.length})</h2>
        </div>

        {stockItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No stock items yet. Add your first stock item above.
          </div>
        ) : (
          <div className="divide-y">
            {stockItems.map((item, index) => (
              <div key={item.id} className={`p-4 ${item.isSold ? "bg-gray-50" : ""}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                      {item.isSold ? (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          SOLD
                        </span>
                      ) : (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          AVAILABLE
                        </span>
                      )}
                      {item.soldAt && (
                        <span className="text-xs text-gray-400">
                          {new Date(item.soldAt).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {editingId === item.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full border rounded p-2 font-mono text-sm bg-yellow-50"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditStock(item.id)}
                            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 border text-sm rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <pre className="text-sm text-gray-700 font-mono bg-gray-100 p-2 rounded overflow-auto max-h-24">
                        {item.content}
                      </pre>
                    )}

                    {item.orderId && (
                      <div className="mt-2">
                        <Link
                          href={`/admin/orders?id=${item.orderId}`}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          View Order →
                        </Link>
                      </div>
                    )}
                  </div>

                  {!item.isSold && editingId !== item.id && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEditing(item)}
                        className="px-3 py-1 text-indigo-600 border border-indigo-200 text-sm rounded hover:bg-indigo-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStock(item.id)}
                        className="px-3 py-1 text-red-600 border border-red-200 text-sm rounded hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-6 flex gap-4 justify-center text-sm">
        <Link
          href={`/admin/products/${slug}/edit`}
          className="text-indigo-600 hover:text-indigo-800"
        >
          Edit Product Details →
        </Link>
        <Link href="/admin/products" className="text-gray-600 hover:text-gray-800">
          Back to Products
        </Link>
      </div>
    </div>
  );
}
