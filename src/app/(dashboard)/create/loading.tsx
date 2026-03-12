import { Skeleton } from "@/components/ui/skeleton"

export default function CreateLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3.5 w-64" />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center">
              <Skeleton className="size-8 rounded-full" />
              {i < 6 && <Skeleton className="mx-2 h-0.5 w-8" />}
            </div>
          ))}
        </div>

        {/* Contenu étape */}
        <div className="mx-auto max-w-xl space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="flex justify-end">
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
