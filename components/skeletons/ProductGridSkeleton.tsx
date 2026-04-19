import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/ui/panel";

export function ProductGridSkeleton() {
  return (
    <div className="space-y-24 pb-20 animate-in fade-in-50">
      {/* Hero Section Skeleton */}
      <Panel padding="lg" className="text-center py-28 px-4">
        <div className="space-y-6">
          <div className="flex justify-center">
            <Skeleton className="h-8 w-48 rounded-full" />
          </div>
          <Skeleton className="h-16 md:h-20 w-3/4 max-w-2xl mx-auto rounded-2xl" />
          <Skeleton className="h-6 w-2/3 max-w-xl mx-auto" />
          <div className="pt-4 flex justify-center">
            <Skeleton className="h-14 w-48 rounded-xl" />
          </div>
        </div>
      </Panel>

      {/* Grid Header Skeleton */}
      <section id="products" className="scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div className="flex items-start gap-4">
            <Skeleton className="w-12 h-12 rounded-xl hidden sm:block" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-5 w-72" />
            </div>
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Panel key={i} padding="sm" className="h-full flex flex-col overflow-hidden">
              {/* Card Media Area */}
              <div className="h-52 relative overflow-hidden rounded-lg bg-[var(--panel-2)] mb-4">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="space-y-3 text-center">
                    <Skeleton className="h-8 w-24 mx-auto" />
                    <Skeleton className="h-4 w-16 mx-auto rounded-lg" />
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-2 pb-2">
                <div className="flex-grow space-y-4">
                  {/* Title */}
                  <Skeleton className="h-7 w-3/4" />

                  {/* Description */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex items-center justify-between border-t border-[var(--line)] pt-5">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-6 w-28" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-xl" />
                </div>
              </div>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}
