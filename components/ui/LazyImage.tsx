"use client";

import { useState, useCallback, memo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface LazyImageProps {
  /** Image source URL */
  src: string;
  /** Alt text for accessibility */
  alt: string;
  /** Width of the image */
  width?: number;
  /** Height of the image */
  height?: number;
  /** Optional blur placeholder data URL */
  blurDataURL?: string;
  /** Fallback component when image fails to load */
  fallback?: React.ReactNode;
  /** Whether to fill the container */
  fill?: boolean;
  /** Object-fit property */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** Callback when image loads successfully */
  onLoadComplete?: () => void;
  /** Callback when image fails to load */
  onLoadError?: () => void;
  /** Additional class for the container */
  className?: string;
  /** Priority loading (for above-the-fold images) */
  priority?: boolean;
}

/**
 * Optimized image component using Next.js Image with:
 * - Intersection Observer for viewport-based loading
 * - Smooth fade-in transition on load
 * - Blur placeholder support
 * - Error state handling with fallback
 * - Shimmer loading state
 */
function LazyImage({
  src,
  alt,
  width,
  height,
  blurDataURL,
  fallback,
  fill = false,
  objectFit = "cover",
  onLoadComplete,
  onLoadError,
  className,
  priority = false,
}: LazyImageProps) {
  const [loadState, setLoadState] = useState<"idle" | "loading" | "loaded" | "error">("idle");
  const { ref, hasBeenInView } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px", // Start loading before image enters viewport
    enabled: !priority, // Skip lazy loading for priority images
  });

  const handleLoad = useCallback(() => {
    setLoadState("loaded");
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback(() => {
    setLoadState("error");
    onLoadError?.();
  }, [onLoadError]);

  // Start loading when in view or priority
  const shouldLoad = priority || hasBeenInView;
  if (shouldLoad && loadState === "idle") {
    setLoadState("loading");
  }

  const isLoading = loadState === "loading" || loadState === "idle";
  const isLoaded = loadState === "loaded";
  const hasError = loadState === "error";

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        "relative overflow-hidden bg-gray-100",
        fill ? "absolute inset-0" : "w-full",
        className
      )}
    >
      {/* Shimmer loading state */}
      {isLoading && !blurDataURL && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>
      )}

      {/* Main image using Next.js Image */}
      {shouldLoad && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={fill ? undefined : width || 800}
          height={fill ? undefined : height || 600}
          fill={fill}
          onLoad={handleLoad}
          onError={handleError}
          className={cn("transition-opacity duration-500", isLoaded ? "opacity-100" : "opacity-0")}
          style={{ objectFit }}
          loading={priority ? "eager" : "lazy"}
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          priority={priority}
        />
      )}

      {/* Error state or fallback */}
      {hasError && (
        <>
          {fallback || (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center text-gray-400">
                <svg
                  className="w-8 h-8 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs">Image unavailable</span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default memo(LazyImage);
