"use client"

import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import type { ScheduledPost } from "@/lib/scheduler/types"

interface PostChipProps {
  post: ScheduledPost
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  draggable?: boolean
}

const STATUS_BORDER_COLORS: Record<string, string> = {
  published: "border-l-emerald-500",
  scheduled: "border-l-blue-500",
  draft: "border-l-slate-400 dark:border-l-white/20",
  review: "border-l-amber-500",
  approved: "border-l-violet-500",
  failed: "border-l-red-500",
  publishing: "border-l-blue-400",
}

export function PostChip({ post, onClick, className, draggable = true }: PostChipProps) {
  const primaryPlatform = post.platforms[0]
  const config = primaryPlatform ? PLATFORM_CONFIG[primaryPlatform] : null
  const isFailed = post.status === "failed"

  function handleDragStart(e: React.DragEvent<HTMLButtonElement>) {
    e.dataTransfer.setData("text/post-id", post.id)
    e.dataTransfer.effectAllowed = "move"
    // Légère transparence pour indiquer le déplacement
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "0.5"
    }
  }

  function handleDragEnd(e: React.DragEvent<HTMLButtonElement>) {
    if (e.currentTarget) {
      e.currentTarget.style.opacity = "1"
    }
  }

  return (
    <button
      type="button"
      draggable={draggable && !isFailed}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={(e) => onClick?.(e)}
      className={cn(
        "group w-full text-left rounded px-2 py-1",
        "bg-gray-100/80 dark:bg-white/5 border-l-2",
        STATUS_BORDER_COLORS[post.status] ?? "border-l-white/20",
        "flex items-center gap-1.5 cursor-pointer",
        "transition-colors hover:bg-gray-200/80 dark:hover:bg-white/10",
        isFailed && "opacity-70",
        className
      )}
      title={`${post.title ?? post.content.slice(0, 60)}${isFailed ? " — Échec" : ""}`}
    >
      {/* Platform dot */}
      <span
        className="inline-block size-3 shrink-0 rounded-full"
        style={{ backgroundColor: config?.color ?? "#6366f1" }}
      />
      {/* Title */}
      <span className={cn(
        "truncate text-[10px] font-medium text-foreground dark:text-slate-300",
        isFailed && "line-through opacity-80"
      )}>
        {isFailed && <AlertCircle className="inline size-2.5 mr-0.5 text-red-400" />}
        {post.title ?? post.content.slice(0, 30)}
      </span>
    </button>
  )
}
