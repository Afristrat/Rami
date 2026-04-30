"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface CalendarEvent {
  label: string
  time?: string
  colorClass: string
  borderClass: string
}

interface CalendarStripDay {
  labelKey: string
  dayNum: number
  isToday: boolean
  events: CalendarEvent[]
}

const DAY_KEYS = ["dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat", "daySun"] as const

const MONTH_KEYS = [
  "monthJanuary", "monthFebruary", "monthMarch", "monthApril", "monthMay", "monthJune",
  "monthJuly", "monthAugust", "monthSeptember", "monthOctober", "monthNovember", "monthDecember",
] as const

function getWeekDays(baseDate: Date): CalendarStripDay[] {
  const startOfWeek = new Date(baseDate)
  const dayOfWeek = startOfWeek.getDay()
  // Monday = 0
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  startOfWeek.setDate(startOfWeek.getDate() + mondayOffset)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return DAY_KEYS.map((key, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    d.setHours(0, 0, 0, 0)
    return {
      labelKey: key,
      dayNum: d.getDate(),
      isToday: d.getTime() === today.getTime(),
      events: [],
    }
  })
}

const MOCK_EVENTS: Record<number, CalendarEvent[]> = {
  0: [{ label: "Reel IG #1", colorClass: "bg-violet-500/10 dark:bg-violet-500/10", borderClass: "border-violet-500" }],
  1: [
    { label: "Article Blog", colorClass: "bg-blue-500/10 dark:bg-blue-600/10", borderClass: "border-blue-600" },
    { label: "Email Blast", colorClass: "bg-emerald-500/10", borderClass: "border-emerald-500" },
  ],
  2: [{ label: "Webinar Live", time: "16:00", colorClass: "bg-violet-500/20 dark:bg-violet-500/20", borderClass: "border-violet-500" }],
  4: [{ label: "IG Story X3", colorClass: "bg-pink-500/10", borderClass: "border-pink-500" }],
}

export function CalendarStrip() {
  const t = useTranslations("dashboard")
  const [weekOffset, setWeekOffset] = useState(0)

  const baseDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const days = useMemo(() => {
    const week = getWeekDays(baseDate)
    // Inject mock events for the current week (offset 0 only)
    if (weekOffset === 0) {
      for (const [idx, evts] of Object.entries(MOCK_EVENTS)) {
        const dayIndex = Number(idx)
        if (week[dayIndex]) {
          week[dayIndex].events = evts
        }
      }
    }
    return week
  }, [baseDate, weekOffset])

  const firstDay = new Date(baseDate)
  const dayOfWeek = firstDay.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  firstDay.setDate(firstDay.getDate() + mondayOffset)

  const monthKey = MONTH_KEYS[firstDay.getMonth()]
  const monthName = t(monthKey)
  const weekLabel = t("weekOf", { date: `${firstDay.getDate()} ${monthName}` })

  return (
    <div className="glass-card overflow-hidden rounded-2xl">
      <div className="flex items-center justify-between border-b border-border p-6">
        <h3 className="font-bold text-foreground">{t("calendarPreview")}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((p) => p - 1)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted dark:hover:bg-white/5"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-medium text-foreground">{weekLabel}</span>
          <button
            onClick={() => setWeekOffset((p) => p + 1)}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted dark:hover:bg-white/5"
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
              {day.events.length > 0 ? (
                day.events.map((evt) => (
                  <div
                    key={evt.label}
                    className={cn(
                      "rounded-lg border-l-2 p-2",
                      evt.colorClass,
                      evt.borderClass,
                      day.isToday && "shadow-lg shadow-violet-500/10"
                    )}
                  >
                    <p className={cn("truncate text-[10px] font-medium text-foreground", day.isToday && "font-bold")}>
                      {evt.label}
                    </p>
                    {evt.time && (
                      <p className="mt-1 text-[9px] text-violet-500">{evt.time}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="flex h-12 items-center justify-center rounded-lg border border-dashed border-border">
                  <Plus className="size-3.5 text-muted-foreground/40" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
