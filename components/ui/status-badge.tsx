"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const statusColorMap = {
  success: "border-emerald-500/35 bg-transparent text-emerald-400",
  warning: "border-amber-500/35 bg-transparent text-amber-400",
  error: "border-red-500/35 bg-transparent text-red-400",
  info: "border-[var(--accent)]/40 bg-transparent text-[var(--accent)]",
  pending: "border-[var(--line-strong)] bg-transparent text-[var(--text-muted)]",
  neutral: "border-[var(--line)] bg-transparent text-[var(--text-muted)]",
} as const;

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: "success" | "warning" | "error" | "info" | "pending" | "neutral";
  children: React.ReactNode;
}

export function StatusBadge({ status, className, children, ...props }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "h-auto min-h-0 rounded-[10px] px-2.5 py-1 font-mono text-[0.65rem] font-medium uppercase tracking-[0.14em] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        statusColorMap[status],
        className
      )}
      {...props}
    >
      {children}
    </Badge>
  );
}
