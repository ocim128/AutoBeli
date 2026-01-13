"use client";

import { useCallback, useEffect, RefObject } from "react";

type KeyboardHandler = (event: KeyboardEvent) => void;

interface KeyboardShortcut {
  /** Key to listen for (e.g., "Enter", "Escape", "ArrowDown") */
  key: string;
  /** Callback function when key is pressed */
  handler: KeyboardHandler;
  /** Whether Ctrl/Cmd key must be held */
  ctrlKey?: boolean;
  /** Whether Shift key must be held */
  shiftKey?: boolean;
  /** Whether Alt key must be held */
  altKey?: boolean;
  /** Whether to prevent default browser behavior */
  preventDefault?: boolean;
  /** Whether the shortcut is enabled */
  enabled?: boolean;
}

/**
 * Hook for handling keyboard shortcuts.
 * Supports modifier keys and prevents default behavior when needed.
 *
 * @example
 * useKeyboardShortcuts([
 *   { key: "Escape", handler: handleClose },
 *   { key: "Enter", handler: handleSubmit, ctrlKey: true },
 * ]);
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        if (shortcut.enabled === false) continue;

        const keyMatch = event.key === shortcut.key;
        const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey || event.metaKey : true;
        const shiftMatch = shortcut.shiftKey ? event.shiftKey : true;
        const altMatch = shortcut.altKey ? event.altKey : true;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          shortcut.handler(event);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

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
 * Hook for roving tabindex pattern in lists/menus.
 * Allows arrow key navigation between items.
 */
export function useRovingTabindex(
  containerRef: RefObject<HTMLElement>,
  options: {
    /** Selector for focusable items */
    itemSelector?: string;
    /** Whether navigation is horizontal (left/right) or vertical (up/down) */
    orientation?: "horizontal" | "vertical";
    /** Whether to loop around at the end */
    loop?: boolean;
    /** Whether the behavior is enabled */
    enabled?: boolean;
  } = {}
) {
  const {
    itemSelector = '[role="menuitem"], [role="option"], button, a',
    orientation = "vertical",
    loop = true,
    enabled = true,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;

      const items = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(itemSelector)
      ).filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);

      const currentIndex = items.findIndex((item) => item === document.activeElement);
      if (currentIndex === -1) return;

      const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
      const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";

      let nextIndex: number | null = null;

      if (event.key === prevKey) {
        nextIndex = currentIndex - 1;
        if (nextIndex < 0) {
          nextIndex = loop ? items.length - 1 : 0;
        }
      } else if (event.key === nextKey) {
        nextIndex = currentIndex + 1;
        if (nextIndex >= items.length) {
          nextIndex = loop ? 0 : items.length - 1;
        }
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = items.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        items[nextIndex]?.focus();
      }
    },
    [containerRef, itemSelector, orientation, loop, enabled]
  );

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    container.addEventListener("keydown", handleKeyDown);
    return () => container.removeEventListener("keydown", handleKeyDown);
  }, [containerRef, handleKeyDown, enabled]);
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
