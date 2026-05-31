/**
 * MetricsProvider Meta — Graph API v21 (Facebook Page posts + Instagram media).
 *
 * Deux entrées distinctes, branchées séparément dans le router :
 *  - `fetchFacebookMetrics` : post de Page FB → likes/comments/shares (summary)
 *    + insights (post_impressions, post_impressions_unique=reach, post_clicks).
 *  - `fetchInstagramMetrics` : media IG → like_count/comments_count (fields)
 *    + insights (reach, saved, shares ; impressions si encore exposé).
 *
 * Token Meta passé en query param. Token expiré (HTTP 401/403 ou error.code 190)
 * ou objet introuvable → `{ unavailable: true }` sans crash. Si les insights
 * échouent (permission), on dégrade aux compteurs publics disponibles.
 */

import type { MetricsFetchInput, MetricsResult, NormalizedMetrics } from "./types"
import { computeEngagementRate } from "./engagement"

const GRAPH_API_BASE = "https://graph.facebook.com/v21.0"

interface GraphError {
  error?: { message?: string; code?: number }
}

interface InsightsEnvelope {
  data?: Array<{ name?: string; values?: Array<{ value?: number }> }>
}

/** Extrait la valeur d'une metric d'insights par son nom. */
function insightValue(insights: InsightsEnvelope | undefined, name: string): number {
  const entry = insights?.data?.find((d) => d.name === name)
  return entry?.values?.[0]?.value ?? 0
}

/** Mappe un statut HTTP / code Meta vers un résultat indisponible, ou null. */
function unavailableFor(
  status: number,
  body: GraphError,
  platform: string
): Extract<MetricsResult, { unavailable: true }> | null {
  const code = body.error?.code
  if (status === 401 || status === 403 || code === 190 || code === 102) {
    return { unavailable: true, platform, reason: "Token Meta révoqué ou expiré." }
  }
  if (status === 404 || code === 100) {
    return { unavailable: true, platform, reason: "Objet Meta introuvable." }
  }
  return null
}

// ── Facebook ──────────────────────────────────────────────────────────────────

export async function fetchFacebookMetrics(
  input: MetricsFetchInput
): Promise<MetricsResult> {
  const { platformPostId, accessToken } = input

  if (!platformPostId) {
    return { unavailable: true, platform: "facebook", reason: "ID du post Facebook manquant." }
  }

  const url = new URL(`${GRAPH_API_BASE}/${platformPostId}`)
  url.searchParams.set(
    "fields",
    "likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_impressions_unique,post_clicks)"
  )
  url.searchParams.set("access_token", accessToken)

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
    const data = (await res.json()) as GraphError & {
      likes?: { summary?: { total_count?: number } }
      comments?: { summary?: { total_count?: number } }
      shares?: { count?: number }
      insights?: InsightsEnvelope
    }

    const unavailable = unavailableFor(res.status, data, "facebook")
    if (unavailable) return unavailable
    if (!res.ok || data.error) {
      return {
        unavailable: true,
        platform: "facebook",
        reason: `Facebook : ${data.error?.message ?? `HTTP ${res.status}`}.`,
      }
    }

    const impressions = insightValue(data.insights, "post_impressions")
    const clicks = insightValue(data.insights, "post_clicks")
    const likes = data.likes?.summary?.total_count ?? 0
    const comments = data.comments?.summary?.total_count ?? 0
    const shares = data.shares?.count ?? 0

    const metrics: NormalizedMetrics = {
      impressions,
      likes,
      comments,
      shares,
      clicks,
      saves: 0, // pas de "save" public sur un post de Page FB
      engagementRate: computeEngagementRate({ likes, comments, shares, saves: 0 }, impressions),
      raw: {
        source: "facebook_graph",
        reach: insightValue(data.insights, "post_impressions_unique"),
        insights: data.insights?.data ?? null,
      },
    }

    return { unavailable: false, platform: "facebook", metrics }
  } catch (err) {
    return {
      unavailable: true,
      platform: "facebook",
      reason: `Facebook : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}

// ── Instagram ─────────────────────────────────────────────────────────────────

export async function fetchInstagramMetrics(
  input: MetricsFetchInput
): Promise<MetricsResult> {
  const { platformPostId, accessToken } = input

  if (!platformPostId) {
    return { unavailable: true, platform: "instagram", reason: "ID du media Instagram manquant." }
  }

  try {
    // 1. Compteurs publics du media (toujours disponibles pour le propriétaire).
    const fieldsUrl = new URL(`${GRAPH_API_BASE}/${platformPostId}`)
    fieldsUrl.searchParams.set("fields", "like_count,comments_count")
    fieldsUrl.searchParams.set("access_token", accessToken)

    const fieldsRes = await fetch(fieldsUrl, { signal: AbortSignal.timeout(15000) })
    const fieldsData = (await fieldsRes.json()) as GraphError & {
      like_count?: number
      comments_count?: number
    }

    const unavailable = unavailableFor(fieldsRes.status, fieldsData, "instagram")
    if (unavailable) return unavailable
    if (!fieldsRes.ok || fieldsData.error) {
      return {
        unavailable: true,
        platform: "instagram",
        reason: `Instagram : ${fieldsData.error?.message ?? `HTTP ${fieldsRes.status}`}.`,
      }
    }

    const likes = fieldsData.like_count ?? 0
    const comments = fieldsData.comments_count ?? 0

    // 2. Insights (reach/saved/shares + impressions si exposé). Dégradation propre
    //    si la permission insights est absente : on garde likes/comments.
    let impressions = 0
    let reach = 0
    let saves = 0
    let shares = 0
    let insightsRaw: unknown = null

    const insightsUrl = new URL(`${GRAPH_API_BASE}/${platformPostId}/insights`)
    insightsUrl.searchParams.set("metric", "reach,saved,shares,impressions")
    insightsUrl.searchParams.set("access_token", accessToken)

    const insightsRes = await fetch(insightsUrl, { signal: AbortSignal.timeout(15000) })
    if (insightsRes.ok) {
      const insightsData = (await insightsRes.json()) as InsightsEnvelope
      reach = insightValue(insightsData, "reach")
      saves = insightValue(insightsData, "saved")
      shares = insightValue(insightsData, "shares")
      impressions = insightValue(insightsData, "impressions") || reach
      insightsRaw = insightsData.data ?? null
    }

    const metrics: NormalizedMetrics = {
      impressions,
      likes,
      comments,
      shares,
      clicks: 0, // non exposé pour un media organique
      saves,
      engagementRate: computeEngagementRate({ likes, comments, shares, saves }, impressions),
      raw: { source: "instagram_graph", reach, insights: insightsRaw },
    }

    return { unavailable: false, platform: "instagram", metrics }
  } catch (err) {
    return {
      unavailable: true,
      platform: "instagram",
      reason: `Instagram : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
