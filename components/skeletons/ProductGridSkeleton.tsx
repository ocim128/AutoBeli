import { Skeleton } from "@/components/ui/Skeleton";
import { KineticOrbitalSVG } from "@/components/ui/KineticOrbitalSVG";
import ScrollAnimate from "@/components/ui/ScrollAnimate";

export function ProductGridSkeleton() {
  return (
    <div className="space-y-24 pb-20 animate-in fade-in-50">
      {/* Hero Section Skeleton with Kinetic Geometry */}
      <section className="relative text-center space-y-8 py-28 px-4 overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-50/30 to-white border border-indigo-100/50">
        {/* Kinetic geometry skeleton animation */}
        <div className="absolute inset-0 overflow-hidden -z-10">
          <svg
            className="absolute w-full h-full"
            viewBox="0 0 1000 600"
            preserveAspectRatio="xMidYMid slice"
          >
            <KineticOrbitalSVG
              cx={500}
              cy={300}
              scale={0.7}
              withGlow={false}
              glowId="heroSkeletonGlow"
            />
          </svg>
        </div>

        <div className="relative space-y-6">
          <div className="flex justify-center">
            <Skeleton className="h-8 w-48 rounded-full" />
          </div>
          <Skeleton className="h-16 md:h-20 w-3/4 max-w-2xl mx-auto rounded-2xl" />
          <Skeleton className="h-6 w-2/3 max-w-xl mx-auto" />
          <div className="pt-4 flex justify-center">
            <Skeleton className="h-14 w-48 rounded-xl" />
          </div>
          {/* Decorative orbital skeleton */}
          <div className="flex justify-center pt-4">
            <div className="relative w-16 h-16">
              <div
                className="absolute inset-0 border border-indigo-200/50 rounded-full animate-orbit-slow"
                style={{ transformOrigin: "center" }}
              />
              <div
                className="absolute inset-2 border border-indigo-300/50 rounded-full animate-orbit-reverse"
                style={{ transformOrigin: "center" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Skeleton className="w-3 h-3 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </section>

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
            <ScrollAnimate key={i} animation="fade-up" delay={((i % 6) + 1) * 100}>
              <div className="group h-full">
                <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {/* Card Media Area with orbital pattern */}
                  <div className="h-52 relative overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    <svg
                      className="absolute inset-0 w-full h-full"
                      viewBox="0 0 200 200"
                      preserveAspectRatio="xMidYMid slice"
                    >
                      <KineticOrbitalSVG
                        cx={100}
                        cy={100}
                        scale={0.17}
                        withGlow={false}
                        glowId={`cardGlow-${i}`}
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="5"
                        fill="#6366f1"
                        fillOpacity="0.4"
                        className="animate-breathe"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="space-y-3 text-center">
                        <Skeleton className="h-8 w-24 mx-auto bg-white/10" />
                        <Skeleton className="h-4 w-16 mx-auto rounded-lg bg-white/10" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6 bg-white">
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
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-5">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-6 w-28" />
                      </div>
                      <Skeleton className="w-12 h-12 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>
            </ScrollAnimate>
          ))}
        </div>
      </section>
    </div>
  );
}
