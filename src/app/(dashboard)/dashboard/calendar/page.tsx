import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SchedulerCalendar } from "@/components/scheduler/SchedulerCalendar"
import { getPostsForMonth, getUpcomingPosts, getDraftPosts } from "@/app/actions/scheduler"

export const metadata: Metadata = {
  title: "Calendrier — RAMI",
  description: "Planifiez et gérez vos publications sur les réseaux sociaux.",
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
    <div className="flex h-full flex-col">
      {/* Header de page */}
      <div className="border-b border-border bg-card/50 px-6 py-4 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Calendrier de publication
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Planifiez et visualisez vos posts par plateforme.
            </p>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-auto p-6">
        <SchedulerCalendar
          initialPosts={initialPosts}
          initialUpcoming={initialUpcoming}
          initialDrafts={initialDrafts}
        />
      </div>
    </div>
  )
}
