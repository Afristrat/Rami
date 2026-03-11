"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { PostChip } from "./PostChip"
import type { ScheduledPost } from "@/lib/scheduler/types"
import type { CalendarDay } from "@/lib/scheduler/types"

const DAYS_OF_WEEK = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

interface CalendarGridProps {
  year: number
  month: number // 0-indexed
  posts: ScheduledPost[]
  onPostClick?: (post: ScheduledPost) => void
  onDayClick?: (date: Date) => void
}

export function CalendarGrid({
  year,
  month,
  posts,
  onPostClick,
  onDayClick,
}: CalendarGridProps) {
  const days = useMemo(() => buildCalendarDays(year, month, posts), [year, month, posts])

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card"
      role="grid"
      aria-label="Calendrier de publication"
    >
      {/* En-tête jours de la semaine */}
      <div className="grid grid-cols-7 border-b border-border">
        {DAYS_OF_WEEK.map((day) => (
          <div
            key={day}
            className="px-2 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grille des jours */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => (
          <CalendarCell
            key={idx}
            day={day}
            isLast={idx >= days.length - 7}
            onPostClick={onPostClick}
            onDayClick={onDayClick}
          />
        ))}
      </div>
    </div>
  )
}

// ── Cellule d'un jour ────────────────────────────────────────────────────────

interface CalendarCellProps {
  day: CalendarDay
  isLast: boolean
  onPostClick?: (post: ScheduledPost) => void
  onDayClick?: (date: Date) => void
}

function CalendarCell({ day, isLast, onPostClick, onDayClick }: CalendarCellProps) {
  const MAX_VISIBLE = 3
  const overflow = day.posts.length - MAX_VISIBLE

  return (
    <div
      className={cn(
        "group relative min-h-[100px] border-b border-r border-border p-1.5 transition-colors",
        // Dernière ligne : pas de border-b
        isLast && "border-b-0",
        // Pas de border-r sur la dernière colonne de chaque ligne (7e)
        "last:border-r-0 [&:nth-child(7n)]:border-r-0",
        // Mois non courant : fond atténué
        !day.isCurrentMonth && "bg-muted/30",
        // Hover
        "hover:bg-accent/30 cursor-pointer"
      )}
      onClick={() => onDayClick?.(day.date)}
    >
      {/* Numéro du jour */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-xs font-medium",
            day.isToday
              ? "bg-primary text-primary-foreground"
              : day.isCurrentMonth
              ? "text-foreground"
              : "text-muted-foreground/50"
          )}
        >
          {day.date.getDate()}
        </span>
        {day.posts.length > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground">
            {day.posts.length}
          </span>
        )}
      </div>

      {/* Posts (max MAX_VISIBLE chips) */}
      <div className="space-y-0.5">
        {day.posts.slice(0, MAX_VISIBLE).map((post) => (
          <PostChip
            key={post.id}
            post={post}
            onClick={(e) => {
              e.stopPropagation()
              onPostClick?.(post)
            }}
          />
        ))}
        {overflow > 0 && (
          <p className="pl-1 text-[10px] text-muted-foreground">
            +{overflow} de plus
          </p>
        )}
      </div>
    </div>
  )
}

// ── Utilitaire : construction des jours du calendrier ───────────────────────

function buildCalendarDays(
  year: number,
  month: number,
  posts: ScheduledPost[]
): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(year, month, 1)
  // getDay() : 0=dimanche, 1=lundi… On veut lundi=0
  const startDow = (firstDay.getDay() + 6) % 7
  const lastDay = new Date(year, month + 1, 0)
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7

  const days: CalendarDay[] = []

  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month, 1 - startDow + i)
    date.setHours(0, 0, 0, 0)
    const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year
    const isToday = date.getTime() === today.getTime()

    // Posts de ce jour
    const dayPosts = posts.filter((p) => {
      if (!p.scheduled_at) return false
      const pd = new Date(p.scheduled_at)
      pd.setHours(0, 0, 0, 0)
      return pd.getTime() === date.getTime()
    })

    days.push({ date, isCurrentMonth, isToday, posts: dayPosts })
  }

  return days
}
