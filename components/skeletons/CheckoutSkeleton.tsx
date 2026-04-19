import { Skeleton } from "@/components/ui/Skeleton";
import { Panel } from "@/components/ui/panel";

export function CheckoutSkeleton() {
  return (
    <div className="min-h-[80vh] py-8 md:py-16 animate-in fade-in-50">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Skeleton className="h-5 w-48 rounded-md mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side - Form Area */}
          <div className="lg:col-span-7 lg:order-1">
            <div className="mb-6 space-y-3">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-5 w-96" />
            </div>

            {/* Checkout Form Skeleton */}
            <Panel padding="lg">
              {/* Mono label header */}
              <Skeleton className="mb-4 h-3 w-28" />

              {/* Header */}
              <div className="mb-10 flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-14 w-full rounded-xl" />
                  <Skeleton className="h-3 w-80" />
                </div>

                {/* Submit Button */}
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>

              {/* Footer */}
              <div className="mt-10 pt-8 border-t border-[var(--line)] flex flex-col items-center gap-4">
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 w-10" />
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-5 lg:order-2">
            <div className="sticky top-28 space-y-6">
              {/* Order Summary Card */}
              <Panel padding="lg">
                <Skeleton className="mb-4 h-3 w-24" />

                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center gap-3 pb-6 border-b border-[var(--line)]">
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-xl flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <div className="h-px bg-[var(--line)] my-4" />
                    <div className="flex justify-between items-end">
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-10 w-36" />
                    </div>
                  </div>
                </div>
              </Panel>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Panel key={i} padding="sm">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                      <div className="space-y-1">
                        <Skeleton className="h-3 w-14" />
                        <Skeleton className="h-2 w-20" />
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
