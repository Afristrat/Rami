/**
 * Worker pg-boss — Rafraîchissement trimestriel des rapports « Tendances Couleur MENA »
 * (US-015). Chaque trimestre, régénère le rapport des tenants éligibles (plan Pro+,
 * feature performance_loop) ayant un secteur Brand DNA renseigné. Service-role.
 *
 * Le rapport s'appuie sur la matrice Causse (autorité sourcée) + les benchmarks
 * collectifs réels (k≥5) + une synthèse LLM. En cron, le crawl web est désactivé
 * (skipCrawl) pour borner la durée ; la génération manuelle (bouton) l'inclut.
 */

import { getBoss, JOBS } from "../pgboss"
import { createServiceClient } from "@/lib/supabase/service"
import { hasFeatureAccess, type Plan } from "@/lib/billing/plans"
import { generateColorTrendReport } from "@/lib/services/reports/color-trends-generator"
import { log } from "@/lib/utils/logger"

// 1er jour de janvier, avril, juillet, octobre à 04:00 UTC.
const QUARTERLY_CRON = "0 4 1 1,4,7,10 *"

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- client Supabase non typé côté worker
type ServiceClient = any

export async function startColorTrendRefreshWorker(): Promise<void> {
  const boss = await getBoss()
  if (!boss) {
    log({ level: "warn", module: "color-trend-refresh", action: "queue_unavailable", message: "Queue indisponible — worker non démarré" })
    return
  }

  try {
    await boss.createQueue(JOBS.COLOR_TREND_REFRESH)
  } catch {
    // Queue déjà créée — sans gravité.
  }

  await boss.work(JOBS.COLOR_TREND_REFRESH, async () => {
    await refreshColorTrendReports()
  })

  await boss.schedule(JOBS.COLOR_TREND_REFRESH, QUARTERLY_CRON)

  log({ level: "info", module: "color-trend-refresh", action: "worker_started" })
}

/** Lit une valeur string non vide depuis brand_dna (variantes FR tolérées). */
function pick(dna: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = dna[k]
    if (typeof v === "string" && v.trim() !== "") return v
  }
  return null
}

/**
 * Régénère les rapports couleur des tenants éligibles. Exporté pour les tests
 * d'intégration et l'exécution manuelle.
 */
export async function refreshColorTrendReports(): Promise<{ tenants: number; generated: number }> {
  const supabase = createServiceClient() as ServiceClient

  const { data, error } = await supabase.from("tenants").select("id, plan, brand_dna")
  if (error || !data) {
    log({ level: "error", module: "color-trend-refresh", action: "read_tenants_failed", metadata: { error: error?.message } })
    return { tenants: 0, generated: 0 }
  }

  const rows = data as Array<{ id: string; plan: string | null; brand_dna: Record<string, unknown> | null }>
  let generated = 0

  for (const row of rows) {
    const plan = (row.plan as Plan) ?? "free"
    if (!hasFeatureAccess(plan, "performance_loop")) continue

    const dna = row.brand_dna ?? {}
    const sector = pick(dna, "sector", "secteur")
    if (!sector) continue
    const culture = pick(dna, "primaryCulture", "marchePrimaire") ?? "maroc"

    try {
      await generateColorTrendReport(row.id, sector, culture, { skipCrawl: true })
      generated++
    } catch (err) {
      log({ level: "error", module: "color-trend-refresh", action: "generate_failed", tenant_id: row.id, metadata: { error: String(err) } })
    }
  }

  log({ level: "info", module: "color-trend-refresh", action: "done", metadata: { tenants: rows.length, generated } })
  return { tenants: rows.length, generated }
}
