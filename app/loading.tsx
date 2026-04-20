export default function Loading() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center bg-[var(--background)]"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <div className="flex flex-col items-center gap-5">
        {/* Editorial loading mark: serif letter with pulse */}
        <span
          className="animate-editorial-pulse font-serif text-[2rem] text-[var(--text-muted)] select-none"
          aria-hidden="true"
          style={{ lineHeight: 1 }}
        >
          &sect;
        </span>

        {/* Thin animated rule */}
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="block w-6 h-px bg-[var(--line-strong)]" />
          <span className="block w-1 h-1 rounded-full bg-[var(--accent)] opacity-50" />
          <span className="block w-6 h-px bg-[var(--line-strong)]" />
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
