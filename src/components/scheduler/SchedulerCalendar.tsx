"use client"

import { useState, useTransition, useEffect } from "react"
import { ChevronLeft, ChevronRight, CalendarDays, FileEdit, PanelRightOpen, PanelRightClose } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { CalendarGrid } from "./CalendarGrid"
import { CalendarSkeleton } from "./CalendarSkeleton"
import { MonthSummary } from "./MonthSummary"
import { UpcomingPostsList } from "./UpcomingPostsList"
import { DraftPostsList } from "./DraftPostsList"
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
  initialDrafts: ScheduledPost[]
}

export function SchedulerCalendar({
  initialPosts,
  initialUpcoming,
  initialDrafts,
}: SchedulerCalendarProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [calendarPosts, setCalendarPosts] = useState<ScheduledPost[]>(initialPosts)
  const [upcomingPosts, setUpcomingPosts] = useState<ScheduledPost[]>(initialUpcoming)
  const [draftPosts, setDraftPosts] = useState<ScheduledPost[]>(initialDrafts)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isLoadingMonth, startMonthTransition] = useTransition()
  const [isLoadingUpcoming, startUpcomingTransition] = useTransition()
  const [, startDraftTransition] = useTransition()

  // ── Navigation mois ────────────────────────────────────────────────────────

  function goToPrevMonth() {
    navigateToMonth(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1)
  }

  function goToNextMonth() {
    navigateToMonth(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1)
  }

  function goToToday() {
    navigateToMonth(today.getFullYear(), today.getMonth())
  }

  function navigateToMonth(y: number, m: number) {
    setYear(y)
    setMonth(m)
    setSelectedPost(null)
    setSelectedDate(null)

    startMonthTransition(async () => {
      const result = await getPostsForMonth(y, m)
      if (result.success) {
        setCalendarPosts(result.data)
      } else {
        toast.error(result.error)
      }
    })
  }

  // ── Création / suppression de posts ───────────────────────────────────────

  function handlePostCreated(post: ScheduledPost) {
    if (post.scheduled_at) {
      const d = new Date(post.scheduled_at)
      if (d.getFullYear() === year && d.getMonth() === month) {
        setCalendarPosts((prev) => [...prev, post])
      }
      startUpcomingTransition(async () => {
        const result = await getUpcomingPosts()
        if (result.success) setUpcomingPosts(result.data)
      })
    } else {
      // Post sans date → brouillon visible dans la section Brouillons
      setDraftPosts((prev) => [...prev, post])
    }
  }

  function handlePostDeleted(postId: string) {
    setCalendarPosts((prev) => prev.filter((p) => p.id !== postId))
    setUpcomingPosts((prev) => prev.filter((p) => p.id !== postId))
    setDraftPosts((prev) => prev.filter((p) => p.id !== postId))
    if (selectedPost?.id === postId) setSelectedPost(null)
  }

  function handlePostUpdated(updated: ScheduledPost) {
    // Si le post a maintenant une date → le sortir des brouillons
    if (updated.scheduled_at) {
      setDraftPosts((prev) => prev.filter((p) => p.id !== updated.id))
      const d = new Date(updated.scheduled_at)
      if (d.getFullYear() === year && d.getMonth() === month) {
        setCalendarPosts((prev) => {
          const exists = prev.some((p) => p.id === updated.id)
          return exists ? prev.map((p) => p.id === updated.id ? updated : p) : [...prev, updated]
        })
      } else {
        setCalendarPosts((prev) => prev.filter((p) => p.id !== updated.id))
      }
      startDraftTransition(async () => {
        const result = await getUpcomingPosts()
        if (result.success) setUpcomingPosts(result.data)
      })
    } else {
      // Pas de date → reste dans les brouillons
      setDraftPosts((prev) => {
        const exists = prev.some((p) => p.id === updated.id)
        return exists ? prev.map((p) => p.id === updated.id ? updated : p) : [...prev, updated]
      })
      setCalendarPosts((prev) => prev.filter((p) => p.id !== updated.id))
    }
    setSelectedPost(updated)
  }

  function handlePostDuplicated(duplicated: ScheduledPost) {
    // Le dupliqué est un brouillon sans scheduled_at → ajouter dans la section Brouillons
    setDraftPosts((prev) => [...prev, duplicated])
    toast.success("Brouillon dupliqué créé", { description: duplicated.title ?? undefined })
  }

  // ── Raccourcis clavier ────────────────────────────────────────────────────

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      // Ignorer si focus dans un champ de saisie
      const tag = (e.target as HTMLElement).tagName
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return

      if (e.key === "ArrowLeft" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        goToPrevMonth()
      } else if (e.key === "ArrowRight" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        goToNextMonth()
      } else if (e.key === "t" || e.key === "T") {
        goToToday()
      } else if (e.key === "Escape" && selectedPost) {
        setSelectedPost(null)
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, selectedPost])

  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth()

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ── Barre de navigation ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Mois + bouton aujourd'hui */}
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

        {/* Actions */}
        <div className="flex items-center gap-2">
          <NewPostDialog
            defaultDate={selectedDate}
            onCreated={handlePostCreated}
          />

          {/* Navigation mois */}
          <div className="flex items-center">
            <Button
              variant="outline"
              size="icon-sm"
              onClick={goToPrevMonth}
              disabled={isLoadingMonth}
              aria-label="Mois précédent (←)"
              title="Mois précédent (←)"
              className="rounded-r-none"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              onClick={goToNextMonth}
              disabled={isLoadingMonth}
              aria-label="Mois suivant (→)"
              title="Mois suivant (→)"
              className="rounded-l-none border-l-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          {/* Toggle sidebar (desktop) */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Masquer le panneau latéral" : "Afficher le panneau latéral"}
            className="hidden lg:inline-flex"
          >
            {sidebarOpen
              ? <PanelRightClose className="size-4" />
              : <PanelRightOpen className="size-4" />
            }
          </Button>
        </div>
      </div>

      {/* ── Résumé du mois ──────────────────────────────────────────────── */}
      <MonthSummary posts={calendarPosts} />

      {/* ── Corps principal ─────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Calendrier */}
        <div className="min-w-0 flex-1 space-y-3">
          {isLoadingMonth ? (
            <CalendarSkeleton />
          ) : (
            <CalendarGrid
              year={year}
              month={month}
              posts={calendarPosts}
              selectedDate={selectedDate}
              onPostClick={(post) => {
                setSelectedPost(post)
                if (!sidebarOpen) setSidebarOpen(true)
              }}
              onDayClick={(date) => {
                setSelectedDate(date)
                if (selectedPost) setSelectedPost(null)
              }}
            />
          )}

          {/* Légende plateformes */}
          {!isLoadingMonth && <PlatformLegend posts={calendarPosts} />}
        </div>

        {/* Sidebar : détail post OU liste à venir */}
        <div
          className={cn(
            "shrink-0 space-y-4 transition-all",
            // Desktop : panneau latéral fixe
            "hidden lg:block",
            sidebarOpen ? "w-72 xl:w-80" : "w-0 overflow-hidden opacity-0 pointer-events-none"
          )}
        >
          {selectedPost ? (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <PostDetailPanel
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
                onDeleted={handlePostDeleted}
                onUpdated={handlePostUpdated}
                onDuplicated={handlePostDuplicated}
              />
            </div>
          ) : (
            <>
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

              <div className={cn(isLoadingUpcoming && "opacity-60")}>
                <UpcomingPostsList
                  posts={upcomingPosts}
                  onDeleted={handlePostDeleted}
                />
              </div>

              {/* Brouillons */}
              {draftPosts.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-1">
                    <FileEdit className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Brouillons
                    </h3>
                    <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      {draftPosts.length}
                    </span>
                  </div>
                  <DraftPostsList
                    posts={draftPosts}
                    onDeleted={handlePostDeleted}
                    onSelect={(post) => {
                      setSelectedPost(post)
                      if (!sidebarOpen) setSidebarOpen(true)
                    }}
                  />
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Sidebar mobile (sous le calendrier) ─────────────────────────── */}
      <div className="block lg:hidden space-y-3">
        {selectedPost ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <PostDetailPanel
              post={selectedPost}
              onClose={() => setSelectedPost(null)}
              onDeleted={handlePostDeleted}
              onUpdated={handlePostUpdated}
            />
          </div>
        ) : (
          <>
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
            <div className={cn(isLoadingUpcoming && "opacity-60")}>
              <UpcomingPostsList
                posts={upcomingPosts}
                onDeleted={handlePostDeleted}
              />
            </div>

            {/* Brouillons mobile */}
            {draftPosts.length > 0 && (
              <>
                <div className="flex items-center gap-2 pt-1">
                  <FileEdit className="size-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Brouillons
                  </h3>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {draftPosts.length}
                  </span>
                </div>
                <DraftPostsList
                  posts={draftPosts}
                  onDeleted={handlePostDeleted}
                  onSelect={setSelectedPost}
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Légende des plateformes ──────────────────────────────────────────────────

function PlatformLegend({ posts }: { posts: ScheduledPost[] }) {
  const platformsUsed = Array.from(new Set(posts.flatMap((p) => p.platforms)))
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
