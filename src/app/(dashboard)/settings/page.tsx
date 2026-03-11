import { redirect } from "next/navigation"

// /dashboard/settings redirige vers la sous-page par défaut
export default function SettingsPage() {
  redirect("/dashboard/settings/connections")
}
