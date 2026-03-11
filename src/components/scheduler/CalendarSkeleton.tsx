import { Skeleton } from "@/components/ui/skeleton"

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

export function CalendarSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* En-tête */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille 5 semaines */}
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[100px] border-b border-r border-border p-1.5 last:border-r-0 [&:nth-child(7n)]:border-r-0"
          >
            {/* Numéro du jour */}
            <Skeleton className="mb-1.5 size-6 rounded-full" />
            {/* Chips aléatoires */}
            {i % 3 === 0 && <Skeleton className="mb-0.5 h-4 w-full rounded" />}
            {i % 5 === 0 && <Skeleton className="h-4 w-4/5 rounded" />}
          </div>
        ))}
      </div>
    </div>
  )
}
