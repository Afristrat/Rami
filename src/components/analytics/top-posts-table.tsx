"use client"

import { Trophy, ExternalLink } from "lucide-react"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import type { TopPost } from "@/app/actions/analytics"

interface TopPostsTableProps {
  posts: TopPost[]
}

function PlatformBadge({ platform }: { platform: string }) {
  const config = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
  if (!config) return null
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${config.bgClass} ${config.textClass}`}>
      {config.label}
    </span>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  })
}

const RANK_COLORS = [
  "text-yellow-400",  // 🥇
  "text-zinc-300",    // 🥈
  "text-amber-600",   // 🥉
  "text-zinc-500",
  "text-zinc-500",
]

export function TopPostsTable({ posts }: TopPostsTableProps) {
  if (!posts.length) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Aucun post publié sur cette période
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map((post, index) => {
        const platformResultUrl = post.platformResults
          ? Object.values(post.platformResults).find(r => r?.url)?.url
          : null

        return (
          <div
            key={post.id}
            className="group flex items-start gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05]"
          >
            {/* Rang */}
            <div className={`flex size-6 shrink-0 items-center justify-center text-xs font-bold ${RANK_COLORS[index] ?? "text-zinc-500"}`}>
              #{index + 1}
            </div>

            {/* Contenu */}
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm text-foreground/90">
                {post.title ?? post.content.slice(0, 120)}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {post.platforms.map(p => (
                  <PlatformBadge key={p} platform={p} />
                ))}
                <span className="text-[10px] text-muted-foreground/60">
                  · {formatDate(post.publishedAt)}
                </span>
              </div>
            </div>

            {/* Score engagement */}
            <div className="flex shrink-0 flex-col items-end gap-1">
              <div className="flex items-center gap-1">
                <Trophy className="size-3 text-violet-400" />
                <span className="text-sm font-bold text-violet-400">
                  {post.engagementScore.toLocaleString("fr-FR")}
                </span>
              </div>
              {platformResultUrl && (
                <a
                  href={platformResultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={e => e.stopPropagation()}
                >
                  Voir <ExternalLink className="size-2.5" />
                </a>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
