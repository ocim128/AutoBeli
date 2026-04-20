"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-12",
} as const;

const variantBase = "rounded-[14px] border bg-[var(--panel)]";

const variantBorderMap = {
  default: "border-[var(--line)]",
  accent:
    "border-[var(--line-strong)] [background-image:linear-gradient(180deg,var(--accent-soft)_0%,transparent_32%)]",
  ghost: "border-transparent bg-transparent",
} as const;

const featuredStyles =
  "border-t-2 border-t-[var(--accent)] border-x-[var(--line-strong)] border-b-[var(--line-strong)] shadow-[0_1px_3px_rgba(23,19,16,0.06),0_1px_2px_rgba(23,19,16,0.04)] dark:shadow-none";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  monoLabel?: string;
  variant?: "default" | "accent" | "ghost";
  padding?: "sm" | "md" | "lg" | "xl";
  featured?: boolean;
  children: React.ReactNode;
}

export function Panel({
  title,
  monoLabel,
  variant = "default",
  padding = "md",
  featured = false,
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      data-slot="panel"
      className={cn(
        variantBase,
        !featured && variantBorderMap[variant],
        featured && featuredStyles,
        paddingMap[padding],
        className
      )}
      {...props}
    >
      {(monoLabel || title) && (
        <div className="mb-5 flex flex-col gap-1.5">
          {monoLabel && (
            <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {monoLabel}
            </span>
          )}
          {title && (
            <h3 className="font-serif text-xl leading-snug text-[var(--foreground)]">{title}</h3>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
