import { getTranslations } from "next-intl/server"
import { ApiKeysClient } from "@/components/settings/api-keys-client"
import { listApiKeysAction } from "@/lib/actions/api-keys.actions"
import { requireFeature } from "@/lib/billing/require-feature"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("settingsApi"),
    description: t("settingsApiDescription"),
  }
}

export default async function ApiSettingsPage() {
  await requireFeature("api_publique")
  const { keys } = await listApiKeysAction()

  return (
    <div className="space-y-6">
      <ApiKeysClient initialKeys={keys} />
    </div>
  )
}
