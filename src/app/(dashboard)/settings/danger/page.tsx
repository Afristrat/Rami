import { redirect } from "next/navigation"
import { getProfileAction } from "@/lib/actions/settings.actions"
import { DangerZone } from "@/components/settings/danger-zone"

export const metadata = {
  title: "Zone de danger — Paramètres RAMI",
}

export default async function DangerPage() {
  const { data: profile } = await getProfileAction()

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Zone de danger</h2>
        <p className="text-sm text-muted-foreground">
          Actions irréversibles affectant l&apos;ensemble de votre espace RAMI.
        </p>
      </div>
      <DangerZone />
    </div>
  )
}
