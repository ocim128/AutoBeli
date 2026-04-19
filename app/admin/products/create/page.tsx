"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui/page-header";
import { Panel } from "@/components/ui/panel";
import { Field } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/Skeleton";

export default function CreateProduct() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
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
              slug: `${data.product.slug}-copy`,
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
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        eyebrow="NEW LISTING"
        title="Create Product"
        description={
          sourceSlug ? `Duplicating from /${sourceSlug}` : "Add a new product to your catalog."
        }
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
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title: val,
                    slug: prev.slug || val.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  }));
                }}
              />
            </Field>

            {/* Slug */}
            <Field
              label="Slug (URL)"
              monoLabel
              htmlFor="slug"
              helper="URL-safe identifier for this product."
            >
              <Input
                type="text"
                id="slug"
                name="slug"
                required
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </Field>

            {/* Price */}
            <Field label="Price (IDR)" monoLabel htmlFor="priceIdr">
              <Input
                type="number"
                id="priceIdr"
                name="priceIdr"
                required
                min={0}
                value={form.priceIdr}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priceIdr: Number(e.target.value),
                  }))
                }
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
            <Field label="Image URL (Optional)" monoLabel htmlFor="imageUrl">
              <Input
                type="url"
                id="imageUrl"
                name="imageUrl"
                placeholder="https://example.com/image.jpg"
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
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
              label="Content (The Product)"
              monoLabel
              htmlFor="content"
              helper="This text will be encrypted and delivered only after payment."
            >
              <Textarea
                id="content"
                name="content"
                required
                rows={6}
                className="font-mono text-sm"
                placeholder="Paste your digital product content here..."
                value={form.content}
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

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading} size="sm">
                {loading ? "Saving..." : "Create Product"}
              </Button>
            </div>
          </div>
        </Panel>
      </form>
    </div>
  );
}
