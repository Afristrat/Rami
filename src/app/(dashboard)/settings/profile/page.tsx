import { redirect } from "next/navigation"
import { getProfileAction } from "@/lib/actions/settings.actions"
import { ProfileForm } from "@/components/settings/profile-form"

export const metadata = {
  title: "Profil — Paramètres RAMI",
}

export default async function ProfilePage() {
  const { data: profile, error } = await getProfileAction()

  if (error || !profile) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Profil</h2>
        <p className="text-sm text-muted-foreground">
          Votre nom et photo visibles par les membres de votre équipe.
        </p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  )
}
