import { Skeleton } from "@/components/ui/skeleton"

export default function LibraryLoading() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-1 h-4 w-44" />
        <div className="mt-4 flex gap-3">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>
      </div>

      {/* Grille */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Zone upload */}
        <Skeleton className="mb-6 h-28 w-full rounded-xl" />
        {/* Masonry skeleton */}
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="mb-3 break-inside-avoid">
              <Skeleton
                className="w-full rounded-xl"
                style={{ height: `${120 + (i % 3) * 60}px` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
