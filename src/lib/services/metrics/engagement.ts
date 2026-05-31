/**
 * Calcul du taux d'engagement — partagé par tous les MetricsProviders.
 * engagement_rate = (likes + comments + shares + saves) / impressions, borné à [0, 1].
 */

interface EngagementCounts {
  likes: number
  comments: number
  shares: number
  saves: number
}

export function computeEngagementRate(
  counts: EngagementCounts,
  impressions: number
): number {
  if (impressions <= 0) return 0
  const interactions =
    counts.likes + counts.comments + counts.shares + counts.saves
  const rate = interactions / impressions
  // Borne haute : certaines API rapportent des impressions < interactions sur
  // de très petits volumes — on évite un taux > 1 qui fausserait l'attribution.
  return Math.min(Math.max(rate, 0), 1)
}
