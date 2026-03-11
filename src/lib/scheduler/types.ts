import type { Platform } from "./platform-config"

export type PostStatus = "draft" | "review" | "approved" | "scheduled" | "publishing" | "published" | "failed"

export interface ScheduledPost {
  id: string
  title: string | null
  content: string
  platforms: Platform[]
  status: PostStatus
  scheduled_at: string | null  // ISO 8601
  published_at: string | null
  media_urls: string[]
  created_at: string
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  posts: ScheduledPost[]
}

export const STATUS_LABELS: Record<PostStatus, string> = {
  draft: "Brouillon",
  review: "En révision",
  approved: "Approuvé",
  scheduled: "Planifié",
  publishing: "Publication…",
  published: "Publié",
  failed: "Échec",
}

export const STATUS_STYLES: Record<PostStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  review: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  scheduled: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  publishing: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  published: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  failed: "bg-destructive/10 text-destructive",
}
