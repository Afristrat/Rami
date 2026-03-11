/**
 * Singleton pg-boss — Queue Postgres-native pour RAMI
 * Conforme SOP-004 : scheduling via pg-boss avec job singletonKey par postId
 *
 * Connexion : tente SUPABASE_DB_URL_POOLER (session mode, IPv4) en premier,
 * puis SUPABASE_DB_URL (direct, potentiellement IPv6) en fallback.
 * pg-boss requiert le mode SESSION (pas TRANSACTION) — les advisory locks
 * et prepared statements ne sont pas compatibles avec le mode transaction.
 *
 * Si la DB est indisponible, le module dégrade gracieusement :
 * getBoss() retourne null et les fonctions enqueue/cancel sont no-op.
 */

import { PgBoss } from "pg-boss"

// ── Noms de jobs ──────────────────────────────────────────────────────────────

export const JOBS = {
  PUBLISH_POST: "publish-post",
} as const

// ── Payload du job publish-post ───────────────────────────────────────────────

export interface PublishPostPayload {
  postId: string
  tenantId: string
}

// ── Singleton pg-boss ─────────────────────────────────────────────────────────

let bossInstance: PgBoss | null = null
let initializationFailed = false

/**
 * Résout la chaîne de connexion à utiliser.
 * Priorité : SUPABASE_DB_URL_POOLER (session mode IPv4) → SUPABASE_DB_URL (direct).
 * Le pooler session mode est préféré car il utilise IPv4 et est compatible
 * avec les advisory locks et les prepared statements requis par pg-boss.
 */
function resolveConnectionString(): string | null {
  // Mode session pooler IPv4 — format :
  // postgresql://postgres.[project-id]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
  const poolerUrl = process.env.SUPABASE_DB_URL_POOLER
  if (poolerUrl) return poolerUrl

  // Connexion directe (peut être IPv6 selon l'hébergeur)
  const directUrl = process.env.SUPABASE_DB_URL
  if (directUrl) return directUrl

  return null
}

export async function getBoss(): Promise<PgBoss | null> {
  // Déjà initialisé
  if (bossInstance) return bossInstance

  // Échec précédent — ne pas retenter indéfiniment
  if (initializationFailed) return null

  const connectionString = resolveConnectionString()
  if (!connectionString) {
    console.warn(
      "[pg-boss] SUPABASE_DB_URL_POOLER et SUPABASE_DB_URL sont absents — " +
        "la queue est désactivée. Les posts programmés ne seront pas traités."
    )
    initializationFailed = true
    return null
  }

  try {
    const boss = new PgBoss({
      connectionString,
      // Monitoring toutes les 30 secondes
      monitorIntervalSeconds: 30,
      // Maintenance toutes les 2 minutes
      maintenanceIntervalSeconds: 120,
      // Délai de connexion : 10 secondes
      connectionTimeoutMillis: 10_000,
    })

    boss.on("error", (error: Error) => {
      console.error("[pg-boss] Erreur interne :", error.message)
    })

    await boss.start()
    bossInstance = boss

    const urlType = process.env.SUPABASE_DB_URL_POOLER
      ? "pooler session (IPv4)"
      : "direct (IPv6 possible)"
    console.info(`[pg-boss] Démarré via connexion ${urlType}`)

    return boss
  } catch (error) {
    initializationFailed = true
    const msg = error instanceof Error ? error.message : String(error)
    console.error(
      `[pg-boss] Impossible de démarrer — queue désactivée. Raison : ${msg}`
    )
    return null
  }
}

/**
 * Enqueue un job de publication immédiate.
 * singletonKey = postId → un seul job en attente par post.
 * Retourne null si la queue est indisponible (fallback gracieux).
 */
export async function enqueuePublish(
  payload: PublishPostPayload
): Promise<string | null> {
  const boss = await getBoss()
  if (!boss) {
    console.warn(
      `[pg-boss] Queue indisponible — enqueuePublish ignoré pour post ${payload.postId}`
    )
    return null
  }

  return boss.send(JOBS.PUBLISH_POST, payload, {
    singletonKey: `publish:${payload.postId}`,
    retryLimit: 3,
    retryDelay: 60, // secondes entre les retries
    retryBackoff: true, // exponentiel : 60s, 120s, 240s
    expireInSeconds: 600, // timeout d'exécution : 10 minutes
    priority: 0,
  })
}

/**
 * Enqueue un job de publication programmée (scheduled_at).
 * Retourne null si la queue est indisponible (fallback gracieux).
 */
export async function enqueueScheduledPublish(
  payload: PublishPostPayload,
  scheduledAt: Date
): Promise<string | null> {
  const boss = await getBoss()
  if (!boss) {
    console.warn(
      `[pg-boss] Queue indisponible — enqueueScheduledPublish ignoré pour post ${payload.postId}`
    )
    return null
  }

  return boss.send(JOBS.PUBLISH_POST, payload, {
    singletonKey: `publish:${payload.postId}`,
    startAfter: scheduledAt,
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    expireInSeconds: 600,
    priority: 0,
  })
}

/**
 * Annule un job en attente via son jobId (stocké en posts.queue_job_id).
 * No-op si la queue est indisponible.
 */
export async function cancelPublishJob(jobId: string): Promise<void> {
  const boss = await getBoss()
  if (!boss) {
    console.warn(
      `[pg-boss] Queue indisponible — cancelPublishJob ignoré pour job ${jobId}`
    )
    return
  }

  await boss.cancel(JOBS.PUBLISH_POST, jobId)
}
