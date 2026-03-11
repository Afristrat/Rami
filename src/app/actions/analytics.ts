"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { log } from "@/lib/utils/logger"
import { posts, users } from "@/lib/db/schema"
import { and, eq, gte, lte, count, sql } from "drizzle-orm"
import type { Platform } from "@/lib/scheduler/platform-config"

// ── Types ────────────────────────────────────────────────────────────────────

export interface KPIData {
  publishedCount: number
  publishedDelta: number       // % vs période précédente
  totalReach: number           // Simulé jusqu'à intégration Ayrshare
  reachDelta: number
  engagementRate: number       // % moyen
  engagementDelta: number
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
  engagementScore: number
  platformResults: Record<string, { status: string; postId?: string; url?: string }> | null
}

export interface AnalyticsData {
  kpis: KPIData
  dailyEngagement: DailyEngagement[]
  postsByStatus: PostStatusData[]
  topPosts: TopPost[]
}

export type PeriodOption = "7d" | "30d" | "90d"

// ── Helpers ──────────────────────────────────────────────────────────────────

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
    // DB direct (Drizzle) unavailable — tenant isolation via Supabase RLS is the fallback
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

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:      { label: "Brouillon",  color: "#6B7280" },
  review:     { label: "En révision", color: "#F59E0B" },
  approved:   { label: "Approuvé",   color: "#8B5CF6" },
  scheduled:  { label: "Planifié",   color: "#3B82F6" },
  publishing: { label: "Publication", color: "#06B6D4" },
  published:  { label: "Publié",     color: "#10B981" },
  failed:     { label: "Échoué",     color: "#EF4444" },
}

/**
 * Simule un score engagement basé sur les données disponibles.
 * En Phase 2, ces valeurs viendront d'Ayrshare.
 */
function simulateEngagement(post: typeof posts.$inferSelect): number {
  // Score basé sur le nombre de plateformes × un facteur temporel
  const platformCount = (post.platforms ?? []).length
  const hoursAgo = post.published_at
    ? (Date.now() - new Date(post.published_at).getTime()) / 3_600_000
    : 999
  const freshness = Math.max(0, 1 - hoursAgo / 720) // décroît sur 30j
  const base = (platformCount * 150 + Math.random() * 200) * (1 + freshness)
  return Math.round(base)
}

function simulateReach(publishedCount: number): number {
  return Math.round(publishedCount * (450 + Math.random() * 300))
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
    // ── 1. Posts publiés (période courante + précédente pour delta) ──────────
    const baseConditions = [
      eq(posts.tenant_id, tenantId),
      eq(posts.status, "published"),
    ]
    if (platforms && platforms.length > 0) {
      // Filtre sur platforms array (contient au moins l'une des plateformes)
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

    const publishedCount = currentRows.length
    const prevCount = prevRows.length
    const publishedDelta = prevCount > 0
      ? Math.round(((publishedCount - prevCount) / prevCount) * 100)
      : publishedCount > 0 ? 100 : 0

    // ── 2. Reach simulé ──────────────────────────────────────────────────────
    const totalReach = simulateReach(publishedCount)
    const prevReach = simulateReach(prevCount)
    const reachDelta = prevReach > 0
      ? Math.round(((totalReach - prevReach) / prevReach) * 100)
      : totalReach > 0 ? 100 : 0

    // ── 3. Top plateforme ────────────────────────────────────────────────────
    const platformCounts: Record<string, number> = {}
    for (const post of currentRows) {
      for (const p of post.platforms ?? []) {
        platformCounts[p] = (platformCounts[p] ?? 0) + 1
      }
    }
    const topPlatform = (Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0] ?? null) as [Platform, number] | null

    // ── 4. Engagement rate simulé ────────────────────────────────────────────
    const engagementRate = publishedCount > 0
      ? parseFloat((2.5 + Math.random() * 3.5).toFixed(1))
      : 0
    const engagementDelta = Math.round((Math.random() * 4 - 2) * 10) / 10

    // ── 5. KPIs ──────────────────────────────────────────────────────────────
    const kpis: KPIData = {
      publishedCount,
      publishedDelta,
      totalReach,
      reachDelta,
      engagementRate,
      engagementDelta,
      topPlatform: topPlatform ? topPlatform[0] : null,
      topPlatformCount: topPlatform ? topPlatform[1] : 0,
    }

    // ── 6. Engagement par jour et par plateforme ─────────────────────────────
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90
    const activePlatforms = platforms && platforms.length > 0
      ? platforms
      : (Object.keys(platformCounts).length > 0
          ? (Object.keys(platformCounts) as Platform[])
          : ["twitter", "linkedin", "instagram"] as Platform[])

    const dailyEngagement: DailyEngagement[] = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(end)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      const entry: DailyEngagement = { date: dateStr }
      for (const p of activePlatforms) {
        // Nombre de posts publiés ce jour sur cette plateforme
        const dayPosts = currentRows.filter(post => {
          if (!post.published_at) return false
          const postDate = new Date(post.published_at).toISOString().slice(0, 10)
          return postDate === dateStr && (post.platforms ?? []).includes(p)
        })
        // Engagement simulé pour la journée
        const engagement = dayPosts.length * (50 + Math.floor(Math.random() * 200))
        entry[p] = engagement
      }
      dailyEngagement.push(entry)
    }

    // ── 7. Répartition des posts par statut ──────────────────────────────────
    const allPosts = await db
      .select({
        status: posts.status,
        count: count(),
      })
      .from(posts)
      .where(eq(posts.tenant_id, tenantId))
      .groupBy(posts.status)

    const postsByStatus: PostStatusData[] = allPosts
      .filter(row => row.count > 0)
      .map(row => ({
        status: row.status,
        count: row.count,
        label: STATUS_META[row.status]?.label ?? row.status,
        color: STATUS_META[row.status]?.color ?? "#6B7280",
      }))

    // ── 8. Top 5 posts par engagement ────────────────────────────────────────
    const topPosts: TopPost[] = currentRows
      .map(post => ({
        id: post.id,
        title: post.title,
        content: post.content,
        platforms: (post.platforms ?? []) as Platform[],
        publishedAt: post.published_at?.toISOString() ?? null,
        engagementScore: simulateEngagement(post),
        platformResults: post.platform_results as Record<string, { status: string; postId?: string; url?: string }> | null,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, 5)

    return {
      success: true,
      data: { kpis, dailyEngagement, postsByStatus, topPosts },
    }
  } catch (error) {
    log({ level: "error", module: "analytics", action: "getAnalyticsData_error", metadata: { error: error instanceof Error ? error.message : String(error) } })
    return { success: false, error: "Erreur lors du chargement des analytics" }
  }
}
