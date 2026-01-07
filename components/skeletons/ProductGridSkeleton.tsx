import { Skeleton } from "@/components/ui/Skeleton";

export function ProductGridSkeleton() {
  return (
    <div className="space-y-20 pb-20 animate-in fade-in-50">
      {/* Hero Section Skeleton */}
      <section className="relative text-center space-y-8 py-20 px-4 overflow-hidden rounded-3xl bg-gray-50/50 border border-gray-100">
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <div className="absolute -top-20 -left-20 w-60 h-60 bg-gray-200/50 rounded-full blur-3xl animate-float" />
          <div
            className="absolute -bottom-20 -right-20 w-60 h-60 bg-gray-200/50 rounded-full blur-3xl animate-float"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        <div className="relative space-y-6">
          <div className="flex justify-center">
            <Skeleton className="h-7 w-40 rounded-full" />
          </div>
          <Skeleton className="h-16 md:h-20 w-3/4 max-w-2xl mx-auto" />
          <Skeleton className="h-6 w-2/3 max-w-xl mx-auto" />
          <div className="pt-4 flex justify-center">
            <Skeleton className="h-14 w-48 rounded-2xl" />
          </div>
        </div>
      </section>

      {/* Grid Header Skeleton */}
      <section id="products" className="scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-l-4 border-gray-200 pl-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-5 w-72" />
          </div>
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="group h-full" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="h-full flex flex-col overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
                {/* Card Media Area */}
                <div className="h-56 relative overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="space-y-3 text-center">
                      <Skeleton className="h-1 w-16 mx-auto rounded-full" />
                      <Skeleton className="h-10 w-28 mx-auto" />
                      <Skeleton className="h-6 w-20 mx-auto rounded-lg" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-8 bg-white">
                  <div className="flex-grow space-y-4">
                    {/* Title */}
                    <Skeleton className="h-8 w-3/4" />

                    {/* Description */}
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-7 w-28" />
                    </div>
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
