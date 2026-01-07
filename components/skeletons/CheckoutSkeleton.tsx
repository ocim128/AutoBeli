import { Skeleton } from "@/components/ui/Skeleton";

export function CheckoutSkeleton() {
  return (
    <div className="min-h-[80vh] py-8 md:py-16 animate-in fade-in-50">
      {/* Animated Background (Static version for skeleton) */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-50" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gray-100 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Skeleton className="h-8 w-80 rounded-full mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side - Form Area */}
          <div className="lg:col-span-7 lg:order-1">
            <div className="mb-6 space-y-3">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-5 w-96" />
            </div>

            {/* Checkout Form Skeleton */}
            <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-100 shadow-xl">
              {/* Header */}
              <div className="mb-10 flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-36" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full rounded-[1.5rem]" />
                  <Skeleton className="h-3 w-80" />
                </div>

                {/* Submit Button */}
                <Skeleton className="h-16 w-full rounded-2xl" />
              </div>

              {/* Footer */}
              <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
                <Skeleton className="h-3 w-48" />
                <div className="flex gap-6">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-4 w-10" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-5 lg:order-2">
            <div className="sticky top-28 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-gray-900 rounded-[2.5rem] p-8 overflow-hidden relative">
                <div className="space-y-8">
                  {/* Header */}
                  <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                    <Skeleton className="w-10 h-10 rounded-xl bg-white/10" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28 bg-white/10" />
                      <Skeleton className="h-2 w-20 bg-white/10" />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-16 h-16 rounded-2xl bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-full bg-white/10" />
                      <Skeleton className="h-4 w-3/4 bg-white/10" />
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-16 bg-white/10" />
                      <Skeleton className="h-4 w-24 bg-white/10" />
                    </div>
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20 bg-white/10" />
                      <Skeleton className="h-4 w-12 bg-white/10" />
                    </div>
                    <div className="h-px bg-white/10 my-4" />
                    <div className="flex justify-between items-end">
                      <Skeleton className="h-4 w-12 bg-white/10" />
                      <Skeleton className="h-10 w-36 bg-white/10" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="bg-white/80 rounded-2xl p-4 border border-gray-100 flex items-center gap-3"
                  >
                    <Skeleton className="w-10 h-10 rounded-xl" />
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-2 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
