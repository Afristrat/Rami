import { Bot, Info } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getPromptsAction } from "@/lib/actions/admin-prompts.actions"
import { PromptsTable } from "@/components/admin/prompts-table"

export const metadata = {
  title: "Prompts IA — Admin RAMI",
  description: "Prompt configurations management — super_admin only.",
  robots: "noindex, nofollow",
}

export default async function AdminPromptsPage() {
  const result = await getPromptsAction()
  const configs = "data" in result ? result.data : []
  const fetchError = "error" in result ? result.error : null
  const t = await getTranslations("admin")

  return (
    <div>
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Bot className="size-4" />
          <span className="text-sm font-medium">{t("promptsIa")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("promptsTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed max-w-2xl">
          {t("promptsDescription")}
        </p>

        {/* Info box */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 max-w-2xl">
          <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300/80 leading-relaxed space-y-1">
            <p>
              <strong className="text-blue-300">BYOK</strong> : {t("promptsByokInfo")}
            </p>
            <p>
              <strong className="text-blue-300">field_key</strong> : {t("promptsFieldKeyInfo")}
            </p>
            <p>
              <strong className="text-blue-300">{t("test")}</strong> : {t("promptsTestInfo")}
            </p>
          </div>
        </div>
      </div>

      {/* Erreur de chargement */}
      {fetchError && (
        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-400">{t("errorPrefix")}{fetchError}</p>
        </div>
      )}

      {/* Table */}
      <PromptsTable initialConfigs={configs} />
    </div>
  )
}
