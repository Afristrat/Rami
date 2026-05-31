/**
 * Types partagés pour les services de collecte de metrics RAMI.
 * Performance Loop (MOAT-1) — chaque plateforme expose un MetricsProvider
 * qui normalise ses metrics vers la forme commune `NormalizedMetrics`,
 * directement insérable dans la table `post_metrics`.
 */

/**
 * Metrics normalisées, alignées sur les colonnes de `post_metrics`.
 * Les compteurs sont des entiers ≥ 0 ; `engagementRate` est un ratio 0–1.
 */
export interface NormalizedMetrics {
  impressions: number
  likes: number
  comments: number
  shares: number
  clicks: number
  saves: number
  engagementRate: number
  /** Réponse brute (normalisée) de l'API plateforme, stockée pour audit/debug. */
  raw: Record<string, unknown>
}

/**
 * Entrée d'une collecte : l'identifiant du post sur la plateforme
 * (ex. tweet id) + un access token déjà valide (résolu via `getValidToken()`).
 */
export interface MetricsFetchInput {
  /** ID du post sur la plateforme (PAS l'id du post RAMI). */
  platformPostId: string
  /** Access token valide pour l'appel API. */
  accessToken: string
  /** ID du compte sur la plateforme (requis par certaines API analytics). */
  accountId?: string
}

/**
 * Résultat d'une collecte. `unavailable: true` couvre tous les cas où la
 * metric ne peut être récupérée sans que ce soit une erreur fatale :
 * token révoqué, post supprimé, endpoint indisponible. Jamais de throw.
 */
export type MetricsResult =
  | { unavailable: false; platform: string; metrics: NormalizedMetrics }
  | { unavailable: true; platform: string; reason: string }

/** Contrat commun à tous les providers de metrics. */
export interface MetricsProvider {
  fetchMetrics(input: MetricsFetchInput): Promise<MetricsResult>
}
