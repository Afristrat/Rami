// ============================================================
// Worker pg-boss — Suivi de fond d'un rendu Mishkāt.
//
// Root cause (2026-07-02) : le polling du statut de rendu vivait uniquement
// côté navigateur (GET /api/video/[id]), avec un timeout client de quelques
// minutes. Un rendu Mishkāt plus long que ce budget (~7-8 min observés en
// prod pour une production 60s FR, file de rendu séquentielle sur Mishkāt)
// laissait la ligne `video_productions` bloquée sur `rendering` pour
// toujours, alors que la vidéo finissait par être prête et archivée sur MinIO.
//
// Ce worker reprend le même suivi (`pollAndPersistProduction`, la même
// fonction que la route GET) mais tourne côté serveur, indépendamment de la
// présence d'un onglet ouvert, jusqu'à convergence (`done`/`error`) ou
// expiration de son propre budget de temps.
// ============================================================

import type { Job } from "pg-boss"
import { getBoss, JOBS, type RenderWatchPayload } from "./pgboss"
import { createServiceClient } from "@/lib/supabase/service"
import { pollAndPersistProduction } from "@/lib/services/mishkat/finalize"
import type { ArchivedVariant } from "@/lib/services/mishkat/archive"
import { log } from "@/lib/utils/logger"

const POLL_INTERVAL_MS = 10_000
// Marge au-delà du pire cas observé (~8 min/production, file Mishkāt séquentielle
// mono-worker — une production en file d'attente derrière une autre peut doubler ce délai).
const MAX_WATCH_MS = 18 * 60 * 1000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function startRenderWatchWorker(): Promise<void> {
  const boss = await getBoss()
  if (!boss) return

  await boss.work<RenderWatchPayload>(
    JOBS.RENDER_WATCH,
    { batchSize: 4, localConcurrency: 4 },
    async (jobs: Job<RenderWatchPayload>[]) => {
      await Promise.all(jobs.map((job) => processRenderWatchJob(job.data)))
    },
  )

  log({ level: "info", module: "render-watch-worker", action: "worker_started" })
}

export async function processRenderWatchJob(payload: RenderWatchPayload): Promise<void> {
  const { productionRowId, tenantId, mishkatJobId } = payload
  const supabase = createServiceClient()
  const startedAt = Date.now()

  const { data: row } = await supabase
    .from("video_productions")
    .select("variants, status, user_id")
    .eq("id", productionRowId)
    .eq("tenant_id", tenantId)
    .maybeSingle<{ variants: unknown; status: string; user_id: string | null }>()

  if (!row) {
    log({ level: "error", module: "render-watch-worker", action: "row_not_found", tenant_id: tenantId, metadata: { productionRowId } })
    return
  }
  // Déjà finalisée (ex. le navigateur a converge avant nous) : rien à faire.
  if (row.status === "done" || row.status === "error") return

  const existingVariants = Array.isArray(row.variants) ? (row.variants as ArchivedVariant[]) : []
  // user_id connu dès la création (migration 20260702000001) : permet au worker
  // de fond de référencer la vidéo terminée dans la Bibliothèque, exactement
  // comme le fait la route GET côté navigateur (cf. finalize.ts).
  const opts = row.user_id ? { userId: row.user_id } : {}

  while (Date.now() - startedAt < MAX_WATCH_MS) {
    try {
      const { live } = await pollAndPersistProduction(supabase, tenantId, productionRowId, mishkatJobId, existingVariants, opts)
      if (live.status === "done" || live.status === "error") {
        log({ level: "info", module: "render-watch-worker", action: "finalized", tenant_id: tenantId, metadata: { productionRowId, status: live.status } })
        return
      }
    } catch (err) {
      // Erreur transitoire (réseau, 502 Mishkāt) : on continue de boucler plutôt
      // que d'abandonner — c'est exactement le comportement qu'on veut éviter
      // de reproduire côté serveur (cf. root cause du timeout navigateur).
      log({
        level: "error",
        module: "render-watch-worker",
        action: "poll_failed",
        tenant_id: tenantId,
        metadata: { productionRowId, error: err instanceof Error ? err.message : String(err) },
      })
    }
    await sleep(POLL_INTERVAL_MS)
  }

  // Budget de suivi dépassé sans convergence : erreur explicite plutôt qu'un
  // `rendering` orphelin indéfiniment.
  await supabase
    .from("video_productions")
    .update({
      status: "error",
      error_message: "Délai de suivi dépassé (production trop longue ou bloquée côté studio).",
      updated_at: new Date().toISOString(),
    })
    .eq("id", productionRowId)
    .eq("tenant_id", tenantId)

  log({ level: "error", module: "render-watch-worker", action: "watch_timeout", tenant_id: tenantId, metadata: { productionRowId } })
}
