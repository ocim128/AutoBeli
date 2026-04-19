"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: 8,
  md: 12,
  lg: 16,
} as const;

export interface CornerFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export function CornerFrame({
  size = "md",
  color,
  className,
  children,
  ...props
}: CornerFrameProps) {
  const px = sizeMap[size];
  const lineColor = color ?? "var(--line-strong)";

  return (
    <div data-slot="corner-frame" className={cn("relative", className)} {...props}>
      {/* Top-left */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: -1,
          left: -1,
          width: px,
          height: px,
          borderTop: `2px solid ${lineColor}`,
          borderLeft: `2px solid ${lineColor}`,
        }}
      />
      {/* Top-right */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          top: -1,
          right: -1,
          width: px,
          height: px,
          borderTop: `2px solid ${lineColor}`,
          borderRight: `2px solid ${lineColor}`,
        }}
      />
      {/* Bottom-left */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: -1,
          left: -1,
          width: px,
          height: px,
          borderBottom: `2px solid ${lineColor}`,
          borderLeft: `2px solid ${lineColor}`,
        }}
      />
      {/* Bottom-right */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: -1,
          right: -1,
          width: px,
          height: px,
          borderBottom: `2px solid ${lineColor}`,
          borderRight: `2px solid ${lineColor}`,
        }}
      />
      {children}
    </div>
  );
}
