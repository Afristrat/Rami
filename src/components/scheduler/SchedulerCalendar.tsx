"use client"

import { useTranslations } from "next-intl"

import { useState, useTransition, useEffect } from "react"
import {
  ChevronLeft,
  ChevronRight,
  FileEdit,
  PanelRightOpen,
  PanelRightClose,
  Sparkles,
  Search,
  Plus,
  CalendarDays,
  MoreHorizontal,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { CalendarGrid } from "./CalendarGrid"
import { CalendarSkeleton } from "./CalendarSkeleton"
import { MonthSummary } from "./MonthSummary"
import { UpcomingPostsList } from "./UpcomingPostsList"
import { DraftPostsList } from "./DraftPostsList"
import { PostDetailPanel } from "./PostDetailPanel"
import { NewPostDialog } from "./NewPostDialog"
import { getPostsForMonth, getUpcomingPosts, reschedulePost } from "@/app/actions/scheduler"
import type { ScheduledPost } from "@/lib/scheduler/types"
import { cn } from "@/lib/utils"
import { useIntlLocale } from "@/lib/utils/format-locale"

const _MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

const MONTH_NAMES_KEYS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
] as const

type ViewMode = "month" | "week" | "day"

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
  const t = useTranslations("calendar")
  const tDash = useTranslations("dashboard")
  const intlLocale = useIntlLocale()
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [calendarPosts, setCalendarPosts] = useState<ScheduledPost[]>(initialPosts)
  const [upcomingPosts, setUpcomingPosts] = useState<ScheduledPost[]>(initialUpcoming)
  const [draftPosts, setDraftPosts] = useState<ScheduledPost[]>(initialDrafts)
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("month")
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
      setDraftPosts((prev) => {
        const exists = prev.some((p) => p.id === updated.id)
        return exists ? prev.map((p) => p.id === updated.id ? updated : p) : [...prev, updated]
      })
      setCalendarPosts((prev) => prev.filter((p) => p.id !== updated.id))
    }
    setSelectedPost(updated)
  }

  function handlePostDuplicated(duplicated: ScheduledPost) {
    setDraftPosts((prev) => [...prev, duplicated])
    toast.success(t("draftDuplicated"), { description: duplicated.title ?? undefined })
  }

  async function handlePostDrop(postId: string, newDate: Date) {
    const result = await reschedulePost(postId, newDate.toISOString())
    if (result.success) {
      handlePostUpdated(result.data)
      toast.success(t("postRescheduled"))
    } else {
      toast.error(result.error)
    }
  }

  // ── Raccourcis clavier ────────────────────────────────────────────────────

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
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

  const _isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth()

  // Determine day detail heading
  const detailDate = selectedDate ?? today
  const detailDateLabel = detailDate.toLocaleDateString(intlLocale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
  const dayPosts = calendarPosts.filter((p) => {
    if (!p.scheduled_at) return false
    const pd = new Date(p.scheduled_at)
    return pd.toDateString() === detailDate.toDateString()
  })

  return (
    <div className="flex h-full flex-col">
      {/* ── Top bar header ─────────────────────────────────────────── */}
      <header className="shrink-0 border-b border-border/50 dark:border-white/5 bg-card/30 dark:bg-[#0A0A0F]/30 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3 lg:px-8">
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Month navigation */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={goToPrevMonth}
                disabled={isLoadingMonth}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent dark:hover:bg-white/5"
                aria-label={t("previousMonth")}
              >
                <ChevronLeft className="size-4" />
              </button>
              <h2 className="min-w-[140px] text-center text-lg font-semibold text-foreground">
                {tDash(MONTH_NAMES_KEYS[month])} {year}
              </h2>
              <button
                type="button"
                onClick={goToNextMonth}
                disabled={isLoadingMonth}
                className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent dark:hover:bg-white/5"
                aria-label={t("nextMonth")}
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Divider */}
            <div className="hidden h-4 w-px bg-border dark:bg-white/10 sm:block" />

            {/* View mode toggle */}
            <div className="hidden sm:flex items-center rounded-full bg-muted/60 dark:bg-white/5 p-1">
              {(["month", "week", "day"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                    viewMode === mode
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "month" ? t("month") : mode === "week" ? t("week") : t("day")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center rounded-xl border border-border/60 dark:border-white/5 bg-muted/40 dark:bg-white/5 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                className="ml-2 w-36 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>

            {/* New post button */}
            <NewPostDialog
              defaultDate={selectedDate}
              onCreated={handlePostCreated}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-rami-blue px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
                >
                  <span>{t("newPost")}</span>
                  <Plus className="size-4" />
                </button>
              }
            />

            {/* Toggle sidebar (desktop) */}
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label={sidebarOpen ? t("hideSidebar") : t("showSidebar")}
              className="hidden lg:flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent dark:hover:bg-white/5"
            >
              {sidebarOpen
                ? <PanelRightClose className="size-4" />
                : <PanelRightOpen className="size-4" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Content Area ──────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left: Calendar + upcoming */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto p-4 lg:p-6">
          {/* Month Summary Strip */}
          <MonthSummary posts={calendarPosts} className="mb-4" />

          {/* Calendar Grid */}
          <div className="flex-1">
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
                onPostDrop={handlePostDrop}
              />
            )}
          </div>

          {/* Empty state */}
          {!isLoadingMonth && calendarPosts.length === 0 && (
            <div className="mt-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-6 text-center">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="size-6 text-primary/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Aucun post ce mois-ci
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Planifiez vos publications pour maintenir une présence régulière.
              </p>
              <Link
                href="/dashboard/create"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Sparkles className="size-3.5" />
                Créer un contenu
              </Link>
            </div>
          )}

          {/* Upcoming publications strip */}
          {upcomingPosts.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-foreground dark:text-slate-300">
                Prochaines publications
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none">
                {upcomingPosts.slice(0, 6).map((post) => (
                  <UpcomingStripCard
                    key={post.id}
                    post={post}
                    onClick={() => {
                      setSelectedPost(post)
                      if (!sidebarOpen) setSidebarOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Day Detail Sidebar */}
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-l border-border/50 dark:border-white/5 bg-card/40 dark:bg-[#0A0A0F]/40 backdrop-blur-xl transition-all lg:flex",
            sidebarOpen ? "w-[340px] xl:w-[360px]" : "w-0 overflow-hidden opacity-0 pointer-events-none"
          )}
        >
          {selectedPost ? (
            <div className="flex h-full flex-col overflow-hidden">
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
              {/* Day header */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold capitalize text-foreground">
                      {detailDateLabel}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {dayPosts.length} post{dayPosts.length !== 1 ? "s" : ""} prévu{dayPosts.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <button className="flex size-9 items-center justify-center rounded-xl bg-muted/60 dark:bg-white/5 text-muted-foreground">
                    <MoreHorizontal className="size-4" />
                  </button>
                </div>

                {/* Day post cards */}
                <div className="space-y-3">
                  {dayPosts.map((post) => (
                    <DaySidebarCard
                      key={post.id}
                      post={post}
                      onClick={() => setSelectedPost(post)}
                    />
                  ))}
                  {dayPosts.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border dark:border-white/10 p-6 text-center">
                      <p className="text-xs text-muted-foreground">
                        Aucun post ce jour
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Upcoming/Drafts in sidebar */}
              <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4">
                {draftPosts.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 pt-2">
                      <FileEdit className="size-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Brouillons
                      </h3>
                      <span className="ml-auto rounded-full bg-muted dark:bg-white/10 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
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
              </div>

              {/* Add post button at bottom */}
              <div className="p-6 bg-gradient-to-t from-background dark:from-[#0A0A0F] to-transparent">
                <NewPostDialog
                  defaultDate={selectedDate}
                  onCreated={handlePostCreated}
                  trigger={
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/60 dark:border-white/10 py-4 text-muted-foreground font-semibold transition-all hover:bg-accent/50 dark:hover:bg-white/5 hover:border-primary/50 hover:text-foreground"
                    >
                      <Plus className="size-4" />
                      <span>{t("addPost")}</span>
                    </button>
                  }
                />
              </div>
            </>
          )}
        </aside>
      </div>

      {/* ── Sidebar mobile (under calendar) ─────────────────────── */}
      <div className="block lg:hidden space-y-3 p-4">
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

// ── Upcoming Strip Card ──────────────────────────────────────────────────────

import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import { PlatformDot } from "./PlatformBadge"

function UpcomingStripCard({
  post,
  onClick,
}: {
  post: ScheduledPost
  onClick: () => void
}) {
  const intlLocale = useIntlLocale()
  const scheduledDate = post.scheduled_at ? new Date(post.scheduled_at) : null
  const dateLabel = scheduledDate
    ? scheduledDate.toLocaleDateString(intlLocale, { day: "numeric", month: "short" })
    : ""
  const timeLabel = scheduledDate
    ? scheduledDate.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })
    : ""
  const primaryPlatform = post.platforms[0]
  const config = primaryPlatform ? PLATFORM_CONFIG[primaryPlatform] : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-60 p-3 rounded-2xl",
        "bg-white/60 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.08]",
        "flex items-center gap-3 text-left transition-all",
        "hover:border-primary/30 hover:shadow-sm"
      )}
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted dark:bg-slate-800">
        {post.media_urls[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.media_urls[0]} alt="" className="size-full rounded-lg object-cover" />
        ) : (
          <CalendarDays className="size-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1.5">
          {config && (
            <span
              className="inline-block size-3 rounded-full shrink-0"
              style={{ backgroundColor: config.color }}
            />
          )}
          <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
            {config?.label ?? "Multi"}
          </span>
        </div>
        <p className="truncate text-xs font-semibold text-foreground">
          {post.title ?? post.content.slice(0, 40)}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {dateLabel}, {timeLabel}
        </p>
      </div>
    </button>
  )
}

// ── Day Sidebar Card ─────────────────────────────────────────────────────────

import { STATUS_LABELS, STATUS_STYLES } from "@/lib/scheduler/types"

function DaySidebarCard({
  post,
  onClick,
}: {
  post: ScheduledPost
  onClick: () => void
}) {
  const intlLocale = useIntlLocale()
  const primaryPlatform = post.platforms[0]
  const config = primaryPlatform ? PLATFORM_CONFIG[primaryPlatform] : null
  const scheduledTime = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl text-left space-y-3",
        "bg-white/60 dark:bg-white/[0.04] border border-gray-200/60 dark:border-white/[0.08]",
        "transition-all hover:border-primary/30"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 items-center justify-center rounded-lg"
            style={{ backgroundColor: config?.color ?? "#6366f1" }}
          >
            <PlatformDot platform={primaryPlatform ?? "twitter"} className="!size-4 !bg-white/80" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground dark:text-slate-300">
              {post.title ?? post.content.slice(0, 25)}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {config?.label ?? "Multi"} {scheduledTime ? `\u2022 ${scheduledTime}` : ""}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wide",
            STATUS_STYLES[post.status]
          )}
        >
          {STATUS_LABELS[post.status]}
        </span>
      </div>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {post.content.slice(0, 120)}
      </p>
    </button>
  )
}
