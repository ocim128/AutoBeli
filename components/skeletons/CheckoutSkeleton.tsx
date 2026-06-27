import { Skeleton } from "@/components/ui/skeleton";
import { Panel } from "@/components/ui/panel";

export function CheckoutSkeleton() {
  return (
    <div className="min-h-[80vh] py-10 md:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Breadcrumb */}
        <Skeleton className="h-4 w-56 rounded-md mb-10" />

        {/* Page Header */}
        <div className="mb-10 space-y-3">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-80" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side - Form Area */}
          <div className="lg:col-span-7 lg:order-1">
            <Panel padding="lg">
              {/* Form header */}
              <div className="mb-10 space-y-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-3 w-40" />
              </div>

              {/* Email Field */}
              <div className="space-y-7">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                  <Skeleton className="h-3 w-72" />
                </div>

                {/* Submit Button */}
                <Skeleton className="h-[3.25rem] w-full rounded-lg" />
              </div>

              {/* Payment Methods */}
              <div className="mt-10 pt-6 border-t border-[var(--line)] flex flex-col items-center gap-4">
                <Skeleton className="h-3 w-40" />
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-8 w-16 rounded-md" />
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          {/* Right Side - Order Brief */}
          <div className="lg:col-span-5 lg:order-2">
            <div className="sticky top-28 space-y-5">
              {/* Order Brief Panel — featured */}
              <Panel padding="lg" featured>
                {/* Eyebrow + Order ID row */}
                <div className="flex items-center justify-between mb-6">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>

                {/* Product Title */}
                <div className="mb-5 space-y-2">
                  <Skeleton className="h-7 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Status */}
                <Skeleton className="h-5 w-20 rounded-full mb-6" />

                {/* Divider */}
                <div className="h-px bg-[var(--line)] mb-6" />

                {/* Price Breakdown */}
                <div className="space-y-3.5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-[4.5rem]" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-[var(--line)] my-6" />

                {/* Total */}
                <div className="flex justify-between items-end">
                  <Skeleton className="h-3 w-12" />
                  <div className="text-right space-y-1">
                    <Skeleton className="h-9 w-36" />
                    <Skeleton className="h-2 w-8 ml-auto" />
                  </div>
                </div>
              </Panel>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <Panel key={i} padding="sm">
                    <div className="flex items-center gap-2.5">
                      <Skeleton className="w-7 h-7 rounded-md flex-shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-2.5 w-12" />
                        <Skeleton className="h-2 w-16" />
                      </div>
                    </div>
                  </Panel>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
