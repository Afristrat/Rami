/**
 * MetricsProvider Pinterest — API v5
 * GET /v5/pins/{pin_id}/analytics?start_date&end_date&metric_types=...
 *
 * Pinterest exige une fenêtre de dates (max 90 j) et renvoie des metrics
 * agrégées dans `summary_metrics`. On normalise impressions / saves / clicks.
 * Pinterest n'a pas de "like"/"comment" classiques → likes/comments = 0.
 *
 * Token révoqué (401/403) ou pin introuvable (404) → `{ unavailable: true }`.
 */

import type { MetricsFetchInput, MetricsResult, NormalizedMetrics } from "./types"
import { computeEngagementRate } from "./engagement"

const PINTEREST_API_BASE = "https://api.pinterest.com/v5"
const WINDOW_DAYS = 30

interface PinterestAnalytics {
  code?: number
  message?: string
  // La réponse v5 imbrique souvent les metrics sous une clé de split (ex. "all").
  summary_metrics?: Record<string, number>
  all?: { summary_metrics?: Record<string, number> }
}

/** Extrait `summary_metrics`, quelle que soit l'imbrication retournée. */
function extractSummary(data: PinterestAnalytics): Record<string, number> {
  return data.summary_metrics ?? data.all?.summary_metrics ?? {}
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function fetchPinterestMetrics(
  input: MetricsFetchInput
): Promise<MetricsResult> {
  const { platformPostId, accessToken } = input

  if (!platformPostId) {
    return { unavailable: true, platform: "pinterest", reason: "ID du Pin manquant." }
  }

  const end = new Date()
  const start = new Date(end.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000)

  const url = new URL(`${PINTEREST_API_BASE}/pins/${platformPostId}/analytics`)
  url.searchParams.set("start_date", isoDate(start))
  url.searchParams.set("end_date", isoDate(end))
  url.searchParams.set("metric_types", "IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK")

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    })

    if (res.status === 401 || res.status === 403) {
      return { unavailable: true, platform: "pinterest", reason: "Token Pinterest révoqué ou scope insuffisant." }
    }
    if (res.status === 404) {
      return { unavailable: true, platform: "pinterest", reason: "Pin Pinterest introuvable." }
    }

    const data = (await res.json()) as PinterestAnalytics

    if (!res.ok || data.code) {
      return {
        unavailable: true,
        platform: "pinterest",
        reason: `Pinterest : ${data.message ?? `HTTP ${res.status}`}.`,
      }
    }

    const summary = extractSummary(data)
    const impressions = summary.IMPRESSION ?? 0
    const saves = summary.SAVE ?? 0
    const clicks = (summary.PIN_CLICK ?? 0) + (summary.OUTBOUND_CLICK ?? 0)

    const metrics: NormalizedMetrics = {
      impressions,
      likes: 0, // pas de "like" classique sur Pinterest
      comments: 0,
      shares: 0,
      clicks,
      saves,
      engagementRate: computeEngagementRate(
        { likes: 0, comments: 0, shares: 0, saves },
        impressions
      ),
      raw: { source: "pinterest_v5_analytics", summary_metrics: summary },
    }

    return { unavailable: false, platform: "pinterest", metrics }
  } catch (err) {
    return {
      unavailable: true,
      platform: "pinterest",
      reason: `Pinterest : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
