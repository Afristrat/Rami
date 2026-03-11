"use client"

import { useState, useTransition } from "react"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CalendarGrid } from "./CalendarGrid"
import { UpcomingPostsList } from "./UpcomingPostsList"
import { PostDetailPanel } from "./PostDetailPanel"
import { NewPostDialog } from "./NewPostDialog"
import { getPostsForMonth, getUpcomingPosts } from "@/app/actions/scheduler"
import type { ScheduledPost } from "@/lib/scheduler/types"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import { cn } from "@/lib/utils"

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

interface SchedulerCalendarProps {
  initialPosts: ScheduledPost[]
  initialUpcoming: ScheduledPost[]
}

export function SchedulerCalendar({
  initialPosts,
  initialUpcoming,
}: SchedulerCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [calendarPosts, setCalendarPosts] = useState<ScheduledPost[]>(initialPosts)
  const [upcomingPosts, setUpcomingPosts] = useState<ScheduledPost[]>(initialUpcoming)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isLoadingMonth, startMonthTransition] = useTransition()

  // ── Navigation mois ────────────────────────────────────────────────────────

  function goToPrevMonth() {
    const newMonth = month === 0 ? 11 : month - 1
    const newYear = month === 0 ? year - 1 : year
    navigateToMonth(newYear, newMonth)
  }

  function goToNextMonth() {
    const newMonth = month === 11 ? 0 : month + 1
    const newYear = month === 11 ? year + 1 : year
    navigateToMonth(newYear, newMonth)
  }

  function goToToday() {
    navigateToMonth(today.getFullYear(), today.getMonth())
  }

  function navigateToMonth(y: number, m: number) {
    setYear(y)
    setMonth(m)
    setSelectedPost(null)

    startMonthTransition(async () => {
      const result = await getPostsForMonth(y, m)
      if (result.success) {
        setCalendarPosts(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  // ── Rafraîchissement après création / suppression ──────────────────────────

  function handlePostCreated(post: ScheduledPost) {
    // Ajouter au calendrier si dans le mois courant
    if (post.scheduled_at) {
      const d = new Date(post.scheduled_at)
      if (d.getFullYear() === year && d.getMonth() === month) {
        setCalendarPosts((prev) => [...prev, post])
      }
    }
    // Rafraîchir la liste à venir
    startMonthTransition(async () => {
      const result = await getUpcomingPosts()
      if (result.success) setUpcomingPosts(result.data)
    })
  }

  function handlePostDeleted(postId: string) {
    setCalendarPosts((prev) => prev.filter((p) => p.id !== postId))
    setUpcomingPosts((prev) => prev.filter((p) => p.id !== postId))
    if (selectedPost?.id === postId) setSelectedPost(null)
  }

  // ── Clic sur une cellule du calendrier ────────────────────────────────────

  function handleDayClick(date: Date) {
    if (!selectedPost) {
      setSelectedDate(date)
    }
  }

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="flex gap-6 h-full">
      {/* ── Colonne principale : calendrier ──────────────────────────────── */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Barre de navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {MONTH_NAMES[month]} {year}
            </h2>
            {!isCurrentMonth && (
              <button
                type="button"
                onClick={goToToday}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
              >
                Aujourd&apos;hui
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <NewPostDialog
              defaultDate={selectedDate}
              onCreated={handlePostCreated}
            />
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon-sm"
                onClick={goToPrevMonth}
                disabled={isLoadingMonth}
                aria-label="Mois précédent"
                className="rounded-r-none"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={goToNextMonth}
                disabled={isLoadingMonth}
                aria-label="Mois suivant"
                className="rounded-l-none border-l-0"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Grille calendrier */}
        <div className={cn("transition-opacity", isLoadingMonth && "opacity-60")}>
          <CalendarGrid
            year={year}
            month={month}
            posts={calendarPosts}
            onPostClick={setSelectedPost}
            onDayClick={handleDayClick}
          />
        </div>

        {/* Légende plateformes */}
        <PlatformLegend posts={calendarPosts} />
      </div>

      {/* ── Colonne latérale : détail post OU liste à venir ──────────────── */}
      <div className="w-80 shrink-0 space-y-4">
        {selectedPost ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <PostDetailPanel
              post={selectedPost}
              onClose={() => setSelectedPost(null)}
              onDeleted={handlePostDeleted}
            />
          </div>
        ) : (
          <>
            {/* Header liste à venir */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  Posts à venir
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                30 prochains jours
              </span>
            </div>

            <UpcomingPostsList
              posts={upcomingPosts}
              onDeleted={handlePostDeleted}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ── Légende des plateformes ──────────────────────────────────────────────────

function PlatformLegend({ posts }: { posts: ScheduledPost[] }) {
  const platformsUsed = Array.from(
    new Set(posts.flatMap((p) => p.platforms))
  )

  if (platformsUsed.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs text-muted-foreground">Légende :</span>
      {platformsUsed.map((p) => {
        const cfg = PLATFORM_CONFIG[p]
        return (
          <span key={p} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: cfg.color }}
            />
            {cfg.label}
          </span>
        )
      })}
    </div>
  )
}
