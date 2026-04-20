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

/* Realistic skeleton widths for table rows */
const skeletonWidths = ["w-full", "w-4/5", "w-full", "w-3/4", "w-full", "w-5/6", "w-full"];

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
      {/* Header / toolbar */}
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
          <div className="flex flex-col gap-2.5 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className={cn(
                  "h-9 rounded-[var(--radius-sm)]",
                  skeletonWidths[i % skeletonWidths.length]
                )}
              />
            ))}
          </div>
        ) : empty ? (
          <div className="p-6">
            {emptyContent ?? (
              <EmptyState title="No data" description="There are no records to display." />
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Horizontal scroll indicator for narrow viewports */}
            <div className="pointer-events-none sticky left-0 top-0 z-10 h-0">
              <div className="absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-[var(--panel)] to-transparent opacity-0 [supports-selector(:-webkit-scrollbar)]:hidden sm:opacity-0" />
            </div>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
