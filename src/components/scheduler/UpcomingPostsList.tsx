"use client"

import { useTranslations } from "next-intl"

import { Clock, Trash2, CalendarPlus } from "lucide-react"
import { toast } from "sonner"
import { useTransition } from "react"
import { cn } from "@/lib/utils"
import { useIntlLocale } from "@/lib/utils/format-locale"
import { PlatformBadge, PlatformDot } from "./PlatformBadge"
import { deletePost } from "@/app/actions/scheduler"
import type { ScheduledPost } from "@/lib/scheduler/types"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/scheduler/types"

interface UpcomingPostsListProps {
  posts: ScheduledPost[]
  onDeleted?: (postId: string) => void
}

export function UpcomingPostsList({ posts, onDeleted }: UpcomingPostsListProps) {
  const _t = useTranslations("calendar")
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary/10">
          <Clock className="size-6 text-primary/60" />
        </div>
        <p className="text-sm font-semibold text-foreground">
          Aucun post planifié
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Aucune publication prévue dans les 30 prochains jours.
        </p>
        <a
          href="/dashboard/create"
          className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <CalendarPlus className="size-3.5" />
          Créer un post
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <UpcomingPostItem key={post.id} post={post} onDeleted={onDeleted} />
      ))}
    </div>
  )
}

function UpcomingPostItem({
  post,
  onDeleted,
}: {
  post: ScheduledPost
  onDeleted?: (postId: string) => void
}) {
  const t = useTranslations("calendar")
  const intlLocale = useIntlLocale()
  const [isPending, startTransition] = useTransition()

  const scheduledDate = post.scheduled_at ? new Date(post.scheduled_at) : null
  const formattedDate = scheduledDate
    ? scheduledDate.toLocaleDateString(intlLocale, {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : null
  const formattedTime = scheduledDate
    ? scheduledDate.toLocaleTimeString(intlLocale, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePost(post.id)
      if (result.success) {
        toast.success(t("postDeleted"))
        onDeleted?.(post.id)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-xl border border-border bg-card p-3.5",
        "transition-all hover:border-border/80 hover:shadow-sm",
        isPending && "opacity-50 pointer-events-none"
      )}
    >
      {/* Indicateur plateforme(s) */}
      <div className="mt-0.5 flex flex-col gap-1">
        {post.platforms.slice(0, 3).map((p) => (
          <PlatformDot key={p} platform={p} />
        ))}
        {post.platforms.length > 3 && (
          <span className="text-[9px] font-medium text-muted-foreground leading-none">
            +{post.platforms.length - 3}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        {post.title && (
          <p className="truncate text-sm font-medium text-foreground">
            {post.title}
          </p>
        )}
        <p className={cn(
          "text-sm text-muted-foreground line-clamp-2",
          post.title && "text-xs"
        )}>
          {post.content}
        </p>

        {/* Métadonnées */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Statut */}
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              STATUS_STYLES[post.status]
            )}
          >
            {STATUS_LABELS[post.status]}
          </span>

          {/* Plateformes */}
          {post.platforms.slice(0, 3).map((p) => (
            <PlatformBadge key={p} platform={p} size="xs" />
          ))}
          {post.platforms.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{post.platforms.length - 3} autres
            </span>
          )}
        </div>
      </div>

      {/* Date + actions */}
      <div className="flex shrink-0 flex-col items-end gap-2">
        {scheduledDate && (
          <div className="text-right">
            <p className="text-xs font-medium text-foreground">{formattedDate}</p>
            <p className="text-[11px] text-muted-foreground">{formattedTime}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleDelete}
          className={cn(
            "rounded p-1 text-muted-foreground/50 transition-colors",
            "opacity-0 group-hover:opacity-100",
            "hover:bg-destructive/10 hover:text-destructive"
          )}
          title={t("postDeleted")}
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  )
}
