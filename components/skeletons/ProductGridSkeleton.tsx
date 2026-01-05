import { Skeleton } from "@/components/ui/Skeleton";

export function ProductGridSkeleton() {
    return (
        <div className="space-y-12 animate-in fade-in-50">
            {/* Hero Section Skeleton */}
            <section className="text-center space-y-4 py-12">
                <Skeleton className="h-16 w-3/4 max-w-lg mx-auto" />
                <Skeleton className="h-6 w-2/3 max-w-xl mx-auto" />
            </section>

            {/* Grid Header Skeleton */}
            <section>
                <div className="flex items-center justify-between mb-8">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-32" />
                </div>

                {/* Product Cards Grid */}
                <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="group relative block h-full">
                            <div className="h-full flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white">
                                {/* Image Placeholder */}
                                <Skeleton className="h-48 w-full rounded-none" />

                                <div className="flex flex-1 flex-col p-6 space-y-4">
                                    {/* Title */}
                                    <Skeleton className="h-7 w-3/4" />

                                    {/* Description */}
                                    <div className="space-y-2 flex-grow">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-5/6" />
                                        <Skeleton className="h-4 w-4/6" />
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                                        <div className="flex flex-col space-y-1">
                                            <Skeleton className="h-3 w-10" />
                                            <Skeleton className="h-6 w-24" />
                                        </div>
                                        <Skeleton className="h-9 w-28 rounded-full" />
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
