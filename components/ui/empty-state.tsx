"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-[var(--line)] bg-[var(--panel)] px-6 py-12 text-center",
        className
      )}
      {...props}
    >
      {icon && <div className="text-[var(--text-muted)]">{icon}</div>}
      <h3 className="font-serif text-xl text-[var(--foreground)]">{title}</h3>
      {description && <p className="max-w-sm text-sm text-[var(--text-muted)]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
