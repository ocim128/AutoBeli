"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export interface DataTableShellProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  toolbar?: React.ReactNode;
  loading?: boolean;
  empty?: boolean;
  emptyContent?: React.ReactNode;
  children: React.ReactNode;
}

export function DataTableShell({
  title,
  toolbar,
  loading = false,
  empty = false,
  emptyContent,
  children,
  className,
  ...props
}: DataTableShellProps) {
  return (
    <div
      data-slot="data-table-shell"
      className={cn("rounded-xl border border-[var(--line)] bg-[var(--panel)]", className)}
      {...props}
    >
      {/* Header area */}
      {(title || toolbar) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-3">
          {title && (
            <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {title}
            </span>
          )}
          {toolbar && <div className="flex items-center gap-2">{toolbar}</div>}
        </div>
      )}

      {/* Body */}
      <div className="relative">
        {loading ? (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full rounded-md" />
            ))}
          </div>
        ) : empty ? (
          <div className="p-4">
            {emptyContent ?? (
              <EmptyState title="No data" description="There are no records to display." />
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
