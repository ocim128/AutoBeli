"use client";

import { memo } from "react";

interface SpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** CSS class for custom styling */
  className?: string;
}

/**
 * Reusable loading spinner component
 * Replaces duplicate SVG spinners across the codebase
 */
function Spinner({ size = 24, className = "" }: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default memo(Spinner);
