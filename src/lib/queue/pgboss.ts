/**
 * Singleton pg-boss — Queue Postgres-native pour RAMI
 * Conforme SOP-004 : scheduling via pg-boss avec job singletonKey par postId
 *
 * pg-boss crée ses propres tables dans le schéma "pgboss" de la DB Supabase.
 *
 * Stratégie de connexion (ordre de priorité) :
 *  1. SUPABASE_DB_POOLER_URL  — connection pooler Supabase (IPv4, recommandé en production)
 *  2. SUPABASE_DB_URL          — connexion directe (IPv6, pour migrations locales)
 *
 * Le pooler Supabase utilise pgBouncer en mode "transaction", compatible avec pg-boss.
 * URL format pooler : postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
 */

import { PgBoss } from "pg-boss"
import { log } from "@/lib/utils/logger"

// ── Noms de jobs ──────────────────────────────────────────────────────────────

export const JOBS = {
  PUBLISH_POST: "publish-post",
  COLLECT_METRICS: "collect-metrics",
  ATTRIBUTION_REFRESH: "attribution-refresh",
  COLLECTIVE_AGGREGATE: "collective-aggregate",
} as const

// ── Payload du job publish-post ───────────────────────────────────────────────

export interface PublishPostPayload {
  postId: string
  tenantId: string
}

// ── Payload du job collect-metrics (Performance Loop, US-006) ──────────────────

export interface CollectMetricsPayload {
  postId: string
  tenantId: string
  /** Étiquette de l'échéance, pour la traçabilité (T+1h, T+24h, T+7j). */
  window: "1h" | "24h" | "7d"
}

// Délais de collecte après publication (en secondes).
const COLLECT_OFFSETS: Array<{ window: CollectMetricsPayload["window"]; seconds: number }> = [
  { window: "1h", seconds: 60 * 60 },
  { window: "24h", seconds: 24 * 60 * 60 },
  { window: "7d", seconds: 7 * 24 * 60 * 60 },
]

// ── État du boss ──────────────────────────────────────────────────────────────

let bossInstance: PgBoss | null = null
let bossUnavailable = false // fallback gracieux si DB inaccessible

// ── Résolution de la connection string ───────────────────────────────────────

function resolveConnectionString(): string {
  // Priorité 1 : connection pooler IPv4 (Supabase Pooler — recommandé production)
  const poolerUrl = process.env.SUPABASE_DB_POOLER_URL
  if (poolerUrl) return poolerUrl

  // Priorité 2 : connexion directe (IPv6 — dev local ou migrations)
  const directUrl = process.env.SUPABASE_DB_URL
  if (directUrl) return directUrl

  throw new Error(
    "Aucune URL DB configurée. Définir SUPABASE_DB_POOLER_URL (production) ou SUPABASE_DB_URL (développement)."
  )
}

// ── Singleton pg-boss ─────────────────────────────────────────────────────────

export async function getBoss(): Promise<PgBoss> {
  if (bossInstance) return bossInstance

  if (bossUnavailable) {
    throw new Error("[pg-boss] Service de queue temporairement indisponible")
  }

  const connectionString = resolveConnectionString()

  const boss = new PgBoss({
    connectionString,
    // Monitoring toutes les 30 secondes
    monitorIntervalSeconds: 30,
    // Maintenance toutes les 2 minutes
    maintenanceIntervalSeconds: 120,
  })

  boss.on("error", (error: Error) => {
    log({ level: "error", module: "pgboss", action: "internal_error", metadata: { message: error.message } })
  })

  try {
    await boss.start()
    bossInstance = boss
    log({ level: "info", module: "pgboss", action: "started", metadata: { url_type: process.env.SUPABASE_DB_POOLER_URL ? "pooler" : "direct" } })
  } catch (err) {
    // Fallback gracieux : la queue est indisponible mais l'app continue
    bossUnavailable = true
    log({ level: "error", module: "pgboss", action: "start_failed", metadata: { message: String(err) } })
    throw err
  }

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

/**
 * Performance Loop (US-006) — planifie 3 collectes de metrics après publication :
 * T+1h, T+24h, T+7j. Chaque job route ensuite vers le bon MetricsProvider.
 * singletonKey par (post, fenêtre) → idempotent si appelé plusieurs fois.
 */
export async function scheduleMetricsCollection(payload: {
  postId: string
  tenantId: string
}): Promise<void> {
  const boss = await getBoss()

  await Promise.all(
    COLLECT_OFFSETS.map(({ window, seconds }) =>
      boss.send(
        JOBS.COLLECT_METRICS,
        { postId: payload.postId, tenantId: payload.tenantId, window } satisfies CollectMetricsPayload,
        {
          singletonKey: `metrics:${payload.postId}:${window}`,
          startAfter: seconds,
          retryLimit: 3,
          retryDelay: 120, // 2 min entre les retries
          retryBackoff: true, // exponentiel : 120s, 240s, 480s
          expireInSeconds: 300,
          priority: 0,
        }
      )
    )
  )
}
