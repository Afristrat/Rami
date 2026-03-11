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

import { getBoss, JOBS, type PublishPostPayload } from "./pgboss"
import { publishToPlatform } from "@/lib/services/publishing"
import type { PublishResult } from "@/lib/services/publishing"
import type { Job } from "pg-boss"
import { decryptToken } from "@/lib/services/oauth/state"
import { createServiceClient } from "@/lib/supabase/service"

// ── Worker principal ──────────────────────────────────────────────────────────

export async function startPublishWorker(): Promise<void> {
  const boss = await getBoss()

  // pg-boss v12 : le handler reçoit un tableau de jobs (batch)
  await boss.work<PublishPostPayload>(
    JOBS.PUBLISH_POST,
    { batchSize: 5, localConcurrency: 5 },
    async (jobs: Job<PublishPostPayload>[]) => {
      await Promise.all(
        jobs.map((job) => {
          const { postId, tenantId } = job.data
          console.log(`[publish-worker] Job ${job.id} — post ${postId} (tenant ${tenantId})`)
          return processPublishJob(postId, tenantId, job.id)
        })
      )
    }
  )

  console.log("[publish-worker] Worker démarré — en écoute des jobs publish-post")
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
    .select("id, tenant_id, content, platforms, status, media_urls, platform_results")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()

  if (postError || !post) {
    console.error(`[publish-worker] Post ${postId} introuvable :`, postError)
    // On ne throw pas → pg-boss marque le job comme failed après retries
    throw new Error(`Post ${postId} introuvable en DB`)
  }

  // 2. Vérifier le statut — éviter double-publication
  if (post.status === "published") {
    console.log(`[publish-worker] Post ${postId} déjà publié — skip`)
    return
  }

  if (post.status === "failed" || post.status === "draft") {
    // Statuts terminaux — on ne retente pas sans action utilisateur
    console.log(`[publish-worker] Post ${postId} en statut "${post.status}" — skip`)
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
      console.warn(
        `[publish-worker] Échec publication ${platform} pour post ${postId} : ${result.error}`
      )
    } else {
      console.log(
        `[publish-worker] Publié sur ${platform} — postId: ${result.postId}`
      )
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

  // 7. Si tout a échoué → throw pour déclencher le retry pg-boss
  if (finalStatus === "failed") {
    const errorSummary = allResults
      .filter((r) => r.status === "failed")
      .map((r) => r.error)
      .join(" | ")

    throw new Error(`Publication échouée sur toutes les plateformes : ${errorSummary}`)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const REFRESH_THRESHOLD_MS = 5 * 60 * 1000

async function getValidAccessToken(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  conn: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any
): Promise<string> {
  const expiresAt = conn.expires_at ? new Date(conn.expires_at as string) : null
  const needsRefresh =
    expiresAt !== null && expiresAt.getTime() - Date.now() < REFRESH_THRESHOLD_MS

  if (!needsRefresh) {
    return decryptToken(conn.access_token_encrypted as string)
  }

  if (!conn.refresh_token_encrypted) {
    throw new Error("Token expiré et aucun refresh token disponible. Reconnectez le compte.")
  }

  // Import dynamique pour éviter la dépendance circulaire
  const { getOAuthConfig } = await import("@/lib/services/oauth/config")
  const { encryptToken } = await import("@/lib/services/oauth/state")

  const config = getOAuthConfig(conn.platform)
  const clientId = process.env[config.clientIdEnv]
  const clientSecret = process.env[config.clientSecretEnv]

  if (!clientId || !clientSecret) {
    throw new Error(`Credentials OAuth manquants pour ${conn.platform}.`)
  }

  const refreshToken = decryptToken(conn.refresh_token_encrypted as string)

  const res = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!res.ok) {
    throw new Error(`Refresh token révoqué. Reconnectez le compte ${conn.platform}.`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenData: any = await res.json()
  const newAccessToken: string = tokenData.access_token
  const newRefreshToken: string | undefined = tokenData.refresh_token
  const expiresIn: number | undefined = tokenData.expires_in

  const newExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000).toISOString()
    : null

  await supabase
    .from("oauth_connections")
    .update({
      access_token_encrypted: encryptToken(newAccessToken),
      ...(newRefreshToken && {
        refresh_token_encrypted: encryptToken(newRefreshToken),
      }),
      expires_at: newExpiresAt,
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conn.id)

  return newAccessToken
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
