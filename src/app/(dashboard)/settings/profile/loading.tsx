import { Skeleton } from "@/components/ui/skeleton"

export default function ProfileLoading() {
  return (
    <div className="max-w-2xl space-y-6">
      <div className="mb-6 space-y-1.5">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-64" />
      </div>
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Skeleton className="size-16 rounded-full" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
      {/* Champs */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-28 rounded-lg" />
    </div>
  )
}
