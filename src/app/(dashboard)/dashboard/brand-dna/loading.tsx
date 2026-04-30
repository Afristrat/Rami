import { Skeleton } from "@/components/ui/skeleton"

export default function BrandDnaLoading() {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-8">
      {/* Hero skeleton */}
      <div className="glass-card rounded-xl p-8 sm:p-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="space-y-4 flex-1">
            <Skeleton className="h-10 w-80" />
            <Skeleton className="h-5 w-96" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-10 w-48 rounded-lg" />
              <Skeleton className="h-10 w-36 rounded-lg" />
            </div>
          </div>
          <Skeleton className="size-32 rounded-full" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <div className="col-span-12 glass-card rounded-xl p-8">
          <Skeleton className="h-4 w-40 mb-6" />
          <div className="grid md:grid-cols-2 gap-12">
            <div className="flex gap-6">
              <Skeleton className="size-24 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-7 glass-card rounded-xl p-8">
          <Skeleton className="h-4 w-32 mb-6" />
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1">
                <Skeleton className="h-24 w-full rounded-lg mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 glass-card rounded-xl p-8">
          <Skeleton className="h-4 w-40 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    </div>
  )
}
