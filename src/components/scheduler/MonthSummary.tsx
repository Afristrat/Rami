import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import type { ScheduledPost } from "@/lib/scheduler/types"

interface MonthSummaryProps {
  posts: ScheduledPost[]
  className?: string
}

export function MonthSummary({ posts, className }: MonthSummaryProps) {
  const t = useTranslations("calendar")
  if (posts.length === 0) return null

  const published = posts.filter((p) => p.status === "published").length
  const scheduled = posts.filter((p) => p.status === "scheduled").length
  const drafts = posts.filter((p) => ["draft", "review", "approved"].includes(p.status)).length
  const failed = posts.filter((p) => p.status === "failed").length

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-6 text-sm font-medium px-1",
        className
      )}
    >
      {published > 0 && (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500" />
          <span className="text-foreground dark:text-slate-400 tabular-nums">{published}</span>
          <span className="text-muted-foreground dark:text-slate-500 font-normal">
            {t("statusPublished")}
          </span>
        </div>
      )}
      {scheduled > 0 && (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-blue-500" />
          <span className="text-foreground dark:text-slate-400 tabular-nums">{scheduled}</span>
          <span className="text-muted-foreground dark:text-slate-500 font-normal">
            {t("statusScheduled")}
          </span>
        </div>
      )}
      {drafts > 0 && (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-slate-400 dark:bg-slate-500" />
          <span className="text-foreground dark:text-slate-400 tabular-nums">{drafts}</span>
          <span className="text-muted-foreground dark:text-slate-500 font-normal">
            {t("statusDraft")}
          </span>
        </div>
      )}
      {failed > 0 && (
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-red-500" />
          <span className="text-foreground dark:text-slate-400 tabular-nums">{failed}</span>
          <span className="text-muted-foreground dark:text-slate-500 font-normal">
            {t("statusFailed")}
          </span>
        </div>
      )}
    </div>
  )
}
