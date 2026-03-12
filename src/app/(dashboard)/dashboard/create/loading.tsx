import { Skeleton } from "@/components/ui/skeleton"

export default function WorkflowCreateLoading() {
  return (
    <div className="flex h-full flex-col p-6">
      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center">
            <Skeleton className="size-8 rounded-full" />
            {i < 6 && <Skeleton className="mx-1 h-0.5 w-6 sm:mx-2 sm:w-10" />}
          </div>
        ))}
      </div>

      {/* Contenu étape */}
      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <div className="flex justify-end">
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
