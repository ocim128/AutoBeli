"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";

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

const subscribe = () => () => {};
const getServerSnapshot = () => false;
const getIntersectionObserverSnapshot = () => typeof IntersectionObserver !== "undefined";

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
  const hasIntersectionObserver = useSyncExternalStore(
    subscribe,
    getIntersectionObserverSnapshot,
    getServerSnapshot
  );

  // Keep SSR and the first client render identical to avoid hydration mismatches.
  const [isInView, setIsInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    if (!enabled || !hasIntersectionObserver) return;

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
  }, [threshold, rootMargin, triggerOnce, enabled, hasIntersectionObserver]);

  return {
    ref,
    isInView: hasIntersectionObserver ? isInView : true,
    hasBeenInView: hasIntersectionObserver ? hasBeenInView : true,
  };
}
