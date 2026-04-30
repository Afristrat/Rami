import { getTranslations } from "next-intl/server"
import { ConnectionsClient } from "@/components/connections/connections-client"
import { getConnectionsAction } from "@/lib/actions/connections.actions"
import { ConnectionsBanners } from "@/components/settings/connections-banners"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("settingsConnections"),
    description: t("settingsConnectionsDescription"),
  }
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
    <div className="space-y-6">
      <ConnectionsBanners
        success={success}
        error={error}
        disconnected={disconnected}
      />

      <ConnectionsClient initialConnections={connections} />
    </div>
  )
}
