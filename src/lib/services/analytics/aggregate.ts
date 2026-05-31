/**
 * Agrégation analytics — logique PURE (US-012, Dashboard analytics réel).
 *
 * Sépare la transformation (testable, sans I/O) de la récupération DB faite
 * dans la Server Action `app/actions/analytics.ts`. Toutes les valeurs sont
 * RÉELLES (issues de `post_metrics`) : une absence de donnée vaut 0, jamais une
 * estimation (DÉFCON 1 — zéro donnée inventée).
 */

import type { Platform } from "@/lib/scheduler/platform-config"

export type PeriodOption = "7d" | "30d" | "90d"

export interface KPIData {
  publishedCount: number
  publishedDelta: number       // % vs période précédente
  impressions: number          // somme des impressions réelles
  impressionsDelta: number
  interactions: number         // likes + comments + shares + saves
  interactionsDelta: number
  engagementRate: number       // % = interactions / impressions
  engagementDelta: number      // points de %, vs période précédente
  clicks: number               // somme des clics réels
  clicksDelta: number
  likes: number                // somme des likes réels
  likesDelta: number
  topPlatform: Platform | null
  topPlatformCount: number
}

export interface DailyEngagement {
  date: string                 // "YYYY-MM-DD"
  [platform: string]: number | string
}

export interface PostStatusData {
  status: string
  count: number
  label: string
  color: string
}

export interface TopPost {
  id: string
  title: string | null
  content: string
  platforms: Platform[]
  publishedAt: string | null
  reach: number                // impressions réelles (somme plateformes du post)
  engagementRate: number       // % réel
  clicks: number               // clics réels
  interactions: number         // likes + comments + shares + saves réels
  platformResults: Record<string, { status: string; postId?: string; url?: string }> | null
}

export interface AnalyticsData {
  kpis: KPIData
  dailyEngagement: DailyEngagement[]
  postsByStatus: PostStatusData[]
  topPosts: TopPost[]
}

/** Dernier snapshot par (post, plateforme) — interactions réelles agrégées. */
export interface LatestMetric {
  post_id: string
  platform: Platform
  impressions: number
  interactions: number   // likes + comments + shares + saves
  clicks: number
  likes: number
}

/** Post publié (forme normalisée, indépendante de la couche DB). */
export interface AnalyticsPost {
  id: string
  title: string | null
  content: string
  platforms: Platform[]
  publishedAt: Date | null
  platformResults: Record<string, { status: string; postId?: string; url?: string }> | null
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:      { label: "Brouillon",  color: "#6B7280" },
  review:     { label: "En révision", color: "#F59E0B" },
  approved:   { label: "Approuvé",   color: "#8B5CF6" },
  scheduled:  { label: "Planifié",   color: "#3B82F6" },
  publishing: { label: "Publication", color: "#06B6D4" },
  published:  { label: "Publié",     color: "#10B981" },
  failed:     { label: "Échoué",     color: "#EF4444" },
}

const DEFAULT_PLATFORMS: Platform[] = ["twitter", "linkedin", "instagram"]

// ── Helpers purs ────────────────────────────────────────────────────────────

/** Delta en pourcentage (variation relative) entre deux valeurs. */
export function pctDelta(current: number, previous: number): number {
  if (previous > 0) return Math.round(((current - previous) / previous) * 100)
  return current > 0 ? 100 : 0
}

/** Arrondi à une décimale. */
export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** Somme des metrics réelles sur un ensemble de snapshots. */
export function sumMetrics(metrics: LatestMetric[]): {
  impressions: number
  interactions: number
  clicks: number
  likes: number
} {
  return metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      interactions: acc.interactions + m.interactions,
      clicks: acc.clicks + m.clicks,
      likes: acc.likes + m.likes,
    }),
    { impressions: 0, interactions: 0, clicks: 0, likes: 0 }
  )
}

function periodDays(period: PeriodOption): number {
  return period === "7d" ? 7 : period === "30d" ? 30 : 90
}

// ── Assemblage principal (pur) ─────────────────────────────────────────────────

export function assembleAnalytics(input: {
  period: PeriodOption
  end: Date
  selectedPlatforms?: Platform[]
  currentPosts: AnalyticsPost[]
  currentMetrics: LatestMetric[]
  prevPostCount: number
  prevMetrics: LatestMetric[]
  statusCounts: Array<{ status: string; count: number }>
}): AnalyticsData {
  const { period, end, selectedPlatforms, currentPosts, currentMetrics, prevPostCount, prevMetrics, statusCounts } = input

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const publishedCount = currentPosts.length
  const cur = sumMetrics(currentMetrics)
  const prev = sumMetrics(prevMetrics)

  const engagementRate = cur.impressions > 0 ? round1((cur.interactions / cur.impressions) * 100) : 0
  const prevEngagementRate = prev.impressions > 0 ? round1((prev.interactions / prev.impressions) * 100) : 0

  const platformCounts: Record<string, number> = {}
  for (const post of currentPosts) {
    for (const p of post.platforms) platformCounts[p] = (platformCounts[p] ?? 0) + 1
  }
  const topPlatformEntry = (Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0] ?? null) as [Platform, number] | null

  const kpis: KPIData = {
    publishedCount,
    publishedDelta: pctDelta(publishedCount, prevPostCount),
    impressions: cur.impressions,
    impressionsDelta: pctDelta(cur.impressions, prev.impressions),
    interactions: cur.interactions,
    interactionsDelta: pctDelta(cur.interactions, prev.interactions),
    engagementRate,
    engagementDelta: round1(engagementRate - prevEngagementRate),
    clicks: cur.clicks,
    clicksDelta: pctDelta(cur.clicks, prev.clicks),
    likes: cur.likes,
    likesDelta: pctDelta(cur.likes, prev.likes),
    topPlatform: topPlatformEntry ? topPlatformEntry[0] : null,
    topPlatformCount: topPlatformEntry ? topPlatformEntry[1] : 0,
  }

  // ── Engagement réel par jour et par plateforme ───────────────────────────────
  const postDate = new Map<string, string | null>()
  for (const post of currentPosts) {
    postDate.set(post.id, post.publishedAt ? toDateStr(post.publishedAt) : null)
  }

  const activePlatforms: Platform[] = selectedPlatforms && selectedPlatforms.length > 0
    ? selectedPlatforms
    : (Object.keys(platformCounts).length > 0 ? (Object.keys(platformCounts) as Platform[]) : DEFAULT_PLATFORMS)

  const engagementByDay = new Map<string, Map<string, number>>()
  for (const m of currentMetrics) {
    const date = postDate.get(m.post_id)
    if (!date) continue
    const byPlatform = engagementByDay.get(date) ?? new Map<string, number>()
    byPlatform.set(m.platform, (byPlatform.get(m.platform) ?? 0) + m.interactions)
    engagementByDay.set(date, byPlatform)
  }

  const days = periodDays(period)
  const dailyEngagement: DailyEngagement[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const dateStr = toDateStr(d)
    const entry: DailyEngagement = { date: dateStr }
    const dayMetrics = engagementByDay.get(dateStr)
    for (const p of activePlatforms) entry[p] = dayMetrics?.get(p) ?? 0
    dailyEngagement.push(entry)
  }

  // ── Répartition par statut ───────────────────────────────────────────────────
  const postsByStatus: PostStatusData[] = statusCounts
    .filter((row) => row.count > 0)
    .map((row) => ({
      status: row.status,
      count: row.count,
      label: STATUS_META[row.status]?.label ?? row.status,
      color: STATUS_META[row.status]?.color ?? "#6B7280",
    }))

  // ── Top 5 posts par interactions réelles ─────────────────────────────────────
  const perPost = new Map<string, { impressions: number; interactions: number; clicks: number }>()
  for (const m of currentMetrics) {
    const agg = perPost.get(m.post_id) ?? { impressions: 0, interactions: 0, clicks: 0 }
    agg.impressions += m.impressions
    agg.interactions += m.interactions
    agg.clicks += m.clicks
    perPost.set(m.post_id, agg)
  }

  const topPosts: TopPost[] = currentPosts
    .map((post) => {
      const agg = perPost.get(post.id) ?? { impressions: 0, interactions: 0, clicks: 0 }
      return {
        id: post.id,
        title: post.title,
        content: post.content,
        platforms: post.platforms,
        publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
        reach: agg.impressions,
        engagementRate: agg.impressions > 0 ? round1((agg.interactions / agg.impressions) * 100) : 0,
        clicks: agg.clicks,
        interactions: agg.interactions,
        platformResults: post.platformResults,
      }
    })
    .sort((a, b) => b.interactions - a.interactions)
    .slice(0, 5)

  return { kpis, dailyEngagement, postsByStatus, topPosts }
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10)
}
