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
        className
      )}
      style={{ backgroundColor: color }}
      title={post.title ?? post.content.slice(0, 80)}
    >
      <span className="flex items-center gap-1 truncate">
        {time && (
          <span className="shrink-0 opacity-80">{time}</span>
        )}
        <span className="truncate">
          {post.title ?? post.content.slice(0, 40)}
        </span>
      </span>
    </button>
  )
}
