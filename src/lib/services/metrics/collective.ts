/**
 * Agrégation des benchmarks collectifs (intelligence collective — US-010, MOAT-1).
 *
 * Fonctions PURES (testables) : aucun accès DB, aucun effet de bord. Le job
 * `collective-aggregate` orchestre la lecture/écriture via le service client.
 *
 * Garde-fou k-anonymity : une combinaison (secteur, culture, plateforme) ne
 * produit un benchmark QUE si ≥ K_ANONYMITY_MIN tenants distincts y contribuent.
 * Ce filtre s'applique AVANT tout INSERT — le CHECK SQL (US-009) reste le
 * garde-fou structurel de dernier recours.
 *
 * Méthode « moyenne des moyennes-tenant » : on calcule d'abord la moyenne par
 * tenant, puis la moyenne de ces moyennes. Ainsi un gros tenant (beaucoup de
 * posts) ne domine pas l'agrégat — chaque marque pèse pareil.
 */

/** Seuil k-anonymity : nb minimal de tenants distincts par bucket. */
export const K_ANONYMITY_MIN = 5

/** Metrics produites par l'agrégation collective. */
export const COLLECTIVE_METRICS = ["avg_engagement", "avg_impressions"] as const
export type CollectiveMetric = (typeof COLLECTIVE_METRICS)[number]

/** Snapshot metrics d'un post (dernier par post×plateforme) d'un tenant. */
export interface MetricFact {
  platform: string
  engagement_rate: number | null
  impressions: number | null
}

/** Stats agrégées d'UN tenant sur UNE plateforme (moyennes de ses posts). */
export interface TenantPlatformStat {
  tenantId: string
  sector: string
  culture: string
  platform: string
  avgEngagement: number
  avgImpressions: number
}

/** Ligne de benchmark collectif prête à l'upsert. */
export interface CollectiveRow {
  sector: string
  culture: string
  platform: string
  metric: CollectiveMetric
  value: number
  sampleSize: number
}

/**
 * Clé canonique d'un benchmark (mêmes dimensions que l'index unique SQL).
 * JSON.stringify évite toute collision de séparateur entre dimensions.
 */
export function benchmarkKey(dims: {
  sector: string
  culture: string
  platform: string
  metric: string
}): string {
  return JSON.stringify([dims.sector, dims.culture, dims.platform, dims.metric])
}

/**
 * Moyennes par plateforme des facts d'UN tenant.
 * Émet une stat par plateforme où le tenant a au moins une mesure exploitable.
 */
export function computeTenantPlatformStats(
  tenantId: string,
  sector: string,
  culture: string,
  facts: MetricFact[]
): TenantPlatformStat[] {
  const byPlatform = new Map<string, { eng: number[]; imp: number[] }>()

  for (const f of facts) {
    const bucket = byPlatform.get(f.platform) ?? { eng: [], imp: [] }
    if (typeof f.engagement_rate === "number") bucket.eng.push(f.engagement_rate)
    if (typeof f.impressions === "number") bucket.imp.push(f.impressions)
    byPlatform.set(f.platform, bucket)
  }

  const out: TenantPlatformStat[] = []
  for (const [platform, bucket] of byPlatform) {
    // Pas de mesure exploitable → pas de stat (le tenant ne contribue pas).
    if (bucket.eng.length === 0 && bucket.imp.length === 0) continue
    out.push({
      tenantId,
      sector,
      culture,
      platform,
      avgEngagement: mean(bucket.eng),
      avgImpressions: mean(bucket.imp),
    })
  }
  return out
}

/**
 * Agrège les stats par tenant en benchmarks collectifs.
 * Une ligne n'est émise QUE si ≥ K_ANONYMITY_MIN tenants distincts contribuent
 * au bucket (secteur, culture, plateforme).
 */
export function aggregateCollective(stats: TenantPlatformStat[]): CollectiveRow[] {
  const buckets = new Map<string, TenantPlatformStat[]>()
  for (const stat of stats) {
    const key = JSON.stringify([stat.sector, stat.culture, stat.platform])
    const arr = buckets.get(key) ?? []
    arr.push(stat)
    buckets.set(key, arr)
  }

  const rows: CollectiveRow[] = []
  for (const arr of buckets.values()) {
    // Un tenant ne compte qu'une fois par bucket (dédup défensif).
    const distinct = new Map<string, TenantPlatformStat>()
    for (const stat of arr) distinct.set(stat.tenantId, stat)

    const sampleSize = distinct.size
    if (sampleSize < K_ANONYMITY_MIN) continue // k-anonymity : bucket trop petit

    const tenantStats = Array.from(distinct.values())
    const { sector, culture, platform } = tenantStats[0]

    rows.push({
      sector,
      culture,
      platform,
      metric: "avg_engagement",
      value: mean(tenantStats.map((s) => s.avgEngagement)),
      sampleSize,
    })
    rows.push({
      sector,
      culture,
      platform,
      metric: "avg_impressions",
      value: mean(tenantStats.map((s) => s.avgImpressions)),
      sampleSize,
    })
  }
  return rows
}

/** Moyenne arithmétique ; 0 sur une liste vide (aucune donnée connue). */
function mean(xs: number[]): number {
  if (xs.length === 0) return 0
  return xs.reduce((acc, x) => acc + x, 0) / xs.length
}
