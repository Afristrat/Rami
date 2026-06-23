/**
 * Worker pg-boss — Publication des posts planifiés
 *
 * Ce worker est lancé via src/instrumentation.ts (Next.js).
 * Il traite les jobs PUBLISH_POST un par un.
 *
 * Flux par job :
 *  1. Charger le post depuis la DB
 *  2. Vérifier statut (évite double-publication)
 *  3. Passer en statut "publishing"
 *  4. Pour chaque plateforme : récupérer le token OAuth + publier
 *  5. Mettre à jour platform_results + statut final
 *
 * Conforme SOP-004 + CLAUDE.md Section 2.1
 */

import { getBoss, JOBS, scheduleMetricsCollection, type PublishPostPayload } from "./pgboss"
import { publishToPlatform } from "@/lib/services/publishing"
import type { PublishResult } from "@/lib/services/publishing"
import type { Job } from "pg-boss"
import { getValidAccessToken } from "./token-refresh"
import { createServiceClient } from "@/lib/supabase/service"
import { log } from "@/lib/utils/logger"
import { captureServerEvent } from "@/lib/utils/posthog-server"
import { isHumanApproved } from "@/lib/services/workflow/publish-gate"

// ── Worker principal ──────────────────────────────────────────────────────────

export async function startPublishWorker(): Promise<void> {
  const boss = await getBoss()

  if (!boss) {
    log({ level: "warn", module: "publish-worker", action: "queue_unavailable", message: "Queue indisponible — worker non démarré" })
    return
  }

  // pg-boss v12 : le handler reçoit un tableau de jobs (batch)
  await boss.work<PublishPostPayload>(
    JOBS.PUBLISH_POST,
    { batchSize: 5, localConcurrency: 5 },
    async (jobs: Job<PublishPostPayload>[]) => {
      await Promise.all(
        jobs.map((job) => {
          const { postId, tenantId } = job.data
          log({ level: "info", module: "publish-worker", action: "job_start", tenant_id: tenantId, metadata: { jobId: job.id, postId } })
          return processPublishJob(postId, tenantId, job.id)
        })
      )
    }
  )

  log({ level: "info", module: "publish-worker", action: "worker_started" })
}

// ── Logique de publication ────────────────────────────────────────────────────

async function processPublishJob(
  postId: string,
  tenantId: string,
  jobId: string
): Promise<void> {
  const supabase = createServiceClient()

  // 1. Charger le post
  const { data: post, error: postError } = await supabase
    .from("posts")
    .select("id, tenant_id, content, platforms, status, media_urls, platform_results, approved_by, approved_at")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()

  if (postError || !post) {
    log({ level: "error", module: "publish-worker", action: "post_not_found", tenant_id: tenantId, metadata: { postId, error: postError?.message } })
    // On ne throw pas → pg-boss marque le job comme failed après retries
    throw new Error(`Post ${postId} introuvable en DB`)
  }

  // 2. Vérifier le statut — éviter double-publication
  if (post.status === "published") {
    log({ level: "info", module: "publish-worker", action: "skip_already_published", tenant_id: tenantId, metadata: { postId } })
    return
  }

  if (post.status === "failed" || post.status === "draft") {
    // Statuts terminaux — on ne retente pas sans action utilisateur
    log({ level: "info", module: "publish-worker", action: "skip_terminal_status", tenant_id: tenantId, metadata: { postId, status: post.status } })
    return
  }

  // Backstop : un job programmé périmé ne doit jamais publier un contenu dont
  // l'approbation a été réinitialisée (ex. contenu réédité après planification).
  if (!isHumanApproved({ approved_by: post.approved_by, approved_at: post.approved_at })) {
    log({ level: "warn", module: "publish-worker", action: "skip_not_human_approved", tenant_id: tenantId, metadata: { postId } })
    await supabase
      .from("posts")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", postId)
    return
  }

  // 3. Passer en "publishing" (indempotent si déjà en cours)
  await supabase
    .from("posts")
    .update({ status: "publishing", updated_at: new Date().toISOString() })
    .eq("id", postId)

  // 4. Publier sur chaque plateforme
  const platforms: string[] = post.platforms ?? []
  const mediaUrls: string[] = post.media_urls ?? []
  const existingResults: Record<string, PublishResult> =
    (post.platform_results as Record<string, PublishResult>) ?? {}

  const results: Record<string, PublishResult> = { ...existingResults }

  for (const platform of platforms) {
    // Skip si déjà publié sur cette plateforme (retry partiel)
    if (results[platform]?.status === "published") {
      continue
    }

    // Charger la connexion OAuth pour ce tenant + plateforme
    const { data: conn, error: connError } = await supabase
      .from("oauth_connections")
      .select(
        "id, platform, account_id, account_name, access_token_encrypted, refresh_token_encrypted, expires_at, is_active"
      )
      .eq("tenant_id", tenantId)
      .eq("platform", platform)
      .eq("is_active", true)
      .single()

    if (connError || !conn) {
      results[platform] = {
        platform,
        status: "failed",
        error: `${capitalize(platform)} : aucune connexion OAuth active. Connectez votre compte dans Réglages → Connexions.`,
      }
      continue
    }

    // Vérifier et rafraîchir le token si nécessaire
    let accessToken: string
    try {
      accessToken = await getValidAccessToken(conn, supabase)
    } catch (err) {
      results[platform] = {
        platform,
        status: "failed",
        error: `${capitalize(platform)} : ${err instanceof Error ? err.message : "Token invalide"}`,
      }
      // Désactiver la connexion si token révoqué
      await supabase
        .from("oauth_connections")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", conn.id)
      continue
    }

    // Publier
    const result = await publishToPlatform(platform, {
      accessToken,
      content: post.content,
      mediaUrls,
      accountId: conn.account_id as string,
      accountName: conn.account_name as string,
    })

    results[platform] = result

    if (result.status === "failed") {
      log({ level: "warn", module: "publish-worker", action: "platform_failed", tenant_id: tenantId, metadata: { postId, platform, error: result.error } })
    } else {
      log({ level: "info", module: "publish-worker", action: "platform_published", tenant_id: tenantId, metadata: { postId, platform, platformPostId: result.postId } })
    }
  }

  // 5. Calculer le statut final
  const allResults = Object.values(results)
  const hasSuccess = allResults.some((r) => r.status === "published")
  const hasFailure = allResults.some((r) => r.status === "failed")

  let finalStatus: string
  if (hasSuccess && !hasFailure) {
    finalStatus = "published"
  } else if (hasSuccess && hasFailure) {
    // Publication partielle — on marque "published" avec les erreurs dans platform_results
    finalStatus = "published"
  } else {
    // Tout échoué — pg-boss va retenter le job (jusqu'à retryLimit = 3)
    finalStatus = "failed"
  }

  // 6. Mettre à jour en DB
  const now = new Date().toISOString()
  await supabase
    .from("posts")
    .update({
      status: finalStatus,
      platform_results: results,
      published_at: hasSuccess ? now : null,
      updated_at: now,
      // Stocker le jobId pour traçabilité
      ai_metadata: {
        ...(post as Record<string, unknown>),
        last_job_id: jobId,
        last_publish_attempt: now,
      },
    })
    .eq("id", postId)

  // PostHog — post_published (ou post_failed)
  captureServerEvent({
    distinctId: tenantId,
    event: finalStatus === "published" ? "post_published" : "post_failed",
    properties: {
      tenant_id: tenantId,
      post_id: postId,
      platforms,
      platform_count: platforms.length,
      success_count: allResults.filter((r) => r.status === "published").length,
      failure_count: allResults.filter((r) => r.status === "failed").length,
    },
  })

  // 7. Si tout a échoué → throw pour déclencher le retry pg-boss
  if (finalStatus === "failed") {
    const errorSummary = allResults
      .filter((r) => r.status === "failed")
      .map((r) => r.error)
      .join(" | ")

    throw new Error(`Publication échouée sur toutes les plateformes : ${errorSummary}`)
  }

  // 8. Performance Loop (US-006) — planifier la collecte de metrics (T+1h/24h/7j).
  //    Best-effort : si la queue est indisponible, on ne fait pas échouer la publication.
  try {
    await scheduleMetricsCollection({ postId, tenantId })
  } catch (err) {
    log({ level: "warn", module: "publish-worker", action: "metrics_schedule_failed", tenant_id: tenantId, metadata: { postId, error: err instanceof Error ? err.message : String(err) } })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
