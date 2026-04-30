"use client"

import { useTranslations } from "next-intl"

import { FileEdit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useTransition } from "react"
import { cn } from "@/lib/utils"
import { PlatformDot } from "./PlatformBadge"
import { deletePost } from "@/app/actions/scheduler"
import type { ScheduledPost } from "@/lib/scheduler/types"
import { STATUS_LABELS, STATUS_STYLES } from "@/lib/scheduler/types"

interface DraftPostsListProps {
  posts: ScheduledPost[]
  onDeleted?: (postId: string) => void
  onSelect?: (post: ScheduledPost) => void
}

export function DraftPostsList({ posts, onDeleted, onSelect }: DraftPostsListProps) {
  const t = useTranslations("calendar")
  if (posts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center">
        <FileEdit className="mx-auto mb-2 size-6 text-muted-foreground/40" />
        <p className="text-xs text-muted-foreground">
          Aucun brouillon en attente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <DraftPostItem
          key={post.id}
          post={post}
          onDeleted={onDeleted}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function DraftPostItem({
  post,
  onDeleted,
  onSelect,
}: {
  post: ScheduledPost
  onDeleted?: (postId: string) => void
  onSelect?: (post: ScheduledPost) => void
}) {
  const t = useTranslations("calendar")
  const [isPending, startTransition] = useTransition()

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      const result = await deletePost(post.id)
      if (result.success) {
        toast.success(t("draftDeleted"))
        onDeleted?.(post.id)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(post)}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(post)}
      className={cn(
        "group flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-card p-3",
        "transition-all hover:border-primary/30 hover:bg-primary/5",
        isPending && "pointer-events-none opacity-50"
      )}
    >
      {/* Indicateur plateforme(s) */}
      <div className="mt-0.5 flex flex-col gap-1">
        {post.platforms.slice(0, 3).map((p) => (
          <PlatformDot key={p} platform={p} />
        ))}
        {post.platforms.length > 3 && (
          <span className="text-[9px] font-medium leading-none text-muted-foreground">
            +{post.platforms.length - 3}
          </span>
        )}
      </div>

      {/* Contenu */}
      <div className="min-w-0 flex-1">
        {post.title && (
          <p className="truncate text-xs font-medium text-foreground">
            {post.title}
          </p>
        )}
        <p className={cn(
          "text-muted-foreground line-clamp-2",
          post.title ? "text-[11px]" : "text-xs"
        )}>
          {post.content}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
              STATUS_STYLES[post.status]
            )}
          >
            {STATUS_LABELS[post.status]}
          </span>
        </div>
      </div>

      {/* Supprimer */}
      <button
        type="button"
        onClick={handleDelete}
        className={cn(
          "shrink-0 rounded p-1 text-muted-foreground/50 transition-colors",
          "opacity-0 group-hover:opacity-100",
          "hover:bg-destructive/10 hover:text-destructive"
        )}
        title={t("draftDeleted")}
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  )
}
