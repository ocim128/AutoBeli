"use client";

import { memo } from "react";

interface SpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** CSS class for custom styling */
  className?: string;
  /** Variant: 'orbital' for kinetic geometry style, 'classic' for traditional */
  variant?: "orbital" | "classic";
}

/**
 * Reusable loading spinner component with kinetic geometry style
 */
function Spinner({ size = 24, className = "", variant = "orbital" }: SpinnerProps) {
  if (variant === "classic") {
    return (
      <svg
        className={`animate-spin ${className}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  }

  // Orbital kinetic geometry spinner
  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 40 40" fill="none">
        {/* Outer orbit ring */}
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" strokeOpacity="0.2" />
        {/* Middle orbit ring */}
        <circle
          cx="20"
          cy="20"
          r="12"
          stroke="currentColor"
          strokeWidth="1"
          strokeOpacity="0.15"
          strokeDasharray="6 4"
        />
        {/* Inner orbit ring */}
        <circle cx="20" cy="20" r="6" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.1" />
      </svg>

      {/* Orbiting dots */}
      <div className="absolute inset-0 animate-orbit-fast" style={{ transformOrigin: "center" }}>
        <div
          className="absolute bg-current rounded-full"
          style={{
            width: size * 0.15,
            height: size * 0.15,
            top: "5%",
            left: `calc(50% - ${size * 0.075}px)`,
          }}
        />
      </div>

      <div className="absolute inset-0 animate-orbit-medium" style={{ transformOrigin: "center" }}>
        <div
          className="absolute bg-current rounded-full opacity-70"
          style={{
            width: size * 0.1,
            height: size * 0.1,
            top: "20%",
            left: `calc(50% - ${size * 0.05}px)`,
          }}
        />
      </div>

      <div className="absolute inset-0 animate-orbit-reverse" style={{ transformOrigin: "center" }}>
        <div
          className="absolute bg-current rounded-full opacity-50"
          style={{
            width: size * 0.08,
            height: size * 0.08,
            top: "35%",
            left: `calc(50% - ${size * 0.04}px)`,
          }}
        />
      </div>

      {/* Center dot */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-current rounded-full animate-breathe"
        style={{ width: size * 0.12, height: size * 0.12 }}
      />
    </div>
  );
}

export default memo(Spinner);
