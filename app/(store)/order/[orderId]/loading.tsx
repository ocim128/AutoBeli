import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/ui/panel";

export default function Loading() {
  return (
    <div className="min-h-[80vh] px-4 py-16">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <Skeleton className="h-6 w-32 rounded-full" />
          </div>
          <Skeleton className="mx-auto h-10 w-2/3" />
          <Skeleton className="mx-auto h-4 w-3/4" />
        </div>

        <div className="flex justify-center">
          <Skeleton className="h-7 w-40 rounded-full" />
        </div>

        <Panel padding="lg" className="space-y-4">
          <Skeleton className="h-6 w-36" />
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </Panel>
      </div>
    </div>
  );
}
