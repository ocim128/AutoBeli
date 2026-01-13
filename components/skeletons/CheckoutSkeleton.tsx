import { Skeleton } from "@/components/ui/Skeleton";

export function CheckoutSkeleton() {
  return (
    <div className="min-h-[80vh] py-8 md:py-16 animate-in fade-in-50 relative">
      {/* Kinetic Geometry Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="skeletonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="500" cy="500" r="400" fill="url(#skeletonGlow)" />

          <g className="animate-orbit-slow" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="350"
              fill="none"
              stroke="#6366f1"
              strokeWidth="0.5"
              strokeOpacity="0.08"
            />
            <circle cx="850" cy="500" r="5" fill="#6366f1" fillOpacity="0.1" />
          </g>
          <g className="animate-orbit-medium" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="250"
              fill="none"
              stroke="#818cf8"
              strokeWidth="0.5"
              strokeOpacity="0.06"
              strokeDasharray="15 8"
            />
            <circle cx="750" cy="500" r="6" fill="#818cf8" fillOpacity="0.12" />
          </g>
          <g className="animate-orbit-reverse" style={{ transformOrigin: "500px 500px" }}>
            <circle
              cx="500"
              cy="500"
              r="150"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="0.5"
              strokeOpacity="0.08"
            />
            <circle cx="350" cy="500" r="4" fill="#a5b4fc" fillOpacity="0.1" />
          </g>
        </svg>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Skeleton className="h-9 w-80 rounded-full mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Side - Form Area */}
          <div className="lg:col-span-7 lg:order-1">
            <div className="mb-6 space-y-3">
              <Skeleton className="h-10 w-72" />
              <Skeleton className="h-5 w-96" />
            </div>

            {/* Checkout Form Skeleton */}
            <div className="bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl">
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
              {/* Order Summary Card with kinetic accent */}
              <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 overflow-hidden">
                {/* Kinetic geometry accent */}
                <div className="absolute inset-0 pointer-events-none">
                  <svg
                    className="absolute w-full h-full"
                    viewBox="0 0 300 400"
                    preserveAspectRatio="xMaxYMax slice"
                  >
                    <g className="animate-orbit-slow" style={{ transformOrigin: "250px 350px" }}>
                      <circle
                        cx="250"
                        cy="350"
                        r="60"
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="0.5"
                        strokeOpacity="0.15"
                      />
                      <circle cx="310" cy="350" r="3" fill="#6366f1" fillOpacity="0.2" />
                    </g>
                    <g className="animate-orbit-reverse" style={{ transformOrigin: "250px 350px" }}>
                      <circle
                        cx="250"
                        cy="350"
                        r="35"
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="0.5"
                        strokeOpacity="0.2"
                        strokeDasharray="4 3"
                      />
                      <circle cx="215" cy="350" r="2" fill="#818cf8" fillOpacity="0.3" />
                    </g>
                  </svg>
                </div>

                <div className="relative space-y-8">
                  {/* Header */}
                  <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                    <div className="relative w-10 h-10">
                      <Skeleton className="w-full h-full rounded-xl bg-white/10" />
                      <div
                        className="absolute inset-0 border border-indigo-400/20 rounded-xl animate-orbit-fast"
                        style={{ transformOrigin: "center" }}
                      ></div>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-28 bg-white/10" />
                      <Skeleton className="h-2 w-20 bg-white/10" />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden">
                      <Skeleton className="w-full h-full bg-white/10" />
                      {/* Mini orbital */}
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 64">
                        <g className="animate-orbit-fast" style={{ transformOrigin: "32px 32px" }}>
                          <circle
                            cx="32"
                            cy="32"
                            r="20"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="0.5"
                            strokeOpacity="0.2"
                          />
                          <circle cx="52" cy="32" r="2" fill="#6366f1" fillOpacity="0.3" />
                        </g>
                      </svg>
                    </div>
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
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-indigo-100 flex items-center gap-3"
                  >
                    <div className="relative">
                      <Skeleton className="w-10 h-10 rounded-xl" />
                      <div className="absolute inset-0 border border-indigo-200/50 rounded-xl animate-breathe"></div>
                    </div>
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
