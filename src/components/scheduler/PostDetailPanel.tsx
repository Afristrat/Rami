"use client"

import { X, Trash2, CalendarClock } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PlatformBadge } from "./PlatformBadge"
import { deletePost } from "@/app/actions/scheduler"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/scheduler/types"
import type { ScheduledPost } from "@/lib/scheduler/types"
import { Button } from "@/components/ui/button"

interface PostDetailPanelProps {
  post: ScheduledPost
  onClose: () => void
  onDeleted?: (postId: string) => void
}

export function PostDetailPanel({ post, onClose, onDeleted }: PostDetailPanelProps) {
  const [isPending, startTransition] = useTransition()

  const scheduledDate = post.scheduled_at ? new Date(post.scheduled_at) : null
  const formattedDateTime = scheduledDate
    ? scheduledDate.toLocaleString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  function handleDelete() {
    startTransition(async () => {
      const result = await deletePost(post.id)
      if (result.success) {
        toast.success("Post supprimé")
        onDeleted?.(post.id)
        onClose()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border p-4">
        <div className="min-w-0 flex-1">
          {post.title && (
            <p className="truncate text-sm font-semibold text-foreground">
              {post.title}
            </p>
          )}
          <span
            className={cn(
              "mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
              STATUS_STYLES[post.status]
            )}
          >
            {STATUS_LABELS[post.status]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Date planifiée */}
        {formattedDateTime && (
          <div className="flex items-start gap-2 text-sm">
            <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <span className="text-foreground capitalize">{formattedDateTime}</span>
          </div>
        )}

        {/* Plateformes */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Plateformes
          </p>
          <div className="flex flex-wrap gap-1.5">
            {post.platforms.map((p) => (
              <PlatformBadge key={p} platform={p} size="sm" />
            ))}
          </div>
        </div>

        {/* Contenu du post */}
        <div>
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Contenu
          </p>
          <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground whitespace-pre-wrap">
            {post.content}
          </div>
        </div>

        {/* Médias */}
        {post.media_urls.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Médias ({post.media_urls.length})
            </p>
            <div className="grid grid-cols-2 gap-2">
              {post.media_urls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`Média ${i + 1}`}
                  className="aspect-square w-full rounded-lg object-cover"
                />
              ))}
            </div>
          </div>
        )}

        {/* Métadonnées */}
        <div className="text-xs text-muted-foreground">
          Créé le{" "}
          {new Date(post.created_at).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border p-4">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={handleDelete}
          disabled={isPending}
        >
          <Trash2 className="size-4" />
          {isPending ? "Suppression…" : "Supprimer le post"}
        </Button>
      </div>
    </div>
  )
}
