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
        "flex items-center gap-0.5 rounded border border-[var(--line)] bg-[var(--panel)] p-0.5",
        compact && "p-0"
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
              compact ? "h-8 w-8" : "h-7 w-7",
              active
                ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            )}
          >
            <Icon className={compact ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
          </button>
        );
      })}
    </div>
  );
}
