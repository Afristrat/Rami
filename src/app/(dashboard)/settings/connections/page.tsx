import { ConnectionsClient } from "@/components/connections/connections-client"
import { getConnectionsAction } from "@/lib/actions/connections.actions"

export const metadata = {
  title: "Connexions — RAMI",
  description: "Connectez vos comptes de réseaux sociaux à RAMI.",
}

interface Props {
  searchParams: Promise<{
    success?: string
    error?: string
    disconnected?: string
  }>
}

export default async function ConnectionsPage({ searchParams }: Props) {
  const { success, error, disconnected } = await searchParams
  const { data: connections } = await getConnectionsAction()

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">Connexions sociales</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Connectez vos comptes pour publier directement depuis RAMI.
        </p>
      </div>

      {success === "connected" && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Compte connecté avec succès.
        </div>
      )}
      {disconnected === "true" && (
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          Compte déconnecté. L&apos;accès a été révoqué.
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erreur :{" "}
          <span className="font-medium">{error.replace(/_/g, " ")}</span>.
          Veuillez réessayer.
        </div>
      )}

      <ConnectionsClient initialConnections={connections} />
    </div>
  )
}
