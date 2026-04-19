"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Field } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EditProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const router = useRouter();
  const [slug, setSlug] = useState<string>("");

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

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
            content: product.content || "",
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
    setForm((prev) => ({
      ...prev,
      [name]: name === "priceIdr" ? Number(value) : value,
    }));
  };

  const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, isActive: e.target.checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { imageUrl, ...rest } = form;
    const payload = {
      originalSlug: slug,
      ...rest,
      imageUrl: imageUrl.trim(),
    };

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
      setSaving(false);
    }
  };

  if (loading && !slug)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  if (error && !form.title)
    return (
      <Panel>
        <p className="text-sm text-[var(--danger)]">{error}</p>
      </Panel>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        eyebrow="EDIT PRODUCT"
        title={form.title || slug}
        description={`Editing /${slug}`}
      />

      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          <span>{error}</span>
          <button onClick={() => setError("")} className="font-mono text-xs hover:text-red-300">
            DISMISS
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Panel>
          <div className="space-y-5">
            {/* Title */}
            <Field label="Title" monoLabel htmlFor="title">
              <Input
                type="text"
                id="title"
                name="title"
                required
                value={form.title}
                onChange={handleChange}
              />
            </Field>

            {/* Price */}
            <Field label="Price (IDR)" monoLabel htmlFor="priceIdr">
              <Input
                type="number"
                id="priceIdr"
                name="priceIdr"
                required
                min="0"
                value={form.priceIdr}
                onChange={handleChange}
              />
            </Field>

            <Separator />

            {/* Description */}
            <Field label="Description" monoLabel htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
              />
            </Field>

            {/* Image URL */}
            <Field
              label="Image URL (Optional)"
              monoLabel
              htmlFor="imageUrl"
              helper="External image URL for product thumbnail."
            >
              <Input
                type="url"
                id="imageUrl"
                name="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={handleChange}
              />
              {form.imageUrl && (
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="h-20 w-auto rounded-md border border-[var(--line)]"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                </div>
              )}
            </Field>

            <Separator />

            {/* Content */}
            <Field
              label="Current Content"
              monoLabel
              htmlFor="content"
              helper="Edit to update encrypted content."
            >
              <Textarea
                id="content"
                name="content"
                rows={6}
                className="font-mono text-sm"
                placeholder="Enter new content to overwrite..."
                value={form.content}
                onChange={handleChange}
              />
            </Field>

            {/* Post-Purchase Template */}
            <Field
              label="Post-Purchase Template"
              monoLabel
              htmlFor="postPurchaseTemplate"
              helper="Optional message shown with all stock items after purchase."
            >
              <Textarea
                id="postPurchaseTemplate"
                name="postPurchaseTemplate"
                rows={3}
                className="text-sm"
                placeholder="e.g., Thanks for ordering {productTitle}! Here's your unique content:"
                value={form.postPurchaseTemplate}
                onChange={handleChange}
              />
            </Field>

            <Separator />

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={handleCheckbox}
                className="h-4 w-4 rounded border-[var(--line)] accent-[var(--accent)]"
              />
              <label
                htmlFor="isActive"
                className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]"
              >
                Active (Visible in store)
              </label>
            </div>

            {/* Slug notice */}
            <div className="flex justify-end">
              <span className="font-mono text-xs text-[var(--warning)]">
                Note: Slug cannot be changed.
              </span>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} size="sm">
                {saving ? "Saving..." : "Update Product"}
              </Button>
            </div>
          </div>
        </Panel>
      </form>
    </div>
  );
}
