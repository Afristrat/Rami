"use client"

import { useTranslations } from "next-intl"

import { useMemo, useState, useCallback } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { PostChip } from "./PostChip"
import type { ScheduledPost } from "@/lib/scheduler/types"
import type { CalendarDay } from "@/lib/scheduler/types"

const DAY_KEYS = ["dayMon", "dayTue", "dayWed", "dayThu", "dayFri", "daySat", "daySun"] as const

interface CalendarGridProps {
  year: number
  month: number // 0-indexed
  posts: ScheduledPost[]
  selectedDate?: Date | null
  onPostClick?: (post: ScheduledPost) => void
  onDayClick?: (date: Date) => void
  onPostDrop?: (postId: string, newDate: Date) => void
}

export function CalendarGrid({
  year,
  month,
  posts,
  selectedDate,
  onPostClick,
  onDayClick,
  onPostDrop,
}: CalendarGridProps) {
  const t = useTranslations("calendar")
  const days = useMemo(() => buildCalendarDays(year, month, posts), [year, month, posts])
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverDate(date.toDateString())
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, date: Date) => {
    e.preventDefault()
    setDragOverDate(null)
    const postId = e.dataTransfer.getData("text/post-id")
    if (postId && onPostDrop) {
      onPostDrop(postId, date)
    }
  }, [onPostDrop])

  return (
    <div
      className="overflow-hidden rounded-xl border border-gray-200/60 dark:border-white/5 bg-white/60 dark:bg-transparent"
      role="grid"
      aria-label={t("calendarLabel")}
    >
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200/60 dark:border-white/5">
        {DAY_KEYS.map((dayKey) => (
          <div
            key={dayKey}
            className="h-10 flex items-center justify-center text-[11px] font-bold uppercase tracking-widest text-muted-foreground dark:text-slate-500 border-r border-gray-200/60 dark:border-white/5 last:border-r-0"
          >
            {t(dayKey)}
          </div>
        ))}
      </div>

      {/* Day cells grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const isSelected = selectedDate
            ? day.date.toDateString() === selectedDate.toDateString()
            : false
          const isDragOver = dragOverDate === day.date.toDateString()
          return (
            <CalendarCell
              key={idx}
              day={day}
              isLast={idx >= days.length - 7}
              isSelected={isSelected}
              isDragOver={isDragOver}
              onPostClick={onPostClick}
              onDayClick={onDayClick}
              onDragOver={(e) => handleDragOver(e, day.date)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day.date)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Cell ────────────────────────────────────────────────────────

interface CalendarCellProps {
  day: CalendarDay
  isLast: boolean
  isSelected?: boolean
  isDragOver?: boolean
  onPostClick?: (post: ScheduledPost) => void
  onDayClick?: (date: Date) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
}

function CalendarCell({ day, isLast, isSelected, isDragOver, onPostClick, onDayClick, onDragOver, onDragLeave, onDrop }: CalendarCellProps) {
  const isFuture = day.date >= new Date(new Date().setHours(0, 0, 0, 0))
  const MAX_VISIBLE = 3
  const overflow = day.posts.length - MAX_VISIBLE

  return (
    <div
      className={cn(
        "group relative min-h-[120px] lg:min-h-[140px] border-b border-r border-gray-200/60 dark:border-white/5 p-2 transition-colors",
        isLast && "border-b-0",
        "last:border-r-0 [&:nth-child(7n)]:border-r-0",
        // Non-current month
        !day.isCurrentMonth && "bg-gray-50/50 dark:bg-white/[0.01]",
        // Selected day
        isSelected && "bg-primary/5 dark:bg-primary/5",
        // Drag over feedback
        isDragOver && "bg-primary/10 dark:bg-primary/10 ring-2 ring-primary/40 ring-inset",
        // Hover
        "hover:bg-gray-50 dark:hover:bg-white/[0.02] cursor-pointer"
      )}
      onClick={() => onDayClick?.(day.date)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Day number */}
      <div className="mb-1.5 flex items-center justify-center">
        {day.isToday ? (
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {day.date.getDate()}
          </span>
        ) : (
          <span
            className={cn(
              "text-xs font-medium",
              day.isCurrentMonth
                ? "text-foreground dark:text-slate-400"
                : "text-muted-foreground/40 dark:text-slate-600"
            )}
          >
            {day.date.getDate()}
          </span>
        )}
      </div>

      {/* Post chips */}
      <div className="space-y-1">
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
          <p className="text-center text-[9px] font-bold text-primary">
            +{overflow} autre{overflow > 1 ? "s" : ""}
          </p>
        )}
        {/* Hover hint on empty future days */}
        {day.posts.length === 0 && day.isCurrentMonth && isFuture && (
          <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity mt-3">
            <Plus className="size-3.5 text-muted-foreground/40" />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Build calendar days ────────────────────────────────────────

function buildCalendarDays(
  year: number,
  month: number,
  posts: ScheduledPost[]
): CalendarDay[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const lastDay = new Date(year, month + 1, 0)
  const totalCells = Math.ceil((startDow + lastDay.getDate()) / 7) * 7

  const days: CalendarDay[] = []

  for (let i = 0; i < totalCells; i++) {
    const date = new Date(year, month, 1 - startDow + i)
    date.setHours(0, 0, 0, 0)
    const isCurrentMonth = date.getMonth() === month && date.getFullYear() === year
    const isToday = date.getTime() === today.getTime()

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
