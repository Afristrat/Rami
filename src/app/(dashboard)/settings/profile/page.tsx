import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import {
  getProfileAction,
  getNotificationPreferencesAction,
  getCollectiveOptinAction,
} from "@/lib/actions/settings.actions"
import { GeneralSettingsClient } from "@/components/settings/general-settings-client"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("settingsGeneral"),
  }
}

export default async function ProfilePage() {
  const [profileResult, prefsResult, optinResult] = await Promise.all([
    getProfileAction(),
    getNotificationPreferencesAction(),
    getCollectiveOptinAction(),
  ])

  if (!profileResult.data) {
    redirect("/login")
  }

  return (
    <GeneralSettingsClient
      profile={profileResult.data}
      initialPrefs={prefsResult.data}
      initialCollectiveOptin={optinResult.optin}
    />
  )
}
