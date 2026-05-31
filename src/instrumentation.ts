/**
 * Next.js Instrumentation — Sentry + démarrage du worker pg-boss
 *
 * Ce fichier est exécuté une seule fois au démarrage du serveur Next.js.
 * En production (Vercel), il tourne dans le runtime Node.js.
 * Conforme SOP-004 : scheduling via pg-boss.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // ── Initialisation Sentry ─────────────────────────────────────────────────
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config")
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config")
  }

  // ── Démarrage du worker pg-boss ────────────────────────────────────────────
  // Uniquement côté serveur Node.js (pas dans Edge Runtime ni côté client)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Import dynamique pour éviter le bundling côté Edge
    const { startPublishWorker } = await import("@/lib/queue/publish-worker")
    const { startCollectMetricsWorker } = await import("@/lib/queue/jobs/collect-metrics")
    const { log } = await import("@/lib/utils/logger")

    try {
      await startPublishWorker()
    } catch (err) {
      // Ne pas crasher le serveur si pg-boss échoue au démarrage
      // (ex: DB indisponible en dev)
      log({ level: "error", module: "instrumentation", action: "publish_worker_start_failed", metadata: { error: err instanceof Error ? err.message : String(err) } })
    }

    try {
      await startCollectMetricsWorker()
    } catch (err) {
      log({ level: "error", module: "instrumentation", action: "collect_metrics_worker_start_failed", metadata: { error: err instanceof Error ? err.message : String(err) } })
    }
  }
}
