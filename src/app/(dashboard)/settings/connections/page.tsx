import { Link2 } from "lucide-react"
import { ConnectionsClient } from "@/components/connections/connections-client"
import { getConnectionsAction } from "@/lib/actions/connections.actions"

export const metadata = {
  title: "Connexions — RAMI",
  description: "Connectez vos comptes de réseaux sociaux à RAMI.",
}

interface Props {
  searchParams: Promise<{ success?: string; error?: string }>
}

export default async function ConnectionsPage({ searchParams }: Props) {
  const { success, error } = await searchParams
  const { data: connections } = await getConnectionsAction()

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Link2 className="size-4" />
          <span className="text-sm">Paramètres · Connexions</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Connexions sociales</h1>
        <p className="text-muted-foreground mt-1">
          Connectez vos comptes de réseaux sociaux pour publier directement depuis RAMI.
        </p>
      </div>

      {/* Toast feedback depuis OAuth callback */}
      {success === "connected" && (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          Compte connecté avec succès.
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Erreur de connexion : <span className="font-medium">{error.replace(/_/g, " ")}</span>.
          Veuillez réessayer.
        </div>
      )}

      <ConnectionsClient initialConnections={connections} />
    </div>
  )
}
