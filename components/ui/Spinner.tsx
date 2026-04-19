"use client";

import { memo } from "react";

interface SpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** CSS class for custom styling */
  className?: string;
  /** Variant: 'classic' for traditional spinner, 'pulse' for dot pulse */
  variant?: "classic" | "pulse";
}

/**
 * Reusable loading spinner with clean tactical styling
 */
function Spinner({ size = 24, className = "", variant = "classic" }: SpinnerProps) {
  if (variant === "pulse") {
    return (
      <div
        className={`flex items-center gap-1 ${className}`}
        style={{ height: size }}
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="rounded-full bg-current animate-[pulse_1.2s_ease-in-out_infinite]"
            style={{
              width: size * 0.25,
              height: size * 0.25,
              animationDelay: `${i * 0.15}s`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>
    );
  }

  // Classic spinner
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
