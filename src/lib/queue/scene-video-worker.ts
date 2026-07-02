// ============================================================
// Worker pg-boss — Orchestration vidéo v2 « par scène ».
// Fait avancer une production v2 : attend le storyboard (job Mishkāt n°1),
// génère une image de fond par scène (RAMI), puis lance le RENDU final (job
// Mishkāt n°2). Le suivi du rendu reste assuré par GET /api/video/[id] (qui
// bascule sur render_job_id). Idempotent : si le rendu est déjà lancé, ne refait rien.
// ============================================================

import type { Job } from "pg-boss"
import { getBoss, JOBS, enqueueRenderWatch, type SceneVideoPayload } from "./pgboss"
import { createServiceClient } from "@/lib/supabase/service"
import { getProduction, createProduction } from "@/lib/services/mishkat/client"
import { generateSceneImages } from "@/lib/services/mishkat/scene-images"
import type { MishkatBrief, BrandTokens, MishkatStoryboard, MishkatAspect } from "@/lib/services/mishkat/types"
import { log } from "@/lib/utils/logger"

const STORYBOARD_POLL_ATTEMPTS = 24
const STORYBOARD_POLL_INTERVAL_MS = 5_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function hasScenes(sb: MishkatStoryboard | undefined): sb is MishkatStoryboard {
  return !!sb && Array.isArray(sb.scenes) && sb.scenes.length > 0
}

export async function startSceneVideoWorker(): Promise<void> {
  const boss = await getBoss()
  if (!boss) return

  await boss.work<SceneVideoPayload>(
    JOBS.SCENE_VIDEO,
    { batchSize: 2, localConcurrency: 2 },
    async (jobs: Job<SceneVideoPayload>[]) => {
      await Promise.all(jobs.map((job) => processSceneVideoJob(job.data.productionRowId, job.data.tenantId)))
    },
  )

  log({ level: "info", module: "scene-video-worker", action: "worker_started" })
}

export async function processSceneVideoJob(productionRowId: string, tenantId: string): Promise<void> {
  const supabase = createServiceClient()

  const { data: row } = await supabase
    .from("video_productions")
    .select("mishkat_job_id, brief, brand_snapshot, render_job_id, status")
    .eq("id", productionRowId)
    .eq("tenant_id", tenantId)
    .maybeSingle<{ mishkat_job_id: string; brief: MishkatBrief; brand_snapshot: BrandTokens | null; render_job_id: string | null; status: string }>()

  if (!row) {
    log({ level: "error", module: "scene-video-worker", action: "row_not_found", tenant_id: tenantId, metadata: { productionRowId } })
    return
  }
  // Idempotence : rendu déjà lancé (retry après succès partiel) → ne rien refaire.
  if (row.render_job_id) return

  const storyboardJobId = row.mishkat_job_id
  const brief = row.brief
  const brand = row.brand_snapshot ?? undefined

  try {
    // ── 1. Attendre le storyboard (job Mishkāt n°1) ──
    let storyboard: MishkatStoryboard | undefined
    for (let i = 0; i < STORYBOARD_POLL_ATTEMPTS; i++) {
      const live = await getProduction(storyboardJobId)
      if (live.status === "error") throw new Error(live.error ?? "Échec de génération du storyboard")
      if (hasScenes(live.storyboard)) {
        storyboard = live.storyboard
        break
      }
      await sleep(STORYBOARD_POLL_INTERVAL_MS)
    }
    if (!hasScenes(storyboard)) throw new Error("Storyboard non prêt (délai dépassé)")

    // ── 2. Une image de fond par scène (RAMI, provider souverain) ──
    const aspect: MishkatAspect = brief.channel_format?.[0]?.aspect ?? "16:9"
    const { sceneImages, skipped } = await generateSceneImages(tenantId, storyboard, aspect)

    // ── 3. Rendu final (job Mishkāt n°2) avec NOS images ──
    const { id: renderJobId } = await createProduction({ brief, brand, storyboard, sceneImages })

    await supabase
      .from("video_productions")
      .update({ render_job_id: renderJobId, storyboard, status: "rendering", updated_at: new Date().toISOString() })
      .eq("id", productionRowId)
      .eq("tenant_id", tenantId)

    // Suivi de fond indépendant du navigateur (cf. render-watch-worker) : garantit
    // que la ligne converge vers done/error même si l'onglet est fermé ou que le
    // polling client abandonne avant la fin réelle du rendu.
    await enqueueRenderWatch({ productionRowId, tenantId, mishkatJobId: renderJobId })

    log({
      level: "info",
      module: "scene-video-worker",
      action: "render_launched",
      tenant_id: tenantId,
      metadata: { productionRowId, renderJobId, scenes: storyboard.scenes.length, images: Object.keys(sceneImages).length, skipped: skipped.length },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from("video_productions")
      .update({ status: "error", error_message: message, updated_at: new Date().toISOString() })
      .eq("id", productionRowId)
      .eq("tenant_id", tenantId)
    log({ level: "error", module: "scene-video-worker", action: "job_failed", tenant_id: tenantId, metadata: { productionRowId, error: message } })
    throw err // laisse pg-boss gérer le retry (limité)
  }
}
