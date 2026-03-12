import { Skeleton } from "@/components/ui/skeleton"
import { CalendarSkeleton } from "@/components/scheduler/CalendarSkeleton"

export default function CalendarLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="mt-1.5 h-4 w-64" />
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto p-6">
        <div className="flex h-full flex-col gap-4">
          {/* Barre navigation */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-36" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>

          {/* Résumé */}
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-lg" />
            ))}
          </div>

          {/* Calendrier */}
          <CalendarSkeleton />
        </div>
      </div>
    </div>
  )
}
