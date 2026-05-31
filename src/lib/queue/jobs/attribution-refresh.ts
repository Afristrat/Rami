/**
 * Worker pg-boss — Rafraîchissement de l'attribution (Performance Loop, US-007)
 *
 * Recalcule le cache `attribution_rankings` (lecture rapide pour le dashboard).
 * Incrémental : ne recalcule que les tenants dont des metrics sont plus récentes
 * que leur dernier `computed_at`. Cron toutes les 6 h.
 *
 * Utilise le service client (bypass RLS) avec filtre tenant_id explicite.
 */

import { getBoss, JOBS } from "../pgboss"
import { createServiceClient } from "@/lib/supabase/service"
import {
  aggregateAttribution,
  ATTRIBUTION_DIMENSIONS,
  type AttributionDimension,
} from "@/lib/services/metrics/attribution"
import type { NewAttributionRanking } from "@/lib/db/schema"
import { log } from "@/lib/utils/logger"

const REFRESH_CRON = "0 */6 * * *" // toutes les 6 heures

// ── Démarrage du worker + planification cron ───────────────────────────────────

export async function startAttributionRefreshWorker(): Promise<void> {
  const boss = await getBoss()

  if (!boss) {
    log({ level: "warn", module: "attribution-refresh", action: "queue_unavailable", message: "Queue indisponible — worker non démarré" })
    return
  }

  // La planification cron exige une queue existante (pg-boss v12).
  try {
    await boss.createQueue(JOBS.ATTRIBUTION_REFRESH)
  } catch {
    // Queue déjà créée — sans gravité.
  }

  await boss.work(JOBS.ATTRIBUTION_REFRESH, async () => {
    await refreshAllAttribution()
  })

  await boss.schedule(JOBS.ATTRIBUTION_REFRESH, REFRESH_CRON)

  log({ level: "info", module: "attribution-refresh", action: "worker_started" })
}

// ── Sweep incrémental ──────────────────────────────────────────────────────────

interface PostEmbed {
  ai_metadata: Record<string, unknown> | null
  scheduled_at: string | null
  published_at: string | null
}

interface MetricJoinRow {
  post_id: string
  platform: string
  collected_at: string
  engagement_rate: number | null
  impressions: number | null
  posts: PostEmbed | PostEmbed[] | null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = any

export async function refreshAllAttribution(): Promise<void> {
  const supabase = createServiceClient()
  const tenantIds = await getTenantsToRefresh(supabase)

  let refreshed = 0
  for (const tenantId of tenantIds) {
    try {
      await refreshAttributionForTenant(supabase, tenantId)
      refreshed++
    } catch (err) {
      log({ level: "error", module: "attribution-refresh", action: "tenant_refresh_failed", tenant_id: tenantId, metadata: { error: err instanceof Error ? err.message : String(err) } })
    }
  }

  log({ level: "info", module: "attribution-refresh", action: "sweep_done", metadata: { candidates: tenantIds.length, refreshed } })
}

/** Tenants dont les metrics sont plus récentes que leur dernier recalcul. */
async function getTenantsToRefresh(supabase: ServiceClient): Promise<string[]> {
  const { data: metrics } = await supabase.from("post_metrics").select("tenant_id, collected_at")
  const latestMetric = new Map<string, number>()
  for (const r of (metrics ?? []) as Array<{ tenant_id: string; collected_at: string }>) {
    const ts = new Date(r.collected_at).getTime()
    if (ts > (latestMetric.get(r.tenant_id) ?? 0)) latestMetric.set(r.tenant_id, ts)
  }

  const { data: ranks } = await supabase.from("attribution_rankings").select("tenant_id, computed_at")
  const lastComputed = new Map<string, number>()
  for (const r of (ranks ?? []) as Array<{ tenant_id: string; computed_at: string }>) {
    const ts = new Date(r.computed_at).getTime()
    if (ts > (lastComputed.get(r.tenant_id) ?? 0)) lastComputed.set(r.tenant_id, ts)
  }

  const out: string[] = []
  for (const [tenantId, ts] of latestMetric) {
    if (ts > (lastComputed.get(tenantId) ?? 0)) out.push(tenantId)
  }
  return out
}

/** Recalcule et remplace les rankings d'un tenant. */
export async function refreshAttributionForTenant(
  supabase: ServiceClient,
  tenantId: string
): Promise<void> {
  const { data, error } = await supabase
    .from("post_metrics")
    .select(
      "post_id, platform, collected_at, engagement_rate, impressions, posts!inner(ai_metadata, scheduled_at, published_at)"
    )
    .eq("tenant_id", tenantId)

  if (error) throw new Error(error.message)

  // Dernier snapshot par (post, plateforme).
  const latest = new Map<string, MetricJoinRow>()
  for (const row of (data ?? []) as MetricJoinRow[]) {
    const key = `${row.post_id}:${row.platform}`
    const prev = latest.get(key)
    if (!prev || new Date(row.collected_at) > new Date(prev.collected_at)) {
      latest.set(key, row)
    }
  }
  const facts = Array.from(latest.values())

  // computed_at est laissé au défaut DB now() (type Drizzle = Date).
  const rowsToInsert: NewAttributionRanking[] = []

  for (const dimension of ATTRIBUTION_DIMENSIONS) {
    const dimFacts = facts.map((f) => ({
      value: extractDimension(f, dimension),
      engagement_rate: typeof f.engagement_rate === "number" ? f.engagement_rate : null,
      impressions: typeof f.impressions === "number" ? f.impressions : null,
    }))

    for (const rank of aggregateAttribution(dimFacts)) {
      rowsToInsert.push({
        tenant_id: tenantId,
        dimension,
        value: rank.value,
        avg_engagement: rank.avgEngagement,
        total_impressions: rank.totalImpressions,
        sample_size: rank.sampleSize,
      })
    }
  }

  // Remplacement atomique-ish : purge puis insertion (évite le stale).
  await supabase.from("attribution_rankings").delete().eq("tenant_id", tenantId)
  if (rowsToInsert.length > 0) {
    await supabase.from("attribution_rankings").insert(rowsToInsert)
  }

  log({ level: "info", module: "attribution-refresh", action: "tenant_refreshed", tenant_id: tenantId, metadata: { facts: facts.length, rankings: rowsToInsert.length } })
}

/** Extrait la valeur d'une dimension depuis une ligne de faits. */
function extractDimension(row: MetricJoinRow, dimension: AttributionDimension): string | null {
  const post = Array.isArray(row.posts) ? row.posts[0] : row.posts
  const meta = post?.ai_metadata ?? {}

  switch (dimension) {
    case "cognitive_objective":
      return toStr(meta.cognitive_objective)
    case "visual_direction":
      return toStr(meta.direction)
    case "dominant_color_hex":
      return toStr(meta.dominant_color_hex)
    case "hook":
      return toStr(meta.hook)
    case "format":
      return toStr(meta.format)
    case "platform":
      return toStr(row.platform)
    case "scheduled_hour": {
      const t = post?.scheduled_at ?? post?.published_at
      return t ? String(new Date(t).getUTCHours()) : null
    }
  }
}

function toStr(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null
  return String(v)
}
