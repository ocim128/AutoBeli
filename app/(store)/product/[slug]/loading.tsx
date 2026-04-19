import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/ui/panel";

export default function Loading() {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel padding="lg" className="space-y-6">
          <Skeleton className="h-6 w-28 rounded-full" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-5/6" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </Panel>

        <Panel padding="lg" className="space-y-5">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </Panel>
      </div>
    </div>
  );
}
