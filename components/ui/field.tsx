"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  error?: string;
  helper?: string;
  monoLabel?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}

export function Field({
  label,
  error,
  helper,
  monoLabel = false,
  htmlFor,
  className,
  children,
  ...props
}: FieldProps) {
  return (
    <div data-slot="field" className={cn("flex flex-col gap-2", className)} {...props}>
      <label
        htmlFor={htmlFor}
        className={cn(
          "text-sm font-medium text-[var(--foreground)]",
          monoLabel
            ? "font-mono text-[0.7rem] uppercase tracking-[0.1em] text-[var(--text-muted)]"
            : ""
        )}
      >
        {label}
      </label>
      {children}
      {error && <span className="font-mono text-xs text-[var(--danger)]">{error}</span>}
      {helper && !error && <span className="text-xs text-[var(--text-muted)]">{helper}</span>}
    </div>
  );
}
