import { Skeleton } from "@/components/ui/skeleton"

export default function BrandDnaLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* En-tête */}
      <div className="mb-8 space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-48 rounded-full" />
          <Skeleton className="h-6 w-44 rounded-full" />
          <Skeleton className="h-6 w-52 rounded-full" />
        </div>
      </div>

      {/* Formulaire */}
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  )
}
