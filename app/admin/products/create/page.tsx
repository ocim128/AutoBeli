"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Spinner from "@/components/ui/Spinner";
import FormInput from "@/components/ui/FormInput";

export default function CreateProduct() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Spinner size={32} />
        </div>
      }
    >
      <CreateProductContent />
    </Suspense>
  );
}

function CreateProductContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sourceSlug = searchParams.get("sourceSlug");

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    imageUrl: "",
    priceIdr: 10000,
    content: "",
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (sourceSlug) {
      setLoading(true);
      fetch(`/api/products?slug=${sourceSlug}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.product) {
            setForm({
              title: data.product.title,
              slug: `${data.product.slug}-copy`, // Append copy to avoid collision
              description: data.product.description || "",
              imageUrl: data.product.imageUrl || "",
              priceIdr: data.product.priceIdr,
              content: data.product.content || "",
              isActive: true,
            });
          }
        })
        .catch((err) => console.error("Failed to load source product", err))
        .finally(() => setLoading(false));
    }
  }, [sourceSlug]);

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

    try {
      // Remove empty optional string fields before sending
      const { imageUrl, ...rest } = form;
      const payload = {
        ...rest,
        imageUrl: imageUrl.trim(),
      };

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to create");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-4 border p-6 rounded-lg bg-white shadow-sm">
        {/* Title */}
        <FormInput
          id="title"
          label="Title"
          value={form.title}
          onChange={(val) => {
            setForm((prev) => ({
              ...prev,
              title: val,
              slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            }));
          }}
          required
        />

        {/* Slug */}
        <FormInput
          id="slug"
          label="Slug (URL)"
          value={form.slug}
          onChange={(val) => setForm((prev) => ({ ...prev, slug: val }))}
          required
          className="bg-gray-50"
        />

        {/* Price */}
        <FormInput
          id="priceIdr"
          label="Price (IDR)"
          type="number"
          value={String(form.priceIdr)}
          onChange={(val) => setForm((prev) => ({ ...prev, priceIdr: Number(val) }))}
          required
          min={0}
        />

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            className="w-full border rounded p-2"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        {/* Image URL */}
        <div>
          <FormInput
            id="imageUrl"
            label="Image URL (Optional)"
            type="url"
            value={form.imageUrl}
            onChange={(val) => setForm((prev) => ({ ...prev, imageUrl: val }))}
            placeholder="https://example.com/image.jpg"
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
          <label htmlFor="content" className="block text-sm font-medium">
            Content (The Product)
          </label>
          <p className="text-xs text-gray-500 mb-1">
            This text will be encrypted and delivered only after payment.
          </p>
          <textarea
            id="content"
            name="content"
            required
            rows={6}
            className="w-full border rounded p-2 font-mono text-sm bg-yellow-50"
            placeholder="Paste your digital product content here..."
            value={form.content}
            onChange={handleChange}
          />
        </div>

        {/* Active */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={form.isActive}
            onChange={handleCheckbox}
            className="h-4 w-4"
          />
          <label htmlFor="isActive">Active (Visible in store)</label>
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <div className="flex justify-end gap-2">
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
            {loading ? "Saving..." : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
