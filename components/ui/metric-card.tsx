"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/panel";

const trendIcon = {
  up: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="inline-block h-4 w-4 text-emerald-400"
    >
      <path
        fillRule="evenodd"
        d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
        clipRule="evenodd"
      />
    </svg>
  ),
  down: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="inline-block h-4 w-4 text-red-400"
    >
      <path
        fillRule="evenodd"
        d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
        clipRule="evenodd"
      />
    </svg>
  ),
  flat: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="inline-block h-4 w-4 text-[var(--text-muted)]"
    >
      <path
        fillRule="evenodd"
        d="M2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z"
        clipRule="evenodd"
      />
    </svg>
  ),
} as const;

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  sublabel?: string;
  trend?: "up" | "down" | "flat";
}

export function MetricCard({
  label,
  value,
  sublabel,
  trend,
  className,
  ...props
}: MetricCardProps) {
  return (
    <Panel padding="md" className={cn("", className)} {...props}>
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
          {label}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl text-[var(--foreground)] lg:text-4xl">{value}</span>
          {trend && <span>{trendIcon[trend]}</span>}
        </div>
        {sublabel && <span className="text-xs text-[var(--text-muted)]">{sublabel}</span>}
      </div>
    </Panel>
  );
}
