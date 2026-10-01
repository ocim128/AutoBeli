"use client";

import { useState } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PRODUCT_IMAGE_TYPES, productImageUploadSchema, validate } from "@/lib/validation";

interface ProductImageFieldProps {
  value: string;
  onChange: (value: string) => void;
  onUploadingChange: (uploading: boolean) => void;
  disabled?: boolean;
}

export function ProductImageField({
  value,
  onChange,
  onUploadingChange,
  disabled,
}: ProductImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    const validation = validate(productImageUploadSchema, { size: file.size, type: file.type });
    if (!validation.success) {
      setError(validation.error!);
      return;
    }

    setUploading(true);
    onUploadingChange(true);
    try {
      const response = await fetch("/api/admin/products/image", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to upload image");
      onChange(data.imageUrl);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload image");
    } finally {
      setUploading(false);
      onUploadingChange(false);
    }
  }

  return (
    <div className="space-y-3">
      <Field
        label="Upload Image (Optional)"
        monoLabel
        htmlFor="imageUpload"
        error={error}
        helper="JPEG, PNG, or WebP. Up to 4 MB and 20 megapixels. Uploaded images do not expire."
      >
        <Input
          id="imageUpload"
          type="file"
          accept={PRODUCT_IMAGE_TYPES.join(",")}
          onChange={handleUpload}
          disabled={disabled || uploading}
        />
        {uploading && (
          <p role="status" className="text-xs text-[var(--text-muted)]">
            Uploading image...
          </p>
        )}
      </Field>
      <Field
        label="Image URL (Optional)"
        monoLabel
        htmlFor="imageUrl"
        helper="Upload an image above or paste an image URL here."
      >
        <Input
          type="text"
          id="imageUrl"
          name="imageUrl"
          placeholder="https://example.com/image.jpg"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled || uploading}
        />
        {value && (
          <div className="mt-2 inline-flex">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={value}
              src={value}
              alt="Product image preview"
              className="h-16 w-auto rounded-md border border-[var(--line)] opacity-90"
              onError={(event) => (event.currentTarget.style.display = "none")}
            />
          </div>
        )}
      </Field>
    </div>
  );
}
