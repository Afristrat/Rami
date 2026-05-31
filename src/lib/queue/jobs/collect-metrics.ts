/**
 * Worker pg-boss — Collecte de metrics (Performance Loop, MOAT-1, US-006)
 *
 * Lancé via src/instrumentation.ts. Traite les jobs COLLECT_METRICS planifiés
 * à T+1h / T+24h / T+7j par `scheduleMetricsCollection()`.
 *
 * Flux par job :
 *  1. Charger le post + ses platform_results (ID du post sur chaque plateforme)
 *  2. Pour chaque plateforme publiée avec succès :
 *     a. Charger la connexion OAuth active du tenant
 *     b. Obtenir un token valide (refresh si nécessaire)
 *     c. Router vers le bon MetricsProvider
 *     d. Insérer un snapshot dans post_metrics (si metrics disponibles)
 *  3. Retry pg-boss x3 + backoff uniquement si TOUTES les plateformes échouent
 *     pour une raison transitoire (réseau) — pas si "unavailable" (token révoqué).
 */

import { getBoss, JOBS, type CollectMetricsPayload } from "../pgboss"
import { getValidAccessToken, type OAuthConnectionRow } from "../token-refresh"
import { collectMetricsFromPlatform } from "@/lib/services/metrics"
import type { PublishResult } from "@/lib/services/publishing"
import { createServiceClient } from "@/lib/supabase/service"
import { log } from "@/lib/utils/logger"
import type { Job } from "pg-boss"

// ── Worker principal ──────────────────────────────────────────────────────────

export async function startCollectMetricsWorker(): Promise<void> {
  const boss = await getBoss()

  if (!boss) {
    log({ level: "warn", module: "collect-metrics", action: "queue_unavailable", message: "Queue indisponible — worker non démarré" })
    return
  }

  await boss.work<CollectMetricsPayload>(
    JOBS.COLLECT_METRICS,
    { batchSize: 5, localConcurrency: 5 },
    async (jobs: Job<CollectMetricsPayload>[]) => {
      await Promise.all(jobs.map((job) => processCollectMetricsJob(job.data)))
    }
  )

  log({ level: "info", module: "collect-metrics", action: "worker_started" })
}

// ── Logique de collecte ────────────────────────────────────────────────────────

async function processCollectMetricsJob(payload: CollectMetricsPayload): Promise<void> {
  const { postId, tenantId, window } = payload
  const supabase = createServiceClient()

  // 1. Charger le post + ses résultats de publication
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, tenant_id, status, platform_results")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()

  if (postError || !post) {
    log({ level: "warn", module: "collect-metrics", action: "post_not_found", tenant_id: tenantId, metadata: { postId, window } })
    return // pas de retry : le post n'existe plus
  }

  const results = (post.platform_results as Record<string, PublishResult>) ?? {}
  const publishedEntries = Object.entries(results).filter(
    ([, r]) => r?.status === "published" && r.postId
  )

  if (publishedEntries.length === 0) {
    log({ level: "info", module: "collect-metrics", action: "no_published_platform", tenant_id: tenantId, metadata: { postId, window } })
    return
  }

  let transientFailures = 0

  for (const [platform, result] of publishedEntries) {
    // a. Connexion OAuth active du tenant pour cette plateforme
    const { data: conn, error: connError } = await supabase
      .from("oauth_connections")
      .select(
        "id, platform, account_id, access_token_encrypted, refresh_token_encrypted, expires_at, is_active"
      )
      .eq("tenant_id", tenantId)
      .eq("platform", platform)
      .eq("is_active", true)
      .single()

    if (connError || !conn) {
      log({ level: "info", module: "collect-metrics", action: "no_active_connection", tenant_id: tenantId, metadata: { postId, platform, window } })
      continue
    }

    // b. Token valide
    let accessToken: string
    try {
      accessToken = await getValidAccessToken(conn as unknown as OAuthConnectionRow, supabase)
    } catch (err) {
      log({ level: "info", module: "collect-metrics", action: "token_unavailable", tenant_id: tenantId, metadata: { postId, platform, window, error: err instanceof Error ? err.message : String(err) } })
      continue // token révoqué → pas de retry, on saute cette plateforme
    }

    // c. Router vers le MetricsProvider
    const outcome = await collectMetricsFromPlatform(platform, {
      platformPostId: result.postId as string,
      accessToken,
      accountId: (conn.account_id as string) ?? undefined,
    })

    if (outcome.unavailable) {
      log({ level: "info", module: "collect-metrics", action: "metrics_unavailable", tenant_id: tenantId, metadata: { postId, platform, window, reason: outcome.reason } })
      continue
    }

    // d. Insérer un snapshot dans post_metrics
    const m = outcome.metrics
    const { error: insertError } = await supabase.from("post_metrics").insert({
      tenant_id: tenantId,
      post_id: postId,
      platform,
      impressions: m.impressions,
      likes: m.likes,
      comments: m.comments,
      shares: m.shares,
      clicks: m.clicks,
      saves: m.saves,
      engagement_rate: m.engagementRate,
      raw: { ...m.raw, window },
    })

    if (insertError) {
      transientFailures++
      log({ level: "error", module: "collect-metrics", action: "insert_failed", tenant_id: tenantId, metadata: { postId, platform, window, error: insertError.message } })
      continue
    }

    log({ level: "info", module: "collect-metrics", action: "metrics_collected", tenant_id: tenantId, metadata: { postId, platform, window, impressions: m.impressions, engagement_rate: m.engagementRate } })
  }

  // Retry pg-boss seulement si des erreurs transitoires (DB) ont eu lieu.
  if (transientFailures > 0) {
    throw new Error(`Collecte metrics : ${transientFailures} insertion(s) échouée(s) pour le post ${postId} (${window}).`)
  }
}
