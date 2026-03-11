import { ConnectionsSkeleton } from "@/components/connections/connections-skeleton"

export default function ConnectionsLoading() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Connexions sociales</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connectez vos comptes pour publier directement depuis RAMI.
        </p>
      </div>
      <ConnectionsSkeleton />
    </div>
  )
}
