/**
 * Attribution feature → performance (Performance Loop, MOAT-1, US-007).
 *
 * Relie l'engagement réel (vue `attribution_facts`) aux choix de création
 * (objectif cognitif, couleur dominante, direction visuelle, hook, format,
 * heure de diffusion, plateforme) et produit un classement des features
 * gagnantes par dimension.
 *
 * Deux usages :
 *  - `topFeatures()` : lecture LIVE via la vue (RLS tenant héritée) — appelé
 *    depuis une Server Action / Server Component.
 *  - `refreshAttributionForTenant()` : recalcul du cache `attribution_rankings`
 *    via le service client (job pg-boss `attribution.refresh`).
 */

import { createClient } from "@/lib/supabase/server"
import { log } from "@/lib/utils/logger"

// ── Dimensions analysables ──────────────────────────────────────────────────────

export type AttributionDimension =
  | "cognitive_objective"
  | "visual_direction"
  | "dominant_color_hex"
  | "hook"
  | "format"
  | "scheduled_hour"
  | "platform"

export const ATTRIBUTION_DIMENSIONS: AttributionDimension[] = [
  "cognitive_objective",
  "visual_direction",
  "dominant_color_hex",
  "hook",
  "format",
  "scheduled_hour",
  "platform",
]

/** Seuil minimal d'échantillon pour qu'une feature soit classée (anti-bruit). */
export const MIN_SAMPLE_SIZE = 3

export interface FeatureRanking {
  value: string
  avgEngagement: number
  totalImpressions: number
  sampleSize: number
}

export interface TopFeaturesResult {
  dimension: AttributionDimension
  sector: string | null
  rankings: FeatureRanking[]
}

interface FactRow {
  value: unknown
  engagement_rate: number | null
  impressions: number | null
}

// ── Agrégateur pur (testable, partagé live + cache) ────────────────────────────

/**
 * Agrège des lignes de faits par valeur de dimension : moyenne d'engagement,
 * total d'impressions, taille d'échantillon. Filtre les valeurs nulles et les
 * échantillons < MIN_SAMPLE_SIZE, trie par engagement décroissant.
 */
export function aggregateAttribution(rows: FactRow[]): FeatureRanking[] {
  const buckets = new Map<
    string,
    { sumEngagement: number; totalImpressions: number; sampleSize: number }
  >()

  for (const row of rows) {
    if (row.value === null || row.value === undefined || row.value === "") continue
    const key = String(row.value)
    const bucket = buckets.get(key) ?? { sumEngagement: 0, totalImpressions: 0, sampleSize: 0 }
    bucket.sumEngagement += row.engagement_rate ?? 0
    bucket.totalImpressions += row.impressions ?? 0
    bucket.sampleSize += 1
    buckets.set(key, bucket)
  }

  return Array.from(buckets.entries())
    .map(([value, b]) => ({
      value,
      avgEngagement: b.sampleSize > 0 ? b.sumEngagement / b.sampleSize : 0,
      totalImpressions: b.totalImpressions,
      sampleSize: b.sampleSize,
    }))
    .filter((r) => r.sampleSize >= MIN_SAMPLE_SIZE)
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
}

// ── Lecture LIVE via la vue attribution_facts ──────────────────────────────────

/**
 * Classement réel des features pour une dimension donnée, tenant courant.
 * `sector` est conservé pour la comparaison cross-secteur (benchmarks collectifs,
 * US-009/010) ; pour l'attribution d'un seul tenant il est purement informatif.
 */
export async function topFeatures(
  tenantId: string,
  sector: string | null,
  dimension: AttributionDimension
): Promise<TopFeaturesResult> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("attribution_facts")
    .select(`${dimension}, engagement_rate, impressions`)
    .eq("tenant_id", tenantId)

  if (error) {
    log({ level: "warn", module: "attribution", action: "top_features_failed", tenant_id: tenantId, metadata: { dimension, error: error.message } })
    return { dimension, sector, rankings: [] }
  }

  // PostgREST renvoie une colonne dynamique → typage souple assumé ici.
  const rows = (data ?? []) as unknown as Array<Record<string, unknown>>
  const facts: FactRow[] = rows.map((r) => ({
    value: r[dimension],
    engagement_rate: typeof r.engagement_rate === "number" ? r.engagement_rate : null,
    impressions: typeof r.impressions === "number" ? r.impressions : null,
  }))

  return { dimension, sector, rankings: aggregateAttribution(facts) }
}
