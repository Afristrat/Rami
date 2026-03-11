import type { Metadata } from "next"
import { ConnectionsClient } from "@/components/connections/connections-client"
import { getConnectionsAction } from "@/lib/actions/connections.actions"
import { Link2, ShieldCheck } from "lucide-react"

export const metadata: Metadata = {
  title: "Connexions sociales — RAMI",
  description: "Connectez vos comptes de réseaux sociaux à RAMI pour publier directement.",
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

  const connectedCount = connections.filter((c) => c.status === "connected").length

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Link2 className="size-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Réseaux sociaux</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Connexions OAuth</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Connectez vos comptes pour publier directement depuis le workflow RAMI.
          </p>
        </div>

        {/* Badge sécurité */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
          <ShieldCheck className="size-3.5" />
          Chiffrement AES-256
        </div>
      </div>

      {/* Notifications d'état */}
      {success === "connected" && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
            Compte connecté avec succès — vous pouvez maintenant publier sur cette plateforme.
          </p>
        </div>
      )}
      {disconnected === "true" && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3">
          <div className="size-2 rounded-full bg-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Compte déconnecté. L&apos;accès a été révoqué sur la plateforme.
          </p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3">
          <div className="size-2 rounded-full bg-destructive" />
          <p className="text-sm text-destructive">
            <span className="font-medium">Erreur OAuth : </span>
            {error.replace(/_/g, " ")}. Veuillez réessayer.
          </p>
        </div>
      )}

      {/* Résumé global */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{connectedCount}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compte{connectedCount !== 1 ? "s" : ""} connecté{connectedCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">5</p>
          <p className="text-xs text-muted-foreground mt-0.5">Plateformes disponibles</p>
        </div>
        <div className="hidden sm:block rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">
            {connectedCount > 0 ? "✓" : "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Prêt à publier</p>
        </div>
      </div>

      {/* Liste des plateformes */}
      <ConnectionsClient initialConnections={connections} />
    </div>
  )
}
