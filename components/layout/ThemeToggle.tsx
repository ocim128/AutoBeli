"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  compact?: boolean;
}

const options = [
  { value: "light", label: "Light mode", icon: Sun },
  { value: "dark", label: "Dark mode", icon: Moon },
  { value: "system", label: "System theme", icon: Monitor },
] as const;

const emptySubscribe = () => () => {};

export function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-[var(--line)] bg-[var(--panel-2)] p-0.5",
        compact && "p-px"
      )}
      aria-label="Theme selector"
      role="group"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value;

        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-label={label}
            aria-pressed={active}
            className={cn(
              "inline-flex items-center justify-center rounded-sm transition-colors",
              "focus-visible:outline-2 focus-visible:outline-[var(--accent)] focus-visible:outline-offset-1",
              compact ? "h-8 w-8" : "h-11 w-11",
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          </button>
        );
      })}
    </div>
  );
}
