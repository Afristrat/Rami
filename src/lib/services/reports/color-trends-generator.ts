// ============================================================
// Rapport « Tendances Couleur MENA » — génération (I/O) (US-014/015)
// ============================================================
// Assemble le rapport PUR (color-trends.ts) avec :
//   - les benchmarks collectifs réels (collective_benchmarks, service-role) ;
//   - un contexte web frais best-effort (Crawl4AI) ;
//   - une synthèse exécutive rédigée par le LLM (deepseek via proxy) ;
// puis le persiste dans color_trend_reports. Dégradation propre à chaque étape
// (jamais d'échec dur si le LLM/Crawl est indisponible — le rapport d'autorité reste).

import { createServiceClient } from "@/lib/supabase/service"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { log } from "@/lib/utils/logger"
import {
  buildColorTrendReport,
  buildColorTrendSystemPrompt,
  buildColorTrendUserPrompt,
  quarterLabel,
  type ColorTrendReport,
  type PlatformBenchmark,
} from "./color-trends"

const CRAWL4AI_BASE = process.env.CRAWL4AI_BASE_URL || "https://crawl4ai.ai-mpower.com"

/** Lit les benchmarks collectifs réels pour (secteur, culture) — service-role (cross-tenant). */
async function readCollectiveBenchmarks(
  sector: string,
  culture: string
): Promise<PlatformBenchmark[]> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("collective_benchmarks")
      .select("platform, metric, value, sample_size")
      .eq("sector", sector)
      .eq("culture", culture)

    if (error || !data) return []
    return (data as Array<{ platform: string; metric: string; value: number; sample_size: number }>).map(
      (r) => ({ platform: r.platform, metric: r.metric, value: r.value, sampleSize: r.sample_size })
    )
  } catch {
    return []
  }
}

/** Contexte web frais best-effort (Crawl4AI) sur les tendances couleur du secteur/culture. */
async function fetchFreshContext(sector: string, culture: string): Promise<string | null> {
  try {
    const query = `tendances couleur branding ${sector} ${culture} ${new Date().getUTCFullYear()}`
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    const res = await fetch(`${CRAWL4AI_BASE}/md`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: searchUrl, filter: "fit" }),
      signal: AbortSignal.timeout(40_000),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { markdown?: string }
    const md = (json.markdown ?? "").trim()
    return md ? md.slice(0, 4000) : null
  } catch {
    return null
  }
}

/** Synthèse exécutive LLM best-effort (null si indisponible). */
async function generateNarrative(report: ColorTrendReport, freshContext: string | null): Promise<string | null> {
  try {
    const config = await getPromptConfig("color_trend_narrative")
    let userPrompt = buildColorTrendUserPrompt(report)
    if (freshContext) {
      userPrompt += `\n\nContexte web récent (à pondérer, sans inventer de chiffre) :\n${freshContext}`
    }
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt: config.systemPrompt || buildColorTrendSystemPrompt(),
      userPrompt,
      maxTokens: 400,
      temperature: config.temperature,
    })
    const text = raw.trim()
    return text.length > 0 ? text : null
  } catch {
    return null
  }
}

export interface GenerateColorTrendOptions {
  /** Désactive l'appel Crawl4AI (tests / exécution rapide). */
  skipCrawl?: boolean
  /** Date de référence pour l'étiquette de période (défaut : maintenant). */
  now?: Date
}

/**
 * Génère et persiste le rapport couleur MENA d'un tenant pour la période courante.
 * Upsert sur (tenant_id, period) → un rapport par trimestre et par tenant.
 */
export async function generateColorTrendReport(
  tenantId: string,
  sector: string,
  culture: string,
  options: GenerateColorTrendOptions = {}
): Promise<ColorTrendReport> {
  const now = options.now ?? new Date()
  const period = quarterLabel(now)

  const benchmarks = await readCollectiveBenchmarks(sector, culture)
  let report = buildColorTrendReport({ sector, culture, period, benchmarks })

  const freshContext = options.skipCrawl ? null : await fetchFreshContext(sector, culture)
  const narrative = await generateNarrative(report, freshContext)
  report = { ...report, narrative }

  // Persistance (upsert) via service-role.
  try {
    const supabase = createServiceClient()
    const { error } = await supabase.from("color_trend_reports").upsert(
      {
        tenant_id: tenantId,
        sector,
        culture,
        period,
        report,
        generated_at: now.toISOString(),
      },
      { onConflict: "tenant_id,period" }
    )
    if (error) {
      log({
        level: "error",
        module: "color-trends",
        action: "persist_failed",
        tenant_id: tenantId,
        message: "Échec persistance rapport couleur",
        metadata: { error: error.message, period },
      })
    }
  } catch (err) {
    log({
      level: "error",
      module: "color-trends",
      action: "persist_exception",
      tenant_id: tenantId,
      message: "Exception persistance rapport couleur",
      metadata: { error: String(err) },
    })
  }

  return report
}
