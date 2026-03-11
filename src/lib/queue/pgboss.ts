/**
 * Singleton pg-boss — Queue Postgres-native pour RAMI
 * Conforme SOP-004 : scheduling via pg-boss avec job singletonKey par postId
 *
 * pg-boss crée ses propres tables dans le schéma "pgboss" de la DB Supabase.
 * Connexion via SUPABASE_DB_URL (service role, pas de RLS pour le worker).
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

export async function getBoss(): Promise<PgBoss> {
  if (bossInstance) return bossInstance

  const connectionString = process.env.SUPABASE_DB_URL
  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL manquant — impossible d'initialiser pg-boss")
  }

  const boss = new PgBoss({
    connectionString,
    // Monitoring toutes les 30 secondes
    monitorIntervalSeconds: 30,
    // Maintenance toutes les 2 minutes
    maintenanceIntervalSeconds: 120,
  })

  boss.on("error", (error: Error) => {
    console.error("[pg-boss] Erreur interne :", error)
  })

  await boss.start()
  bossInstance = boss

  return boss
}

/**
 * Enqueue un job de publication immédiate.
 * singletonKey = postId → un seul job en attente par post.
 */
export async function enqueuePublish(payload: PublishPostPayload): Promise<string | null> {
  const boss = await getBoss()

  const jobId = await boss.send(JOBS.PUBLISH_POST, payload, {
    singletonKey: `publish:${payload.postId}`,
    retryLimit: 3,
    retryDelay: 60, // secondes entre les retries
    retryBackoff: true, // exponentiel : 60s, 120s, 240s
    expireInSeconds: 600, // timeout d'exécution : 10 minutes
    priority: 0,
  })

  return jobId
}

/**
 * Enqueue un job de publication programmée (scheduled_at).
 */
export async function enqueueScheduledPublish(
  payload: PublishPostPayload,
  scheduledAt: Date
): Promise<string | null> {
  const boss = await getBoss()

  const jobId = await boss.send(JOBS.PUBLISH_POST, payload, {
    singletonKey: `publish:${payload.postId}`,
    startAfter: scheduledAt,
    retryLimit: 3,
    retryDelay: 60,
    retryBackoff: true,
    expireInSeconds: 600,
    priority: 0,
  })

  return jobId
}

/**
 * Annule un job en attente via son jobId (stocké en posts.queue_job_id).
 */
export async function cancelPublishJob(jobId: string): Promise<void> {
  const boss = await getBoss()
  await boss.cancel(JOBS.PUBLISH_POST, jobId)
}
