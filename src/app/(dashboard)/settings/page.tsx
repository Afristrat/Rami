import { redirect } from "next/navigation"

// /settings redirige vers l'onglet Général (profil)
export default function SettingsPage() {
  redirect("/settings/profile")
}
