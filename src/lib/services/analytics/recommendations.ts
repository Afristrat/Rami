// ============================================================
// Recommandations IA analytics — dérivées de l'attribution RÉELLE (US-007)
// ============================================================
// Remplace les recommandations hardcodées (stats inventées) par des conseils
// fondés sur les performances mesurées du tenant (vue attribution_facts).
// DÉFCON 1 : si aucune dimension n'a assez d'échantillon (≥ MIN_SAMPLE_SIZE),
// aucune recommandation n'est produite (état vide honnête côté UI).
//
// Builder PUR (imports de TYPES uniquement → utilisable côté client).

import type { TopFeaturesResult, AttributionDimension } from "@/lib/services/metrics/attribution"

export type AiRecommendationType =
  | "best_hour"
  | "best_color"
  | "best_format"
  | "best_platform"
  | "best_objective"

export interface AiRecommendation {
  type: AiRecommendationType
  /** Valeur gagnante (heure, HEX, format, plateforme, objectif). */
  value: string
  /** Taux d'engagement moyen en pourcentage (1 décimale). */
  engagementPct: number
  /** Nombre de posts mesurés ayant alimenté ce classement. */
  sampleSize: number
}

const DIMENSION_TO_TYPE: Partial<Record<AttributionDimension, AiRecommendationType>> = {
  scheduled_hour: "best_hour",
  dominant_color_hex: "best_color",
  format: "best_format",
  platform: "best_platform",
  cognitive_objective: "best_objective",
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Construit jusqu'à `max` recommandations à partir des classements d'attribution.
 * Prend le top de chaque dimension exploitable (les classements sont déjà filtrés
 * par MIN_SAMPLE_SIZE en amont), puis garde les `max` au meilleur engagement.
 */
export function buildAiRecommendations(
  results: Array<TopFeaturesResult | null | undefined>,
  max = 3
): AiRecommendation[] {
  const recos: AiRecommendation[] = []
  for (const res of results) {
    if (!res) continue
    const type = DIMENSION_TO_TYPE[res.dimension]
    if (!type) continue
    const top = res.rankings[0]
    if (!top) continue
    recos.push({
      type,
      value: top.value,
      // engagement_rate est un ratio [0,1] → en pourcentage.
      engagementPct: round1(top.avgEngagement * 100),
      sampleSize: top.sampleSize,
    })
  }
  return recos.sort((a, b) => b.engagementPct - a.engagementPct).slice(0, max)
}
