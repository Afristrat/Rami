// ============================================================
// Analytics — I/O Drizzle partagée (US-012, réutilisée par US-026)
// ============================================================
// Charge posts publiés + derniers snapshots post_metrics d'un tenant et
// délègue l'assemblage au module PUR aggregate.ts. Extrait de
// app/actions/analytics.ts pour être réutilisable par le rapport client
// (documents.actions) sans dupliquer les requêtes. Module serveur uniquement
// (jamais importé côté client) ; le tenantId est TOUJOURS résolu par
// l'appelant à partir de la session (pas de paramètre exposé au client).

import { db } from "@/lib/db"
import { posts, postMetrics } from "@/lib/db/schema"
import { and, eq, gte, lte, count, inArray, sql } from "drizzle-orm"
import type { Platform } from "@/lib/scheduler/platform-config"
import {
  assembleAnalytics,
  type AnalyticsData,
  type AnalyticsPost,
  type LatestMetric,
  type PeriodOption,
} from "@/lib/services/analytics/aggregate"

export function getPeriodDates(period: PeriodOption): { start: Date; prevStart: Date; end: Date } {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  const prevStart = new Date(start)
  prevStart.setDate(prevStart.getDate() - days)
  return { start, prevStart, end }
}

/** Charge le dernier snapshot par (post, plateforme) pour un ensemble de posts. */
export async function fetchLatestMetrics(tenantId: string, postIds: string[]): Promise<LatestMetric[]> {
  if (postIds.length === 0) return []

  const rows = await db
    .select({
      post_id: postMetrics.post_id,
      platform: postMetrics.platform,
      collected_at: postMetrics.collected_at,
      impressions: postMetrics.impressions,
      likes: postMetrics.likes,
      comments: postMetrics.comments,
      shares: postMetrics.shares,
      saves: postMetrics.saves,
      clicks: postMetrics.clicks,
    })
    .from(postMetrics)
    .where(and(eq(postMetrics.tenant_id, tenantId), inArray(postMetrics.post_id, postIds)))

  // Conserver le snapshot le plus récent par (post, plateforme) — série temporelle.
  const latest = new Map<string, (typeof rows)[number]>()
  for (const r of rows) {
    const key = `${r.post_id}:${r.platform}`
    const prev = latest.get(key)
    if (!prev || new Date(r.collected_at) > new Date(prev.collected_at)) latest.set(key, r)
  }

  return Array.from(latest.values()).map((r) => ({
    post_id: r.post_id,
    platform: r.platform as Platform,
    impressions: r.impressions ?? 0,
    interactions: (r.likes ?? 0) + (r.comments ?? 0) + (r.shares ?? 0) + (r.saves ?? 0),
    clicks: r.clicks ?? 0,
    likes: r.likes ?? 0,
  }))
}

export interface AnalyticsBundle {
  data: AnalyticsData
  currentMetrics: LatestMetric[]
  start: Date
  end: Date
}

/**
 * Charge et assemble les analytics réelles d'un tenant sur une période.
 * ⚠️ Le tenantId DOIT provenir de la session de l'appelant (jamais du client).
 */
export async function fetchAnalyticsBundle(
  tenantId: string,
  period: PeriodOption,
  platforms?: Platform[]
): Promise<AnalyticsBundle> {
  const { start, prevStart, end } = getPeriodDates(period)

  // ── Posts publiés (période courante + précédente pour les deltas) ─────────
  const baseConditions = [
    eq(posts.tenant_id, tenantId),
    eq(posts.status, "published"),
  ]
  if (platforms && platforms.length > 0) {
    baseConditions.push(
      sql`${posts.platforms} && ARRAY[${sql.join(platforms.map(p => sql`${p}::platform`), sql`, `)}]::platform[]`
    )
  }

  const currentRows = await db
    .select()
    .from(posts)
    .where(and(...baseConditions, gte(posts.published_at, start), lte(posts.published_at, end)))

  const prevRows = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(...baseConditions, gte(posts.published_at, prevStart), lte(posts.published_at, start)))

  // ── Metrics réelles — période courante et précédente ─────────────────────
  const currentMetrics = await fetchLatestMetrics(tenantId, currentRows.map((p) => p.id))
  const prevMetrics = await fetchLatestMetrics(tenantId, prevRows.map((p) => p.id))

  // ── Répartition des posts par statut ─────────────────────────────────────
  const statusCounts = await db
    .select({ status: posts.status, count: count() })
    .from(posts)
    .where(eq(posts.tenant_id, tenantId))
    .groupBy(posts.status)

  // ── Assemblage pur ───────────────────────────────────────────────────────
  const currentPosts: AnalyticsPost[] = currentRows.map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    platforms: (post.platforms ?? []) as Platform[],
    publishedAt: post.published_at,
    platformResults: post.platform_results as Record<string, { status: string; postId?: string; url?: string }> | null,
  }))

  const data = assembleAnalytics({
    period,
    end,
    selectedPlatforms: platforms,
    currentPosts,
    currentMetrics,
    prevPostCount: prevRows.length,
    prevMetrics,
    statusCounts: statusCounts.map((r) => ({ status: r.status as string, count: r.count })),
  })

  return { data, currentMetrics, start, end }
}
