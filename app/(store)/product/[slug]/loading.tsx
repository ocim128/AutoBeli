import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/ui/panel";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 pb-20 md:px-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-24" />
      </div>

      <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
        {/* Left column: media + content */}
        <div className="min-w-0 space-y-10 lg:col-span-7">
          {/* Image panel */}
          <Panel padding="sm" className="overflow-hidden p-0">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
          </Panel>

          {/* Overview panel */}
          <Panel>
            <Skeleton className="mb-4 h-3 w-20" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          </Panel>

          {/* Features panel */}
          <Panel>
            <Skeleton className="mb-5 h-3 w-16" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24 rounded-[12px]" />
              <Skeleton className="h-24 rounded-[12px]" />
              <Skeleton className="h-24 rounded-[12px]" />
              <Skeleton className="h-24 rounded-[12px]" />
            </div>
          </Panel>
        </div>

        {/* Right column: purchase brief */}
        <div className="min-w-0 lg:col-span-5">
          <div className="sticky top-28">
            <Panel featured padding="lg" className="space-y-7">
              <div className="space-y-3">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="border-t border-[var(--line)]" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-14 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="border-t border-[var(--line)]" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
