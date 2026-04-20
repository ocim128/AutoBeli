import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/ui/panel";

export default function Loading() {
  return (
    <div className="min-h-[80vh] px-4 py-16">
      <div className="mx-auto max-w-5xl space-y-10">
        {/* Header skeleton */}
        <div className="space-y-3 text-center">
          <div className="flex justify-center">
            <Skeleton className="h-5 w-28 rounded-full" />
          </div>
          <Skeleton className="mx-auto h-9 w-72" />
          <Skeleton className="mx-auto h-4 w-80" />
        </div>

        <div className="grid gap-8 md:grid-cols-12">
          {/* Order brief sidebar skeleton */}
          <div className="space-y-4 md:col-span-4">
            <Panel featured padding="lg">
              <Skeleton className="mb-5 h-3 w-24" />
              <div className="space-y-0">
                <div className="flex items-start justify-between gap-4 pb-4">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center justify-between border-t border-[var(--line)] py-4">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center justify-between border-t border-[var(--line)] py-4">
                  <Skeleton className="h-3 w-10" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center justify-between border-t border-[var(--line)] py-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <div className="mt-5 border-t border-[var(--line)] pt-4">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </Panel>
          </div>

          {/* Content area skeleton */}
          <div className="md:col-span-8">
            <Panel padding="lg" className="space-y-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-48 w-full rounded-xl" />
              <Skeleton className="h-10 w-40 rounded-lg" />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
