/**
 * MetricsProvider LinkedIn — REST API v2
 *
 * Deux chemins selon l'auteur du post (stocké dans `accountId` = author URN) :
 *
 *  1. Organisation (`urn:li:organization:XXX`) → organizationalEntityShareStatistics
 *     expose impressions / likes / comments / shares / clicks / engagement réels.
 *     Nécessite le scope `r_organization_social` + admin de la page.
 *
 *  2. Membre (`urn:li:person:XXX`) → socialActions/{shareUrn}
 *     expose likes + comments. Les impressions/shares d'un post de membre ne
 *     sont PAS exposées par l'API LinkedIn → laissées à 0 (donnée honnête, pas
 *     d'estimation inventée). engagement_rate vaut alors 0 (impressions = 0).
 *
 * Absence de scope / permission → `{ unavailable: true }` sans crash.
 */

import type { MetricsFetchInput, MetricsResult, NormalizedMetrics } from "./types"
import { computeEngagementRate } from "./engagement"

const LINKEDIN_API_BASE = "https://api.linkedin.com/v2"
const LINKEDIN_HEADERS_BASE = { "X-Restli-Protocol-Version": "2.0.0" }

export async function fetchLinkedInMetrics(
  input: MetricsFetchInput
): Promise<MetricsResult> {
  const { platformPostId, accessToken, accountId } = input

  if (!platformPostId) {
    return {
      unavailable: true,
      platform: "linkedin",
      reason: "URN du post LinkedIn manquant.",
    }
  }

  const isOrganization = (accountId ?? "").includes("urn:li:organization:")

  try {
    return isOrganization
      ? await fetchOrganizationStats(platformPostId, accessToken, accountId as string)
      : await fetchMemberSocialActions(platformPostId, accessToken)
  } catch (err) {
    return {
      unavailable: true,
      platform: "linkedin",
      reason: `LinkedIn : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}

// ── Chemin organisation : statistiques complètes ──────────────────────────────

async function fetchOrganizationStats(
  shareUrn: string,
  accessToken: string,
  orgUrn: string
): Promise<MetricsResult> {
  const url = new URL(`${LINKEDIN_API_BASE}/organizationalEntityShareStatistics`)
  url.searchParams.set("q", "organizationalEntity")
  url.searchParams.set("organizationalEntity", orgUrn)
  url.searchParams.set("shares[0]", shareUrn)

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, ...LINKEDIN_HEADERS_BASE },
    signal: AbortSignal.timeout(15000),
  })

  const unavailable = handleCommonStatuses(res.status)
  if (unavailable) return unavailable
  if (!res.ok) {
    return { unavailable: true, platform: "linkedin", reason: `LinkedIn API HTTP ${res.status}.` }
  }

  const data: unknown = await res.json()
  const element = (data as { elements?: Array<Record<string, unknown>> })?.elements?.[0]
  const totals = (element?.totalShareStatistics ?? {}) as {
    impressionCount?: number
    likeCount?: number
    commentCount?: number
    shareCount?: number
    clickCount?: number
  }

  const impressions = totals.impressionCount ?? 0
  const likes = totals.likeCount ?? 0
  const comments = totals.commentCount ?? 0
  const shares = totals.shareCount ?? 0
  const clicks = totals.clickCount ?? 0

  const metrics: NormalizedMetrics = {
    impressions,
    likes,
    comments,
    shares,
    clicks,
    saves: 0, // LinkedIn n'expose pas de "save"
    engagementRate: computeEngagementRate({ likes, comments, shares, saves: 0 }, impressions),
    raw: { source: "organizationalEntityShareStatistics", totalShareStatistics: totals },
  }

  return { unavailable: false, platform: "linkedin", metrics }
}

// ── Chemin membre : likes + comments via socialActions ────────────────────────

async function fetchMemberSocialActions(
  shareUrn: string,
  accessToken: string
): Promise<MetricsResult> {
  const url = `${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(shareUrn)}`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, ...LINKEDIN_HEADERS_BASE },
    signal: AbortSignal.timeout(15000),
  })

  const unavailable = handleCommonStatuses(res.status)
  if (unavailable) return unavailable
  if (!res.ok) {
    return { unavailable: true, platform: "linkedin", reason: `LinkedIn API HTTP ${res.status}.` }
  }

  const data = (await res.json()) as {
    likesSummary?: { totalLikes?: number; aggregatedTotalLikes?: number }
    commentsSummary?: { count?: number; aggregatedTotalComments?: number }
  }

  const likes = data.likesSummary?.totalLikes ?? data.likesSummary?.aggregatedTotalLikes ?? 0
  const comments = data.commentsSummary?.aggregatedTotalComments ?? data.commentsSummary?.count ?? 0

  const metrics: NormalizedMetrics = {
    impressions: 0, // non exposé pour un post de membre
    likes,
    comments,
    shares: 0,
    clicks: 0,
    saves: 0,
    engagementRate: 0, // impressions inconnues → 0
    raw: {
      source: "socialActions",
      likesSummary: data.likesSummary ?? null,
      commentsSummary: data.commentsSummary ?? null,
    },
  }

  return { unavailable: false, platform: "linkedin", metrics }
}

// ── Helper : 401/403/404 → indisponible (token révoqué, scope absent) ─────────

function handleCommonStatuses(
  status: number
): Extract<MetricsResult, { unavailable: true }> | null {
  if (status === 401 || status === 403) {
    return {
      unavailable: true,
      platform: "linkedin",
      reason: "Token LinkedIn révoqué ou scope insuffisant.",
    }
  }
  if (status === 404) {
    return { unavailable: true, platform: "linkedin", reason: "Post LinkedIn introuvable." }
  }
  return null
}
