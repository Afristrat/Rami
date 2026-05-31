/**
 * Service Perplexity — Benchmark sectoriel
 * Appelle l'API Perplexity pour récupérer les tendances visuelles et éditoriales
 * d'un secteur × culture. Résultat mis en cache 7 jours dans tenants.brand_dna.
 */

import { createServiceClient } from "@/lib/supabase/service"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { log } from "@/lib/utils/logger"

export type PerplexityBenchmarkData = {
  tendancesVisuelles: string
  tendancesCouleurs: string
  formatContenu: string
  tonEditorial: string
  strategieHashtags: string
  cachedAt: string
  sector: string
  primaryCulture: string
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

const CULTURE_LABELS: Record<string, string> = {
  maroc: "marocaine",
  afrique_subsaharienne: "africaine subsaharienne",
  europe_francophone: "française / européenne francophone",
  moyen_orient: "du Moyen-Orient",
  international: "internationale",
}

/**
 * Vérifie si le benchmark en cache est encore valide (< 7 jours).
 */
export function isBenchmarkFresh(benchmark: PerplexityBenchmarkData | null): boolean {
  if (!benchmark?.cachedAt) return false
  const age = Date.now() - new Date(benchmark.cachedAt).getTime()
  return age < CACHE_TTL_MS
}

/**
 * Exécute le benchmark Perplexity pour un tenant donné.
 * - Vérifie le cache 7 jours avant d'appeler l'API
 * - Stocke le résultat dans tenants.brand_dna.perplexity_benchmark
 * - Utilise le client service role pour bypasser RLS
 */
export async function runPerplexityBenchmark(
  tenantId: string,
  sector: string,
  primaryCulture?: string
): Promise<{ data: PerplexityBenchmarkData } | { error: string }> {
  const supabase = createServiceClient()

  // Récupérer le brand_dna actuel pour cache check
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  if (tenantError) {
    return { error: "Tenant introuvable" }
  }

  const brandDna = tenant?.brand_dna as Record<string, unknown> | null
  const existingBenchmark = brandDna?.perplexity_benchmark as PerplexityBenchmarkData | undefined

  // Cache hit — retourner les données en cache si fraîches
  if (existingBenchmark && isBenchmarkFresh(existingBenchmark)) {
    return { data: existingBenchmark }
  }

  const benchmarkConfig = await getPromptConfig("perplexity_sector_benchmark")

  const culture = primaryCulture ?? "international"
  const cultureLabel = CULTURE_LABELS[culture] ?? "internationale"

  // ── Étape 1 : recherche web via Crawl4AI (DuckDuckGo HTML, crawl-friendly) ──
  // Crawl4AI crawle la page de résultats et renvoie un markdown (titres + extraits + liens).
  const crawlBase = (process.env.CRAWL4AI_BASE_URL || "https://crawl4ai.ai-mpower.com").replace(/\/+$/, "")
  const searchQuery = `tendances marketing réseaux sociaux secteur ${sector} audience ${cultureLabel} 2025 2026`
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`

  let webContext = ""
  try {
    const crawlRes = await fetch(`${crawlBase}/md`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: searchUrl, filter: "fit" }),
      signal: AbortSignal.timeout(40_000),
    })
    if (crawlRes.ok) {
      const crawlJson = (await crawlRes.json()) as { markdown?: string }
      webContext = (crawlJson.markdown ?? "").slice(0, 8000)
    } else {
      log({ level: "warn", module: "sector-benchmark", action: "crawl4ai_non_ok", tenant_id: tenantId, metadata: { status: crawlRes.status } })
    }
  } catch {
    // Dégradation gracieuse : si le crawl échoue, on synthétise sans contexte web.
  }

  // ── Étape 2 : synthèse via le LLM (proxy OpenAI-compatible — deepseek) ──
  const llmKey = process.env.OPENAI_API_KEY
  if (!llmKey) {
    return { error: "OPENAI_API_KEY (clé du proxy LLM) non configurée" }
  }
  const llmBase = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "")
  const llmModel = process.env.LLM_TEXT_MODEL || "deepseek-v4-flash"

  const userPrompt = [
    `Secteur : "${sector}". Audience : ${cultureLabel}. Contexte : réseaux sociaux 2025-2026.`,
    "",
    webContext
      ? `Résultats de recherche web récents (titres, extraits, sources) à exploiter :\n${webContext}`
      : "(Aucun résultat web disponible — base-toi sur tes connaissances du secteur.)",
    "",
    "À partir de ces éléments, réponds avec EXACTEMENT ces 5 clés JSON (valeurs en français, 2-3 phrases chacune), sans markdown ni texte hors JSON :",
    `{`,
    `  "tendancesVisuelles": "styles visuels dominants, typographies, compositions, esthétiques en vogue",`,
    `  "tendancesCouleurs": "palettes et couleurs tendance dans ce secteur et cette culture",`,
    `  "formatContenu": "formats performants : vidéo courte, carousel, stories, infographie, live, etc.",`,
    `  "tonEditorial": "ton, registre et type de messages qui convertissent dans ce secteur",`,
    `  "strategieHashtags": "hashtags tendance, mots-clés SEO et stratégie de visibilité organique"`,
    `}`,
  ].join("\n")

  let benchmarkData: Partial<PerplexityBenchmarkData>

  try {
    const response = await fetch(`${llmBase}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [
          { role: "system", content: benchmarkConfig.systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(35_000),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      return { error: `Benchmark LLM error ${response.status}: ${errorBody.slice(0, 200)}` }
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content ?? ""

    // Parser le JSON — gérer les blocs markdown si présents
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { error: "Réponse LLM non parseable (pas de JSON détecté)" }
    }

    benchmarkData = JSON.parse(jsonMatch[0]) as Partial<PerplexityBenchmarkData>
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return { error: `Erreur benchmark (Crawl4AI + LLM) : ${message}` }
  }

  const result: PerplexityBenchmarkData = {
    tendancesVisuelles: benchmarkData.tendancesVisuelles ?? "",
    tendancesCouleurs: benchmarkData.tendancesCouleurs ?? "",
    formatContenu: benchmarkData.formatContenu ?? "",
    tonEditorial: benchmarkData.tonEditorial ?? "",
    strategieHashtags: benchmarkData.strategieHashtags ?? "",
    cachedAt: new Date().toISOString(),
    sector,
    primaryCulture: culture,
  }

  // Stocker dans brand_dna (merge sans écraser les autres champs)
  const updatedBrandDna = {
    ...(brandDna ?? {}),
    perplexity_benchmark: result,
  }

  const { error: updateError } = await supabase
    .from("tenants")
    .update({ brand_dna: updatedBrandDna })
    .eq("id", tenantId)

  if (updateError) {
    // Retourner les données même si le stockage échoue
    log({ level: "error", module: "perplexity-benchmark", action: "db_storage_failed", tenant_id: tenantId, metadata: { error: updateError.message } })
  }

  return { data: result }
}
