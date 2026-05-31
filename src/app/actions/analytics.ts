"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { log } from "@/lib/utils/logger"
import { posts, users, postMetrics } from "@/lib/db/schema"
import { and, eq, gte, lte, count, inArray, sql } from "drizzle-orm"
import type { Platform } from "@/lib/scheduler/platform-config"
import {
  assembleAnalytics,
  type AnalyticsData,
  type AnalyticsPost,
  type LatestMetric,
  type PeriodOption,
} from "@/lib/services/analytics/aggregate"

// Ré-exports : les composants importent ces types depuis cette action.
export type {
  AnalyticsData,
  KPIData,
  DailyEngagement,
  PostStatusData,
  TopPost,
  PeriodOption,
} from "@/lib/services/analytics/aggregate"

// ── Helpers I/O ────────────────────────────────────────────────────────────────

async function getTenantId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  try {
    const row = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { tenant_id: true },
    })
    return row?.tenant_id ?? null
  } catch {
    // DB direct (Drizzle) indisponible — l'isolation tenant via RLS Supabase reste le filet.
    return null
  }
}

function getPeriodDates(period: PeriodOption): { start: Date; prevStart: Date; end: Date } {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  const prevStart = new Date(start)
  prevStart.setDate(prevStart.getDate() - days)
  return { start, prevStart, end }
}

/** Charge le dernier snapshot par (post, plateforme) pour un ensemble de posts. */
async function fetchLatestMetrics(tenantId: string, postIds: string[]): Promise<LatestMetric[]> {
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

// ── Action principale ─────────────────────────────────────────────────────────

export async function getAnalyticsData(
  period: PeriodOption = "30d",
  platforms?: Platform[]
): Promise<{ success: true; data: AnalyticsData } | { success: false; error: string }> {
  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Données analytics indisponibles" }

  const { start, prevStart, end } = getPeriodDates(period)

  try {
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

    return { success: true, data }
  } catch (error) {
    log({ level: "error", module: "analytics", action: "getAnalyticsData_error", metadata: { error: error instanceof Error ? error.message : String(error) } })
    return { success: false, error: "Erreur lors du chargement des analytics" }
  }
}
