import { cn } from "@/lib/utils"

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
    />
  )
}

function PlatformCardSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
      {/* Icône */}
      <Skeleton className="size-11 shrink-0 rounded-xl" />
      {/* Texte */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-56" />
      </div>
      {/* Bouton */}
      <Skeleton className="h-7 w-24 shrink-0 rounded-lg" />
    </div>
  )
}

export function ConnectionsSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Résumé */}
      <Skeleton className="h-12 w-full rounded-xl" />
      {/* 5 cartes */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <PlatformCardSkeleton key={i} />
        ))}
      </div>
      {/* Note */}
      <Skeleton className="h-3 w-80" />
    </div>
  )
}
