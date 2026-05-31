/**
 * Worker pg-boss — Agrégation des benchmarks collectifs (Performance Loop, US-010)
 *
 * Balaie quotidiennement les tenants AYANT CONSENTI (collective_optin = true,
 * US-011), agrège leurs metrics réelles par (secteur × culture × plateforme),
 * et n'écrit un benchmark QUE si ≥ 5 tenants distincts contribuent (k-anonymity,
 * US-009). Le filtre s'applique AVANT l'INSERT ; le CHECK SQL reste le dernier
 * garde-fou. Upsert sur (secteur, culture, plateforme, metric) + purge des
 * agrégats devenus non-qualifiants (table toujours véridique, DÉFCON 1).
 *
 * Service client (bypass RLS) : les benchmarks sont cross-tenant et sans
 * tenant_id ; seul ce job (service-role) peut y écrire.
 */

import { getBoss, JOBS } from "../pgboss"
import { createServiceClient } from "@/lib/supabase/service"
import {
  computeTenantPlatformStats,
  aggregateCollective,
  benchmarkKey,
  type MetricFact,
  type TenantPlatformStat,
  type CollectiveRow,
} from "@/lib/services/metrics/collective"
import { log } from "@/lib/utils/logger"

const AGGREGATE_CRON = "0 3 * * *" // tous les jours à 03:00 UTC

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- client Supabase non typé côté worker
type ServiceClient = any

// ── Démarrage du worker + planification cron ───────────────────────────────────

export async function startCollectiveAggregateWorker(): Promise<void> {
  const boss = await getBoss()

  if (!boss) {
    log({ level: "warn", module: "collective-aggregate", action: "queue_unavailable", message: "Queue indisponible — worker non démarré" })
    return
  }

  // La planification cron exige une queue existante (pg-boss v12).
  try {
    await boss.createQueue(JOBS.COLLECTIVE_AGGREGATE)
  } catch {
    // Queue déjà créée — sans gravité.
  }

  await boss.work(JOBS.COLLECTIVE_AGGREGATE, async () => {
    await aggregateCollectiveBenchmarks()
  })

  await boss.schedule(JOBS.COLLECTIVE_AGGREGATE, AGGREGATE_CRON)

  log({ level: "info", module: "collective-aggregate", action: "worker_started" })
}

// ── Sweep d'agrégation ──────────────────────────────────────────────────────────

interface OptinTenant {
  id: string
  sector: string
  culture: string
}

interface MetricRow {
  post_id: string
  platform: string
  collected_at: string
  engagement_rate: number | null
  impressions: number | null
}

/**
 * Recalcule l'intégralité des benchmarks collectifs.
 * Exporté pour les tests d'intégration et l'exécution manuelle.
 */
export async function aggregateCollectiveBenchmarks(): Promise<{ rows: number; optinTenants: number }> {
  const supabase = createServiceClient()

  // 1. Tenants opt-in avec secteur ET culture renseignés (bucketables).
  const tenants = await getOptinTenants(supabase)

  if (tenants.length === 0) {
    await pruneStale(supabase, [])
    log({ level: "info", module: "collective-aggregate", action: "no_optin_tenant" })
    return { rows: 0, optinTenants: 0 }
  }

  // 2. Pour chaque tenant : dernier snapshot par post×plateforme → stats/plateforme.
  const allStats: TenantPlatformStat[] = []
  for (const tenant of tenants) {
    try {
      const facts = await getLatestFactsForTenant(supabase, tenant.id)
      allStats.push(...computeTenantPlatformStats(tenant.id, tenant.sector, tenant.culture, facts))
    } catch (err) {
      log({ level: "error", module: "collective-aggregate", action: "tenant_stats_failed", tenant_id: tenant.id, metadata: { error: err instanceof Error ? err.message : String(err) } })
    }
  }

  // 3. Agrégation avec garde-fou k-anonymity (≥ 5 tenants distincts par bucket).
  const rows = aggregateCollective(allStats)

  // 4. Upsert des qualifiants + purge des agrégats devenus non-qualifiants.
  await upsertBenchmarks(supabase, rows)
  await pruneStale(supabase, rows)

  log({ level: "info", module: "collective-aggregate", action: "done", metadata: { optin_tenants: tenants.length, rows: rows.length } })
  return { rows: rows.length, optinTenants: tenants.length }
}

/** Tenants ayant consenti, avec secteur + culture exploitables (brand_dna PLAT). */
async function getOptinTenants(supabase: ServiceClient): Promise<OptinTenant[]> {
  const { data, error } = await supabase
    .from("tenants")
    .select("id, brand_dna")
    .eq("collective_optin", true)

  if (error) throw new Error(error.message)

  const out: OptinTenant[] = []
  for (const row of (data ?? []) as Array<{ id: string; brand_dna: Record<string, unknown> | null }>) {
    const dna = row.brand_dna ?? {}
    const sector = readSlug(dna.sector)
    const culture = readSlug(dna.primaryCulture)
    // Sans secteur ET culture, impossible de bucketiser → le tenant ne contribue pas.
    if (sector && culture) out.push({ id: row.id, sector, culture })
  }
  return out
}

/** Dernier snapshot par (post, plateforme) → facts metrics d'un tenant. */
async function getLatestFactsForTenant(supabase: ServiceClient, tenantId: string): Promise<MetricFact[]> {
  const { data, error } = await supabase
    .from("post_metrics")
    .select("post_id, platform, collected_at, engagement_rate, impressions")
    .eq("tenant_id", tenantId)

  if (error) throw new Error(error.message)

  const latest = new Map<string, MetricRow>()
  for (const row of (data ?? []) as MetricRow[]) {
    const key = `${row.post_id}:${row.platform}`
    const prev = latest.get(key)
    if (!prev || new Date(row.collected_at) > new Date(prev.collected_at)) {
      latest.set(key, row)
    }
  }

  return Array.from(latest.values()).map((r) => ({
    platform: r.platform,
    engagement_rate: typeof r.engagement_rate === "number" ? r.engagement_rate : null,
    impressions: typeof r.impressions === "number" ? r.impressions : null,
  }))
}

/** Upsert des benchmarks qualifiants sur (secteur, culture, plateforme, metric). */
async function upsertBenchmarks(supabase: ServiceClient, rows: CollectiveRow[]): Promise<void> {
  if (rows.length === 0) return

  const payload = rows.map((r) => ({
    sector: r.sector,
    culture: r.culture,
    platform: r.platform,
    metric: r.metric,
    value: r.value,
    sample_size: r.sampleSize,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from("collective_benchmarks")
    .upsert(payload, { onConflict: "sector,culture,platform,metric" })

  if (error) throw new Error(error.message)
}

/** Supprime les benchmarks qui ne font plus partie de l'ensemble qualifiant. */
async function pruneStale(supabase: ServiceClient, rows: CollectiveRow[]): Promise<void> {
  const keep = new Set(
    rows.map((r) => benchmarkKey({ sector: r.sector, culture: r.culture, platform: r.platform, metric: r.metric }))
  )

  const { data, error } = await supabase
    .from("collective_benchmarks")
    .select("id, sector, culture, platform, metric")

  if (error) throw new Error(error.message)

  const staleIds: string[] = []
  for (const row of (data ?? []) as Array<{ id: string; sector: string; culture: string; platform: string; metric: string }>) {
    if (!keep.has(benchmarkKey(row))) staleIds.push(row.id)
  }

  if (staleIds.length > 0) {
    await supabase.from("collective_benchmarks").delete().in("id", staleIds)
  }
}

/** Lit une valeur slug non vide depuis brand_dna (sinon null). */
function readSlug(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null
}
