/**
 * Router de collecte de metrics — dispatch vers le bon provider par plateforme.
 * Performance Loop (MOAT-1). Pattern identique à `publishing/index.ts`.
 *
 * US-002 : seul Twitter est branché. US-003/004/005 ajouteront LinkedIn,
 * Meta (FB+IG) et Pinterest. US-006 enregistrera le job pg-boss qui appelle
 * `collectMetricsFromPlatform()` et upsert dans `post_metrics`.
 */

import { fetchTwitterMetrics } from "./twitter"
import type { MetricsFetchInput, MetricsResult } from "./types"

export type { MetricsFetchInput, MetricsResult, NormalizedMetrics, MetricsProvider } from "./types"
export { computeEngagementRate } from "./engagement"

export type SupportedMetricsPlatform = "twitter"

const PROVIDERS: Record<
  SupportedMetricsPlatform,
  (input: MetricsFetchInput) => Promise<MetricsResult>
> = {
  twitter: fetchTwitterMetrics,
}

/**
 * Collecte les metrics d'un post sur une plateforme donnée.
 * Retourne toujours un `MetricsResult` — jamais de throw non capturé.
 * Une plateforme non supportée renvoie `{ unavailable: true }`.
 */
export async function collectMetricsFromPlatform(
  platform: string,
  input: MetricsFetchInput
): Promise<MetricsResult> {
  const provider = PROVIDERS[platform as SupportedMetricsPlatform]

  if (!provider) {
    return {
      unavailable: true,
      platform,
      reason: `Plateforme "${platform}" non supportée pour la collecte de metrics.`,
    }
  }

  return provider(input)
}

export const SUPPORTED_METRICS_PLATFORMS = Object.keys(
  PROVIDERS
) as SupportedMetricsPlatform[]
