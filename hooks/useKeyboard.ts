"use client";

import { useEffect, RefObject } from "react";

/**
 * Hook for managing focus trap within a container.
 * Useful for modals, dropdowns, and dialogs.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement>,
  options: { enabled?: boolean; initialFocus?: RefObject<HTMLElement> } = {}
) {
  const { enabled = true, initialFocus } = options;

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;

    // Focus initial element or first focusable
    if (initialFocus?.current) {
      initialFocus.current.focus();
    } else {
      const firstFocusable = getFocusableElements(container)[0];
      firstFocusable?.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const focusable = getFocusableElements(container);
      const firstElement = focusable[0];
      const lastElement = focusable[focusable.length - 1];

      // Trap focus within container
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, enabled, initialFocus]);
}

/**
 * Get all focusable elements within a container.
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    '[tabindex]:not([tabindex="-1"])',
  ].join(", ");

  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}
