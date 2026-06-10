"use client"

import { useState, useMemo, useEffect, useTransition } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { getWeekPostsAction, type CalendarPost } from "@/lib/actions/calendar.actions"

// ── Couleurs par plateforme ────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, { colorClass: string; borderClass: string }> = {
  linkedin:  { colorClass: "bg-blue-500/10 dark:bg-blue-600/10",     borderClass: "border-blue-600" },
  instagram: { colorClass: "bg-pink-500/10",                          borderClass: "border-pink-500" },
  facebook:  { colorClass: "bg-blue-500/10",                          borderClass: "border-blue-500" },
  twitter:   { colorClass: "bg-sky-500/10",                           borderClass: "border-sky-500" },
  youtube:   { colorClass: "bg-red-500/10",                           borderClass: "border-red-500" },
  tiktok:    { colorClass: "bg-zinc-500/10 dark:bg-zinc-500/10",      borderClass: "border-zinc-400" },
  pinterest: { colorClass: "bg-rose-500/10",                          borderClass: "border-rose-500" },
  mastodon:  { colorClass: "bg-violet-500/10 dark:bg-violet-500/10",  borderClass: "border-violet-500" },
  default:   { colorClass: "bg-emerald-500/10",                       borderClass: "border-emerald-500" },
}

function platformColors(platform: string) {
  return PLATFORM_COLORS[platform] ?? PLATFORM_COLORS.default
}

// ── Helpers calendrier ────────────────────────────────────────────────────────

const DAY_KEYS = ["dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat", "daySun"] as const

const MONTH_KEYS = [
  "monthJanuary", "monthFebruary", "monthMarch", "monthApril", "monthMay", "monthJune",
  "monthJuly", "monthAugust", "monthSeptember", "monthOctober", "monthNovember", "monthDecember",
] as const

interface WeekBounds {
  monday: Date
  sunday: Date
}

function getWeekBounds(baseDate: Date, weekOffset: number): WeekBounds {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + weekOffset * 7)
  const dayOfWeek = d.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setDate(d.getDate() + mondayOffset)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { monday, sunday }
}

// ── Composant ─────────────────────────────────────────────────────────────────

export function CalendarStrip() {
  const t = useTranslations("dashboard")

  const [weekOffset, setWeekOffset] = useState(0)
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [isPending, startTransition] = useTransition()

  const { monday, sunday } = useMemo(
    () => getWeekBounds(new Date(), weekOffset),
    [weekOffset]
  )

  // Charger les posts à chaque changement de semaine
  useEffect(() => {
    startTransition(async () => {
      const result = await getWeekPostsAction(
        monday.toISOString(),
        sunday.toISOString()
      )
      if ("data" in result) {
        setPosts(result.data)
      } else {
        setPosts([])
      }
    })
  }, [monday, sunday])

  // todayMs est stable pour la journée (ne change pas dans la session)
  const todayMs = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }, [])

  const days = useMemo(() => {
    return DAY_KEYS.map((key, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      d.setHours(0, 0, 0, 0)
      const dayPosts = posts.filter((p) => p.weekDayIndex === i)
      return {
        labelKey: key,
        dayNum: d.getDate(),
        isToday: d.getTime() === todayMs,
        posts: dayPosts,
      }
    })
  }, [monday, posts, todayMs])

  const monthKey = MONTH_KEYS[monday.getMonth()]
  const monthName = t(monthKey)
  const weekLabel = t("weekOf", { date: `${monday.getDate()} ${monthName}` })

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border p-6">
        <h3 className="font-bold text-foreground">{t("calendarPreview")}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted dark:hover:bg-white/5"
            aria-label={t("dayMon")}
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {isPending ? "…" : weekLabel}
          </span>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted dark:hover:bg-white/5"
            aria-label={t("dayTue")}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, i) => (
          <div
            key={`${day.labelKey}-${day.dayNum}`}
            className={cn(
              "min-h-[100px] p-4",
              i < 6 && "border-r border-border",
              i % 2 === 0 && "bg-muted/20 dark:bg-white/[0.01]"
            )}
          >
            <p
              className={cn(
                "mb-3 text-[10px] font-bold uppercase",
                day.isToday
                  ? "font-black text-violet-500"
                  : "text-muted-foreground"
              )}
            >
              {t(day.labelKey as Parameters<typeof t>[0])} {day.dayNum}
              {day.isToday && ` (${t("todayShort")})`}
            </p>

            <div className="space-y-2">
              {day.posts.length > 0 ? (
                day.posts.map((post) => {
                  const platform = post.platforms[0] ?? "default"
                  const { colorClass, borderClass } = platformColors(platform)
                  const label = post.title ?? post.content.slice(0, 30)
                  return (
                    <div
                      key={post.id}
                      className={cn(
                        "rounded-lg border-l-2 p-2",
                        colorClass,
                        borderClass,
                        day.isToday && "shadow-lg shadow-violet-500/10"
                      )}
                    >
                      <p className={cn(
                        "truncate text-[10px] font-medium text-foreground",
                        day.isToday && "font-bold"
                      )}>
                        {label}
                      </p>
                      <p className="mt-1 text-[9px] text-muted-foreground">
                        {post.timeLabel}
                      </p>
                    </div>
                  )
                })
              ) : (
                <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-border">
                  {isPending ? (
                    <span className="text-[9px] text-muted-foreground/40">…</span>
                  ) : (
                    <span className="text-[9px] text-muted-foreground/30 text-center px-1">
                      {t("noScheduledPosts")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
