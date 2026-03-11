import { redirect } from "next/navigation"
import { getTeamMembersAction, getProfileAction } from "@/lib/actions/settings.actions"
import { TeamManager } from "@/components/settings/team-manager"

export const metadata = {
  title: "Équipe — Paramètres RAMI",
}

export default async function TeamPage() {
  const [profileResult, membersResult] = await Promise.all([
    getProfileAction(),
    getTeamMembersAction(),
  ])

  if (!profileResult.data) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl space-y-1">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Équipe</h2>
        <p className="text-sm text-muted-foreground">
          Invitez des collaborateurs et gérez leurs rôles dans votre espace RAMI.
        </p>
      </div>
      <TeamManager
        initialMembers={membersResult.data}
        ownerEmail={profileResult.data.email}
      />
    </div>
  )
}
