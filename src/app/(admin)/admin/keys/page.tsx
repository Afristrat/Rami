import { Key, Info, GitBranch } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getProviderKeys } from "@/lib/actions/admin.actions"
import { getChainsAction } from "@/lib/actions/admin-prompts.actions"
import { ProviderKeysPanel } from "@/components/admin/provider-keys-panel"
import { ProvidersClient } from "@/components/admin/providers-client"

export const metadata = {
  title: "Providers & Clés — Admin RAMI",
  robots: "noindex, nofollow",
}

export default async function AdminKeysPage() {
  const [keysResult, chainsResult] = await Promise.all([
    getProviderKeys(),
    getChainsAction(),
  ])

  const keys = "data" in keysResult ? keysResult.data : []
  const chains = "data" in chainsResult ? chainsResult.data : []
  const keysError = "error" in keysResult ? keysResult.error : null
  const chainsError = "error" in chainsResult ? chainsResult.error : null
  const t = await getTranslations("admin")

  return (
    <div>
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground mb-1.5">
          <Key className="size-4" />
          <span className="text-sm font-medium">{t("navProvidersKeys")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("providersKeysTitle")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {t("providersKeysDescription")}
        </p>

        {/* Info box */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 max-w-2xl">
          <Info className="size-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-300/80 leading-relaxed space-y-1">
            <p>
              <strong className="text-blue-300">{t("byokInfo")}</strong> : {t("byokInfoDescription")}
            </p>
            <p>
              <strong className="text-blue-300">{t("envInfo")}</strong> : {t("envInfoDescription")}
            </p>
            <p>
              <strong className="text-blue-300">{t("fallbackChainsInfo")}</strong> : {t("fallbackChainsInfoDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 — Clés providers */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Key className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">{t("providerApiKeys")}</h2>
        </div>

        {keysError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">{t("errorPrefix")}{keysError}</p>
          </div>
        ) : (
          <ProviderKeysPanel initialKeys={keys} />
        )}
      </section>

      {/* Section 2 — Chaînes de fallback */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <GitBranch className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">{t("fallbackChains")}</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-5 max-w-xl">
          {t("fallbackChainsDescription")}
        </p>

        {chainsError ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-400">{t("errorPrefix")}{chainsError}</p>
          </div>
        ) : (
          <ProvidersClient chains={chains} />
        )}
      </section>
    </div>
  )
}
