"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface UseIntersectionObserverOptions {
  /** Threshold at which the callback is invoked (0-1) */
  threshold?: number | number[];
  /** Margin around the root element */
  rootMargin?: string;
  /** Whether to disconnect observer after first intersection */
  triggerOnce?: boolean;
  /** Whether the observer is enabled */
  enabled?: boolean;
}

interface UseIntersectionObserverResult {
  /** Ref to attach to the target element */
  ref: React.RefObject<HTMLElement | null>;
  /** Whether the element is currently in view */
  isInView: boolean;
  /** Whether the element has ever been in view */
  hasBeenInView: boolean;
}

// Check if Intersection Observer is supported (computed once at module level)
const isIntersectionObserverSupported =
  typeof window !== "undefined" && typeof IntersectionObserver !== "undefined";

/**
 * Custom hook for detecting when an element enters the viewport.
 * Useful for lazy loading content, triggering animations on scroll, etc.
 *
 * @example
 * const { ref, isInView, hasBeenInView } = useIntersectionObserver({ threshold: 0.2 });
 * return <div ref={ref} className={hasBeenInView ? "animate-fade-in" : "opacity-0"}>Content</div>
 */
export function useIntersectionObserver({
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
  enabled = true,
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverResult {
  const ref = useRef<HTMLElement | null>(null);

  // Initialize with fallback value for unsupported browsers
  const [isInView, setIsInView] = useState(() => !isIntersectionObserverSupported);
  const [hasBeenInView, setHasBeenInView] = useState(() => !isIntersectionObserverSupported);

  useEffect(() => {
    if (!enabled || !isIntersectionObserverSupported) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);

        if (inView) {
          setHasBeenInView(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, enabled]);

  return { ref, isInView, hasBeenInView };
}

/**
 * Hook for creating a ref callback that can be used with list items.
 * Returns a callback ref function and inView state for a single element.
 */
export function useIntersectionObserverCallback(options: UseIntersectionObserverOptions = {}): {
  setRef: (el: HTMLElement | null) => void;
  isInView: boolean;
  hasBeenInView: boolean;
} {
  const { threshold = 0.1, rootMargin = "0px", triggerOnce = true, enabled = true } = options;

  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const [isInView, setIsInView] = useState(() => !isIntersectionObserverSupported);
  const [hasBeenInView, setHasBeenInView] = useState(() => !isIntersectionObserverSupported);

  // Create observer lazily
  const getObserver = useCallback(() => {
    if (!isIntersectionObserverSupported) return null;

    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          const inView = entry.isIntersecting;
          setIsInView(inView);
          if (inView) {
            setHasBeenInView(true);
            if (triggerOnce && observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        },
        { threshold, rootMargin }
      );
    }
    return observerRef.current;
  }, [threshold, rootMargin, triggerOnce]);

  const setRef = useCallback(
    (el: HTMLElement | null) => {
      if (!enabled || !isIntersectionObserverSupported) return;

      const observer = getObserver();
      if (!observer) return;

      // Unobserve previous element
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }

      elementRef.current = el;

      // Observe new element
      if (el) {
        observer.observe(el);
      }
    },
    [enabled, getObserver]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return { setRef, isInView, hasBeenInView };
}
