"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");

  // Unwrap params
  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    priceIdr: 0,
    content: "",
    postPurchaseTemplate: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch product data
  useEffect(() => {
    if (!slug) return;

    if (!slug) return;

    // Fetch specific product (which will return decrypted content for admin)
    fetch(`/api/products?slug=${slug}`)
      .then((res) => res.json())
      .then((data) => {
        const product = data.product;
        if (product) {
          setForm({
            title: product.title,
            description: product.description,
            imageUrl: product.imageUrl || "",
            priceIdr: product.priceIdr,
            content: product.content || "", // Pre-fill decrypted content
            postPurchaseTemplate: product.postPurchaseTemplate || "",
            isActive: product.isActive,
          });
        } else {
          setError("Product not found");
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, isActive: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { imageUrl, ...rest } = form;
    const payload = {
      originalSlug: slug,
      ...rest,
      imageUrl: imageUrl.trim(),
    };

    // Remove content if empty so validation doesn't fail (min 1 char)
    // and backend knows not to update it.
    if (!payload.content) {
      // @ts-expect-error Payload type inferred, deleting content to prevent update
      delete payload.content;
    }

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update");
      }
      setLoading(false);
    }
  };

  if (loading && !slug) return <div>Initializing...</div>;
  if (loading) return <div>Loading Product...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Product: {slug}</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded-lg bg-white shadow-sm">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            name="title"
            required
            className="w-full border rounded p-2"
            value={form.title}
            onChange={handleChange}
          />
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium">Price (IDR)</label>
          <input
            type="number"
            name="priceIdr"
            required
            min="0"
            className="w-full border rounded p-2"
            value={form.priceIdr}
            onChange={handleChange}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            rows={3}
            className="w-full border rounded p-2"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium">Image URL (Optional)</label>
          <input
            type="url"
            name="imageUrl"
            placeholder="https://example.com/image.jpg"
            className="w-full border rounded p-2"
            value={form.imageUrl}
            onChange={handleChange}
          />
          {form.imageUrl && (
            <div className="mt-2 text-xs text-gray-500">
              <span className="block mb-1">Preview:</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl}
                alt="Preview"
                className="h-20 w-auto rounded border"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium">Current Content</label>
          <p className="text-xs text-gray-500 mb-1">Edit to update encrypted content.</p>
          <textarea
            name="content"
            rows={6}
            className="w-full border rounded p-2 font-mono text-sm bg-yellow-50"
            placeholder="Enter new content to overwrite..."
            value={form.content}
            onChange={handleChange}
          />
        </div>

        {/* Post-Purchase Template */}
        <div>
          <label className="block text-sm font-medium">Post-Purchase Template</label>
          <p className="text-xs text-gray-500 mb-1">
            Optional message shown with all stock items after purchase. Great for &quot;Thank
            you&quot; messages.
          </p>
          <textarea
            name="postPurchaseTemplate"
            rows={3}
            className="w-full border rounded p-2 text-sm bg-green-50"
            placeholder="e.g., Thanks for ordering {productTitle}! Here's your unique content:"
            value={form.postPurchaseTemplate}
            onChange={handleChange}
          />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={handleCheckbox}
            className="h-4 w-4"
          />
          <label>Active (Visible in store)</label>
        </div>

        <div className="flex justify-end gap-2 text-sm">
          <span className="text-yellow-600 self-center">Note: Slug cannot be changed.</span>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
