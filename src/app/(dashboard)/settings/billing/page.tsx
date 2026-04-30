import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getProfileAction } from "@/lib/actions/settings.actions"
import { BillingSettingsClient } from "@/components/settings/billing-settings-client"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("settingsBilling"),
  }
}

export default async function BillingSettingsPage() {
  const { data: profile } = await getProfileAction()

  if (!profile) {
    redirect("/login")
  }

  return <BillingSettingsClient />
}
