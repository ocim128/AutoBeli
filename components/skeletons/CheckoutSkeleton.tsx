import { Skeleton } from "@/components/ui/Skeleton";

export function CheckoutSkeleton() {
    return (
        <div className="max-w-3xl mx-auto py-12 animate-in fade-in-50">
            <Skeleton className="h-10 w-48 mb-8" />

            <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
                <div className="p-6 bg-gray-50 border-b">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                </div>

                <div className="p-8">
                    <div className="flex items-start justify-between mb-8">
                        <div className="w-full mr-4">
                            <Skeleton className="h-7 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <div className="text-right">
                            <Skeleton className="h-8 w-32" />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 space-y-4">
                        <div className="flex justify-between">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-32" />
                        </div>
                        <div className="flex justify-between">
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                        <div className="flex justify-between border-t border-gray-100 pt-4">
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-7 w-36" />
                        </div>
                    </div>

                    <div className="mt-8 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-12 w-full rounded-lg" />
                            <Skeleton className="h-3 w-64" />
                        </div>
                        <Skeleton className="h-14 w-full rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
}
