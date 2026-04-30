import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { createClient } from "@/lib/supabase/server"
import { SchedulerCalendar } from "@/components/scheduler/SchedulerCalendar"
import { getPostsForMonth, getUpcomingPosts, getDraftPosts } from "@/app/actions/scheduler"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("calendar"),
    description: t("calendarDescription"),
  }
}

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const now = new Date()

  // Chargement des données côté serveur (SSR)
  const [monthResult, upcomingResult, draftsResult] = await Promise.all([
    getPostsForMonth(now.getFullYear(), now.getMonth()),
    getUpcomingPosts(20),
    getDraftPosts(20),
  ])

  const initialPosts = monthResult.success ? monthResult.data : []
  const initialUpcoming = upcomingResult.success ? upcomingResult.data : []
  const initialDrafts = draftsResult.success ? draftsResult.data : []

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <SchedulerCalendar
        initialPosts={initialPosts}
        initialUpcoming={initialUpcoming}
        initialDrafts={initialDrafts}
      />
    </div>
  )
}
