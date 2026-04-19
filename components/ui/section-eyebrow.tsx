"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SectionEyebrowProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "accent";
}

export function SectionEyebrow({
  variant = "default",
  className,
  children,
  ...props
}: SectionEyebrowProps) {
  return (
    <span
      data-slot="section-eyebrow"
      className={cn(
        "inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.1em]",
        variant === "default" && "text-[var(--text-muted)]",
        variant === "accent" && "text-[var(--accent)]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-px w-5",
          variant === "default" ? "bg-[var(--text-muted)]" : "bg-[var(--accent)]"
        )}
      />
      {children}
    </span>
  );
}
