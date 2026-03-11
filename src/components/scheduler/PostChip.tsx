import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import type { ScheduledPost } from "@/lib/scheduler/types"

interface PostChipProps {
  post: ScheduledPost
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
}

export function PostChip({ post, onClick, className }: PostChipProps) {
  // Couleur dominante = première plateforme
  const primaryPlatform = post.platforms[0]
  const config = primaryPlatform ? PLATFORM_CONFIG[primaryPlatform] : null
  const color = config?.color ?? "#6366f1"

  const isFailed = post.status === "failed"
  const isPublished = post.status === "published"

  const time = post.scheduled_at
    ? new Date(post.scheduled_at).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <button
      type="button"
      onClick={(e) => onClick?.(e)}
      className={cn(
        "group w-full text-left rounded px-1.5 py-0.5 text-[11px] leading-tight",
        "transition-opacity hover:opacity-80 active:opacity-60",
        "truncate font-medium text-white",
        isFailed && "opacity-70 ring-1 ring-destructive/60",
        isPublished && "opacity-60",
        className
      )}
      style={{ backgroundColor: isFailed ? "#6b7280" : color }}
      title={`${post.title ?? post.content.slice(0, 60)}${isFailed ? " — Échec de publication" : ""}`}
    >
      <span className="flex items-center gap-1 truncate">
        {isFailed && (
          <AlertCircle className="size-2.5 shrink-0 text-red-300" />
        )}
        {time && !isFailed && (
          <span className="shrink-0 opacity-80">{time}</span>
        )}
        <span className={cn("truncate", isFailed && "line-through opacity-80")}>
          {post.title ?? post.content.slice(0, 40)}
        </span>
      </span>
    </button>
  )
}
