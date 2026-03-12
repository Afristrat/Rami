import { Skeleton } from "@/components/ui/skeleton"

export default function DangerLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-80" />
      </div>
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-destructive/20 bg-destructive/5 p-5 space-y-3">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
