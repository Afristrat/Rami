import { ConnectionsClient } from "@/components/connections/connections-client"
import { Link2 } from "lucide-react"

export const metadata = {
  title: "Connexions — RAMI",
  description: "Connectez vos comptes de réseaux sociaux à RAMI.",
}

export default function ConnectionsPage() {
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

      <ConnectionsClient />
    </div>
  )
}
