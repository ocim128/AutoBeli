"use client";

import { useState, useEffect, useCallback, createContext, useContext, memo } from "react";
import { cn } from "@/lib/utils";

// Toast types for different visual styles
export type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

/**
 * Toast Provider - Wrap your app with this to enable toast notifications
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

/**
 * useToast hook for showing toast notifications
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return {
    toast: context.addToast,
    success: (message: string, duration?: number) => context.addToast(message, "success", duration),
    error: (message: string, duration?: number) => context.addToast(message, "error", duration),
    info: (message: string, duration?: number) => context.addToast(message, "info", duration),
    warning: (message: string, duration?: number) => context.addToast(message, "warning", duration),
  };
}

/**
 * Toast Container - Renders all active toasts
 */
const ToastContainer = memo(function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
});

/**
 * Individual Toast Item
 */
const ToastItem = memo(function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: () => void;
}) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = toast.duration || 4000;
    const exitTimer = setTimeout(() => setIsExiting(true), duration - 300);
    const closeTimer = setTimeout(onClose, duration);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(closeTimer);
    };
  }, [toast.duration, onClose]);

  // Icon and color based on type
  const config = {
    success: {
      bg: "bg-green-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      bg: "bg-red-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    warning: {
      bg: "bg-amber-500",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    info: {
      bg: "bg-indigo-600",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const { bg, icon } = config[toast.type];

  return (
    <div
      role="alert"
      className={cn(
        "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-white min-w-[280px] max-w-[380px]",
        bg,
        isExiting ? "animate-slide-out-right" : "animate-slide-in-right"
      )}
    >
      <span className="shrink-0">{icon}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 200);
        }}
        className="shrink-0 p-1 rounded-lg hover:bg-white/20 transition-colors"
        aria-label="Dismiss notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
});

export { ToastContext };
