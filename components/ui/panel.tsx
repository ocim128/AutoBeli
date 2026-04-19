"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
} as const;

const variantMap = {
  default:
    "rounded-[14px] border border-[var(--line)] bg-[var(--panel)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
  accent:
    "rounded-[14px] border border-[var(--accent)]/60 bg-[var(--panel)] [background-image:linear-gradient(180deg,var(--accent-soft)_0%,transparent_32%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
  ghost: "rounded-[14px] border border-transparent bg-transparent",
} as const;

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  monoLabel?: string;
  variant?: "default" | "accent" | "ghost";
  padding?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Panel({
  title,
  monoLabel,
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      data-slot="panel"
      className={cn(variantMap[variant], paddingMap[padding], className)}
      {...props}
    >
      {(monoLabel || title) && (
        <div className="mb-4">
          {monoLabel && (
            <span className="mb-1 block font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {monoLabel}
            </span>
          )}
          {title && <h3 className="font-serif text-xl text-[var(--foreground)]">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}
