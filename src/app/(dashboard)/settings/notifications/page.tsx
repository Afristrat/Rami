import { redirect } from "next/navigation"
import {
  getNotificationPreferencesAction,
  getProfileAction,
} from "@/lib/actions/settings.actions"
import { NotificationPreferencesForm } from "@/components/settings/notification-preferences"

export const metadata = {
  title: "Notifications — Paramètres RAMI",
}

export default async function NotificationsPage() {
  const [profileResult, prefsResult] = await Promise.all([
    getProfileAction(),
    getNotificationPreferencesAction(),
  ])

  if (!profileResult.data) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          Contrôlez les emails que RAMI vous envoie.
        </p>
      </div>
      <NotificationPreferencesForm initialPrefs={prefsResult.data} />
    </div>
  )
}
