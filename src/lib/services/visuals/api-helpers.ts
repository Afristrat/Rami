// ============================================================
// US-052 — Helpers partagés des routes API v1 visuels.
// Résout le Brand DNA du tenant (par clé d'API), génère l'artefact et applique
// les gates QA déterministes. Factorisé entre `generate` et `regenerate` (DRY).
// ============================================================

import type { SupabaseClient } from "@supabase/supabase-js"
import { generateVisual, type GenerateVisualResult } from "@/lib/services/visuals/generate"
import { evaluateVisualQA, type QAGateResult } from "@/lib/services/visuals/qa-gates"

export interface GenerateAndEvaluateInput {
  type: string
  format: string
  content: Record<string, unknown>
}

export interface GenerateAndEvaluateResult {
  gen: GenerateVisualResult
  qa: QAGateResult
}

/**
 * Lit le Brand DNA du tenant (service-role), génère l'artefact via le service
 * partagé, puis évalue les gates QA. Lève une Error si la génération échoue.
 */
export async function generateAndEvaluate(
  supabase: SupabaseClient,
  tenantId: string,
  input: GenerateAndEvaluateInput
): Promise<GenerateAndEvaluateResult> {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("brand_dna, name")
    .eq("id", tenantId)
    .maybeSingle<{ brand_dna: unknown; name: string | null }>()

  const brandDna = tenant?.brand_dna ?? null
  const tenantName = tenant?.name ?? null

  const gen = await generateVisual({
    tenantId,
    type: input.type,
    format: input.format,
    content: input.content,
    brandDna,
    tenantName,
  })

  const qa = evaluateVisualQA({
    type: input.type,
    format: input.format,
    manifest: {
      width: gen.manifest.width,
      height: gen.manifest.height,
      fonts_embedded: gen.manifest.fonts_embedded,
    },
    sourceText: gen.sourceText,
    brandDna,
    tenantName,
  })

  return { gen, qa }
}
