import { Bot, Info } from "lucide-react"
import { getPromptsAction } from "@/lib/actions/admin-prompts.actions"
import { PromptsTable } from "@/components/admin/prompts-table"

export const metadata = {
  title: "Prompts IA — Admin RAMI",
  description: "Gestion des configurations prompts IA — super_admin uniquement.",
  robots: "noindex, nofollow",
}

export default async function AdminPromptsPage() {
  const result = await getPromptsAction()
  const configs = "data" in result ? result.data : []
  const fetchError = "error" in result ? result.error : null

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Bot className="size-4" />
          <span className="text-sm font-medium">Prompts IA</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Configuration des prompts IA
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Gérez les prompts système utilisés par RAMI pour chaque usage LLM. Les clés API BYOK
          sont chiffrées AES-256-GCM avant stockage et ne sont jamais retournées en clair.
        </p>

        {/* Info box */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 max-w-2xl">
          <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300/80 leading-relaxed space-y-1">
            <p>
              <strong className="text-blue-300">BYOK</strong> : si une clé est configurée pour un
              prompt, elle sera utilisée en priorité sur la variable d&apos;environnement.
            </p>
            <p>
              <strong className="text-blue-300">field_key</strong> : identifiant immuable référencé
              dans le code — ne pas modifier les clés existantes sans mettre à jour le code.
            </p>
            <p>
              <strong className="text-blue-300">Tester</strong> : envoie un message de test
              &ldquo;Réponds en une phrase : quel est ton rôle ?&rdquo; au modèle configuré.
            </p>
          </div>
        </div>
      </div>

      {/* Erreur de chargement */}
      {fetchError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">Erreur : {fetchError}</p>
        </div>
      )}

      {/* Table */}
      <PromptsTable initialConfigs={configs} />
    </div>
  )
}
