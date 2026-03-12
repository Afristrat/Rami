/**
 * Service Perplexity — Benchmark sectoriel
 * Appelle l'API Perplexity pour récupérer les tendances visuelles et éditoriales
 * d'un secteur × culture. Résultat mis en cache 7 jours dans tenants.brand_dna.
 */

import { createServiceClient } from "@/lib/supabase/service"

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

  // Vérifier la clé API
  const perplexityKey = process.env.PERPLEXITY_API_KEY
  if (!perplexityKey) {
    return { error: "PERPLEXITY_API_KEY non configurée dans les variables d'environnement" }
  }

  const culture = primaryCulture ?? "international"
  const cultureLabel = CULTURE_LABELS[culture] ?? "internationale"

  const systemPrompt = [
    "Tu es un expert senior en marketing digital, stratégie de contenu et tendances sectorielles.",
    "Tu analyses les données les plus récentes disponibles (2025-2026).",
    "Réponds UNIQUEMENT en JSON valide, sans markdown, sans bloc de code, sans commentaires.",
    "Sois concis, factuel, orienté résultats opérationnels pour une agence marketing.",
  ].join(" ")

  const userPrompt = [
    `Analyse les tendances actuelles du secteur "${sector}" pour une audience ${cultureLabel} sur les réseaux sociaux (2025-2026).`,
    "",
    "Réponds avec exactement ces 5 clés JSON (valeurs en français, 2-3 phrases chacune) :",
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
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${perplexityKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(35_000),
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "")
      return { error: `Perplexity API error ${response.status}: ${errorBody.slice(0, 200)}` }
    }

    const json = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json.choices?.[0]?.message?.content ?? ""

    // Parser le JSON — gérer les blocs markdown si présents
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { error: "Réponse Perplexity non parseable (pas de JSON détecté)" }
    }

    benchmarkData = JSON.parse(jsonMatch[0]) as Partial<PerplexityBenchmarkData>
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return { error: `Erreur appel Perplexity : ${message}` }
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
    console.error("[perplexity-benchmark] Erreur stockage DB:", updateError.message)
  }

  return { data: result }
}
