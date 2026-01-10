"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface ProductWithStock {
  slug: string;
  title: string;
  priceIdr: number;
  isActive: boolean;
  isSold?: boolean;
  createdAt: Date;
  stockItems?: Array<{ isSold: boolean }>;
}

// Helper to calculate stock
function getStockInfo(product: ProductWithStock) {
  if (product.stockItems && product.stockItems.length > 0) {
    const available = product.stockItems.filter((item) => !item.isSold).length;
    const total = product.stockItems.length;
    return { available, total, hasStock: true };
  }
  // Legacy product
  return {
    available: product.isSold ? 0 : 1,
    total: 1,
    hasStock: false,
  };
}

export default function ProductList() {
  const [products, setProducts] = useState<ProductWithStock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (data.products) setProducts(data.products);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/admin/products/create" className="bg-black text-white px-4 py-2 rounded">
          Add New
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Title</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
              <th className="p-4">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
            {products.map((p) => {
              const stock = getStockInfo(p);
              const isSoldOut = stock.available === 0;

              return (
                <tr key={p.slug} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-gray-400">/{p.slug}</div>
                  </td>
                  <td className="p-4">Rp {p.priceIdr.toLocaleString("id-ID")}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${isSoldOut ? "text-red-600" : "text-green-600"}`}
                      >
                        {stock.available}
                      </span>
                      <span className="text-gray-400">/ {stock.total}</span>
                      {stock.hasStock && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                          Multi
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        isSoldOut
                          ? "bg-blue-100 text-blue-800"
                          : p.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {isSoldOut ? "Sold Out" : p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <Link
                      href={`/admin/products/${p.slug}/edit`}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/products/${p.slug}/stock`}
                      className="text-purple-600 hover:text-purple-900 text-sm font-medium"
                    >
                      Stock
                    </Link>
                    <Link
                      href={`/admin/products/create?sourceSlug=${p.slug}`}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                    >
                      Duplicate
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
