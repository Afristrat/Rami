"use client"

import { useTranslations } from "next-intl"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import { useIntlLocale } from "@/lib/utils/format-locale"
import { computePostEngagementScore } from "./analytics-dashboard"
import type { TopPost } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"

interface TopPostsTableProps {
  posts: TopPost[]
}

/** Platform badge colors for the circle letter indicator */
const PLATFORM_CIRCLES: Partial<Record<Platform, { bg: string; letter: string }>> = {
  linkedin:  { bg: "bg-blue-600", letter: "L" },
  instagram: { bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600", letter: "I" },
  twitter:   { bg: "bg-slate-600 dark:bg-slate-700", letter: "X" },
  facebook:  { bg: "bg-blue-700", letter: "F" },
  pinterest: { bg: "bg-red-600", letter: "P" },
  youtube:   { bg: "bg-red-600", letter: "Y" },
  mastodon:  { bg: "bg-indigo-500", letter: "M" },
  tiktok:    { bg: "bg-zinc-800 dark:bg-zinc-200", letter: "T" },
}

function formatNumber(n: number, locale: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return n.toLocaleString(locale)
  return n.toLocaleString(locale)
}

/** Demo data when real posts lack engagement metrics (Phase 2 will use Ayrshare) */
const DEMO_POSTS = [
  { title: "Comment l\u2019IA r\u00e9volutionne le workflow des agences en 2024\u2026", platform: "linkedin" as Platform, reach: 45200, engagement: 8.2, clicks: 1240, rawEngagement: 820 },
  { title: "Nouveau design system RAMI : La simplicit\u00e9 au service de la donn\u00e9e", platform: "instagram" as Platform, reach: 32100, engagement: 6.1, clicks: 890, rawEngagement: 610 },
  { title: "Pourquoi votre agence doit passer \u00e0 l\u2019OS unifi\u00e9 ?", platform: "twitter" as Platform, reach: 28500, engagement: 4.5, clicks: 410, rawEngagement: 450 },
  { title: "Behind the scenes : L\u2019\u00e9quipe derri\u00e8re RAMI", platform: "linkedin" as Platform, reach: 19400, engagement: 3.8, clicks: 225, rawEngagement: 380 },
  { title: "Rejoignez notre prochain webinaire sur l\u2019IA", platform: "facebook" as Platform, reach: 12100, engagement: 2.1, clicks: 98, rawEngagement: 210 },
]

function PlatformCircle({ platform }: { platform: Platform }) {
  const circle = PLATFORM_CIRCLES[platform]
  if (!circle) {
    const config = PLATFORM_CONFIG[platform]
    return (
      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
        {config?.icon ?? "?"}
      </span>
    )
  }
  return (
    <span className={`flex size-8 items-center justify-center rounded-full ${circle.bg} text-xs font-bold text-white`}>
      {circle.letter}
    </span>
  )
}

function EngagementBar({ value }: { value: number }) {
  const width = Math.min(100, (value / 10) * 100)
  return (
    <div className="flex flex-col gap-0.5">
      <div className="h-1.5 w-24 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{value}%</span>
    </div>
  )
}

export function TopPostsTable({ posts }: TopPostsTableProps) {
  const t = useTranslations("analytics")
  const intlLocale = useIntlLocale()
  const hasRealData = posts.length > 0
  const displayData = hasRealData
    ? posts.slice(0, 5).map((post, i) => ({
        rank: i + 1,
        title: post.title ?? post.content.slice(0, 80),
        platform: (post.platforms[0] ?? "linkedin") as Platform,
        reach: Math.round(post.engagementScore * 35),
        engagement: parseFloat((1.5 + (post.engagementScore / 200) * 7).toFixed(1)),
        clicks: Math.round(post.engagementScore * 0.9),
        rawEngagement: post.engagementScore,
      }))
    : DEMO_POSTS.map((p, i) => ({ rank: i + 1, ...p }))

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-muted/30">
          <tr className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            <th className="px-6 py-4">{t("rankColumn")}</th>
            <th className="px-6 py-4">{t("publicationColumn")}</th>
            <th className="px-6 py-4">{t("platformColumn")}</th>
            <th className="px-6 py-4">{t("reachColumn")}</th>
            <th className="px-6 py-4">{t("engagementColumn")}</th>
            <th className="px-6 py-4">{t("clicksColumn")}</th>
            <th className="px-6 py-4">{t("scoreColumn")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-white/5">
          {displayData.map((row) => (
            <tr
              key={row.rank}
              className="hover:bg-muted/50 transition-colors cursor-pointer group"
            >
              {/* Rang */}
              <td className="px-6 py-4">
                <span className={`font-bold ${row.rank === 1 ? "text-primary" : "text-muted-foreground"}`}>
                  #{row.rank}
                </span>
              </td>

              {/* Publication */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="size-12 shrink-0 rounded-lg bg-muted dark:bg-slate-800 border border-border overflow-hidden">
                    <div className="size-full bg-gradient-to-br from-primary/20 to-primary/5" />
                  </div>
                  <div className="max-w-[200px]">
                    <p className="truncate text-sm italic text-muted-foreground">
                      &ldquo;{row.title}&rdquo;
                    </p>
                  </div>
                </div>
              </td>

              {/* Plateforme */}
              <td className="px-6 py-4">
                <PlatformCircle platform={row.platform} />
              </td>

              {/* Reach */}
              <td className="px-6 py-4 font-semibold text-foreground">
                {formatNumber(row.reach, intlLocale)}
              </td>

              {/* Engagement */}
              <td className="px-6 py-4">
                <EngagementBar value={row.engagement} />
              </td>

              {/* Clics */}
              <td className="px-6 py-4 font-semibold text-foreground">
                {formatNumber(row.clicks, intlLocale)}
              </td>

              {/* Score */}
              <td className="px-6 py-4">
                <PostScoreBadge score={computePostEngagementScore(row.rawEngagement)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PostScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
      : score >= 50
      ? "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20"

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${color}`}>
      {score}/100
    </span>
  )
}
