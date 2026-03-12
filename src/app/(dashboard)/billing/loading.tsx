import { Skeleton } from "@/components/ui/skeleton"

export default function BillingLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* En-tête */}
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-80" />
        </div>

        {/* Plan actuel */}
        <div className="mb-6 rounded-xl border border-border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
            </div>
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        {/* Plans */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>

        {/* Factures */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-3">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
