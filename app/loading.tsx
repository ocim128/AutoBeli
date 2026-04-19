import Spinner from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-[var(--background)]">
      <Spinner size={32} variant="classic" className="text-[var(--text-muted)]" />
      <span className="font-mono text-[0.7rem] font-medium uppercase tracking-[0.12em] text-[var(--text-muted)]">
        LOADING
      </span>
    </div>
  );
}
