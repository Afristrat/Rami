import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { getTeamMembersAction, getProfileAction } from "@/lib/actions/settings.actions"
import { TeamManager } from "@/components/settings/team-manager"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("settingsTeam"),
  }
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
    <TeamManager
      initialMembers={membersResult.data}
      ownerEmail={profileResult.data.email}
    />
  )
}
