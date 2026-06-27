import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/ui/panel";

export function ProductGridSkeleton() {
  return (
    <div className="space-y-20 pb-28 md:pb-24 animate-in fade-in-50">
      {/* ── Hero Section Skeleton — matches featured Panel hero ── */}
      <section className="relative mx-4 md:mx-6 lg:mx-8">
        <Panel featured padding="xl" className="relative overflow-hidden">
          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center gap-8 lg:flex-row lg:items-start lg:gap-12">
            {/* Left: headline area */}
            <div className="flex flex-1 flex-col items-center gap-5 text-center lg:items-start lg:text-left">
              <Skeleton className="h-5 w-40 rounded-full" />
              <div className="space-y-2 w-full">
                <Skeleton className="h-10 md:h-12 w-4/5 max-w-lg mx-auto lg:mx-0 rounded-xl" />
                <Skeleton className="h-10 md:h-12 w-3/5 max-w-md mx-auto lg:mx-0 rounded-xl" />
              </div>
              <Skeleton className="h-5 w-72 max-w-sm rounded-lg" />
              <Skeleton className="h-10 w-36 rounded-lg" />
              {/* Trust signals row */}
              <div className="mt-2 flex items-center gap-5">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-3.5 w-20 rounded" />
              </div>
            </div>

            {/* Right: featured product strip (desktop) */}
            <div className="hidden w-full max-w-[280px] shrink-0 flex-col gap-3 pt-2 lg:flex">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-[var(--line)] bg-[var(--panel-2)] p-2.5"
                >
                  <Skeleton className="size-12 shrink-0 rounded-md" />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-24 rounded" />
                    <Skeleton className="h-3 w-16 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </section>

      {/* ── Product Grid Section Skeleton ── */}
      <section id="products" className="scroll-mt-24 space-y-10 px-4 md:px-6 lg:px-8">
        {/* Grid header */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16 rounded-full" />
            <Skeleton className="h-7 w-48 rounded-lg" />
            <Skeleton className="h-4 w-64 rounded" />
          </div>
          <Skeleton className="h-4 w-16 rounded" />
        </div>

        {/* Product Cards Grid — matches new card layout */}
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex h-full flex-col overflow-hidden rounded-[14px] border border-[var(--line)] bg-[var(--panel)]"
            >
              {/* Image / poster area — aspect ratio matches ProductCard */}
              <div className="relative aspect-[4/3] overflow-hidden bg-[var(--panel-3)]">
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Skeleton className="h-px w-8 rounded" />
                  <Skeleton className="h-6 w-24 rounded-lg" />
                  <Skeleton className="h-px w-8 rounded" />
                </div>
              </div>

              {/* Card body — price-first layout */}
              <div className="flex flex-1 flex-col gap-2 p-5">
                {/* Price */}
                <Skeleton className="h-6 w-24 rounded-lg" />

                {/* Title */}
                <Skeleton className="h-4 w-3/4 rounded" />

                {/* Description — 2 lines */}
                <div className="space-y-1.5">
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-5/6 rounded" />
                </div>

                {/* Stock */}
                <Skeleton className="h-3 w-16 rounded" />

                {/* CTA button */}
                <Skeleton className="mt-2 h-8 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
