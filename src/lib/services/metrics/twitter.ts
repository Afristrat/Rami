/**
 * MetricsProvider Twitter / X — API v2
 * GET /2/tweets/:id?tweet.fields=public_metrics,non_public_metrics,organic_metrics
 *
 * `public_metrics` est toujours disponible pour les tweets accessibles.
 * `non_public_metrics` / `organic_metrics` ne sont retournés que pour les
 * tweets dont le token est propriétaire et < 30 jours — on les utilise en
 * complément (clics, impressions privées) mais on dégrade proprement s'ils
 * sont absents.
 */

import type { MetricsFetchInput, MetricsResult } from "./types"
import { computeEngagementRate } from "./engagement"

const TWITTER_API_BASE = "https://api.twitter.com/2"

interface TwitterPublicMetrics {
  retweet_count?: number
  reply_count?: number
  like_count?: number
  quote_count?: number
  bookmark_count?: number
  impression_count?: number
}

interface TwitterNonPublicMetrics {
  impression_count?: number
  url_link_clicks?: number
  user_profile_clicks?: number
}

export async function fetchTwitterMetrics(
  input: MetricsFetchInput
): Promise<MetricsResult> {
  const { platformPostId, accessToken } = input

  const url = new URL(`${TWITTER_API_BASE}/tweets/${platformPostId}`)
  url.searchParams.set(
    "tweet.fields",
    "public_metrics,non_public_metrics,organic_metrics"
  )

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    })

    // Token révoqué/expiré ou accès interdit → indisponible, pas un crash.
    if (res.status === 401 || res.status === 403) {
      return {
        unavailable: true,
        platform: "twitter",
        reason: "Token Twitter révoqué ou permissions insuffisantes.",
      }
    }

    // Tweet supprimé ou introuvable.
    if (res.status === 404) {
      return {
        unavailable: true,
        platform: "twitter",
        reason: "Tweet introuvable (supprimé ?).",
      }
    }

    if (!res.ok) {
      return {
        unavailable: true,
        platform: "twitter",
        reason: `Twitter API HTTP ${res.status}.`,
      }
    }

    const data: unknown = await res.json()
    const tweet = (data as { data?: Record<string, unknown> })?.data

    if (!tweet) {
      return {
        unavailable: true,
        platform: "twitter",
        reason: "Réponse Twitter sans données de tweet.",
      }
    }

    const pub = (tweet.public_metrics ?? {}) as TwitterPublicMetrics
    const nonPub = (tweet.non_public_metrics ?? {}) as TwitterNonPublicMetrics

    const impressions =
      pub.impression_count ?? nonPub.impression_count ?? 0
    const likes = pub.like_count ?? 0
    const comments = pub.reply_count ?? 0
    const shares = (pub.retweet_count ?? 0) + (pub.quote_count ?? 0)
    const saves = pub.bookmark_count ?? 0
    const clicks = nonPub.url_link_clicks ?? 0

    return {
      unavailable: false,
      platform: "twitter",
      metrics: {
        impressions,
        likes,
        comments,
        shares,
        clicks,
        saves,
        engagementRate: computeEngagementRate(
          { likes, comments, shares, saves },
          impressions
        ),
        raw: {
          public_metrics: pub,
          non_public_metrics: nonPub,
          organic_metrics: tweet.organic_metrics ?? null,
        },
      },
    }
  } catch (err) {
    // Timeout ou erreur réseau → indisponible, jamais de throw remontant.
    return {
      unavailable: true,
      platform: "twitter",
      reason: `Twitter : ${err instanceof Error ? err.message : "Erreur réseau"}`,
    }
  }
}
