import Spinner from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div
      className="min-h-[60vh] flex items-center justify-center bg-[var(--background)]"
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <Spinner size={32} variant="classic" className="text-[var(--text-muted)]" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
