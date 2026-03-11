import { cn } from "@/lib/utils"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import type { ScheduledPost } from "@/lib/scheduler/types"

interface MonthSummaryProps {
  posts: ScheduledPost[]
  className?: string
}

export function MonthSummary({ posts, className }: MonthSummaryProps) {
  if (posts.length === 0) return null

  // Comptage par statut
  const published = posts.filter((p) => p.status === "published").length
  const scheduled = posts.filter((p) => p.status === "scheduled").length
  const drafts = posts.filter((p) => ["draft", "review", "approved"].includes(p.status)).length
  const failed = posts.filter((p) => p.status === "failed").length

  // Comptage par plateforme (dédupliqué)
  const platformCounts: Record<string, number> = {}
  for (const post of posts) {
    for (const p of post.platforms) {
      platformCounts[p] = (platformCounts[p] ?? 0) + 1
    }
  }

  const topPlatforms = Object.entries(platformCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border bg-card px-4 py-3",
        className
      )}
    >
      {/* Total */}
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-semibold text-foreground">{posts.length}</span>
        <span className="text-xs text-muted-foreground">
          post{posts.length > 1 ? "s" : ""} ce mois
        </span>
      </div>

      <div className="h-3 w-px bg-border" />

      {/* Statuts */}
      <div className="flex flex-wrap items-center gap-3">
        {scheduled > 0 && (
          <Stat
            color="bg-violet-500"
            label="planifié"
            count={scheduled}
          />
        )}
        {published > 0 && (
          <Stat
            color="bg-green-500"
            label="publié"
            count={published}
          />
        )}
        {drafts > 0 && (
          <Stat
            color="bg-muted-foreground/40"
            label="brouillon"
            count={drafts}
          />
        )}
        {failed > 0 && (
          <Stat
            color="bg-destructive"
            label="échec"
            count={failed}
          />
        )}
      </div>

      {topPlatforms.length > 0 && (
        <>
          <div className="h-3 w-px bg-border" />
          {/* Plateformes */}
          <div className="flex flex-wrap items-center gap-2">
            {topPlatforms.map(([platform, count]) => {
              const cfg = PLATFORM_CONFIG[platform as keyof typeof PLATFORM_CONFIG]
              if (!cfg) return null
              return (
                <span
                  key={platform}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground"
                >
                  <span
                    className="inline-block size-2 rounded-full shrink-0"
                    style={{ backgroundColor: cfg.color }}
                  />
                  <span className="font-medium" style={{ color: cfg.color }}>
                    {count}
                  </span>
                  <span>{cfg.label}</span>
                </span>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

function Stat({
  color,
  label,
  count,
}: {
  color: string
  label: string
  count: number
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={cn("inline-block size-2 rounded-full shrink-0", color)} />
      <span className="font-semibold text-foreground tabular-nums">{count}</span>
      <span>{label}{count > 1 ? "s" : ""}</span>
    </span>
  )
}
