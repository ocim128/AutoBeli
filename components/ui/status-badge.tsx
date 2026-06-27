"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const statusColorMap = {
  success:
    "border-[var(--success)]/35 bg-transparent text-[var(--success)] [&_.status-dot]:bg-[var(--success)]",
  warning:
    "border-[var(--warning)]/35 bg-transparent text-[var(--warning)] [&_.status-dot]:bg-[var(--warning)]",
  error:
    "border-[var(--danger)]/35 bg-transparent text-[var(--danger)] [&_.status-dot]:bg-[var(--danger)]",
  info: "border-[var(--accent)]/40 bg-transparent text-[var(--accent)] [&_.status-dot]:bg-[var(--accent)]",
  pending:
    "border-[var(--line-strong)] bg-transparent text-[var(--text-muted)] [&_.status-dot]:bg-[var(--text-muted)]",
  neutral:
    "border-[var(--line)] bg-transparent text-[var(--text-muted)] [&_.status-dot]:bg-[var(--text-muted)]",
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
        "eyebrow-sm inline-flex h-5 items-center gap-1.5 rounded-[var(--radius-sm)] px-2 py-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]",
        statusColorMap[status],
        className
      )}
      {...props}
    >
      <span className="status-dot inline-block size-1.5 shrink-0 rounded-full" aria-hidden="true" />
      {children}
    </Badge>
  );
}
