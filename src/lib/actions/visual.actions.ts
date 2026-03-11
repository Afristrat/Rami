'use server'

// ============================================================
// Visual Actions — Server Actions pour la génération de visuels
// SOP-003 : Orchestration complète Brand DNA → Images générées
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { generateBatch } from '@/lib/services/image-generation'
import {
  compileBrandDNAToPrompts,
  calculateBrandDNAScore,
  BrandDNA,
} from '@/lib/services/brand-dna/prompt-compiler'
import { GenerateBriefSchema, GenerateBriefInput } from '@/lib/schemas/visual.schema'
import { GeneratedVisual } from '@/lib/services/image-generation/types'

export interface VisualGenerationResult {
  success: boolean
  session_id: string
  visuals: GeneratedVisual[]
  errors?: string[]
  error?: string
}

/**
 * Action principale : génère 4 directions × N images à partir d'un brief
 */
export async function generateVisualsAction(
  input: GenerateBriefInput
): Promise<VisualGenerationResult> {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, session_id: '', visuals: [], error: 'Non authentifié' }
  }

  // Validation Zod
  const parsed = GenerateBriefSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      session_id: '',
      visuals: [],
      error: parsed.error.issues[0]?.message ?? 'Données invalides',
    }
  }

  const { brief, platform, images_per_direction } = parsed.data

  // Charger le Brand DNA du tenant
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('id, brand_dna, generation_count')
    .eq('owner_id', user.id)
    .single()

  // tenantId utilisé pour l'audit et le stockage futur
  const _tenantId: string = tenantData?.id ?? user.id
  void _tenantId
  const brandDNA: BrandDNA = (tenantData?.brand_dna as BrandDNA) ?? {}
  const hasExistingDNA =
    !!brandDNA.identity?.name &&
    !!brandDNA.color_palette &&
    (brandDNA.color_palette?.length ?? 0) > 0

  // Compiler les 4 directions de prompts
  const sessionSeed = Math.floor(Math.random() * 100000)
  const structuredPrompts = compileBrandDNAToPrompts(brandDNA, brief, platform, sessionSeed)

  const sessionId = crypto.randomUUID()
  const allVisuals: GeneratedVisual[] = []
  const errors: string[] = []

  // Générer les images pour chaque direction (parallèle entre directions)
  const directionResults = await Promise.allSettled(
    structuredPrompts.map(async (sp, directionIndex) => {
      try {
        const results = await generateBatch(
          {
            positive_prompt: sp.positive_prompt,
            negative_prompt: sp.negative_prompt,
            width: sp.parameters.width,
            height: sp.parameters.height,
            guidance_scale: sp.parameters.guidance_scale,
            num_inference_steps: sp.parameters.num_inference_steps,
            seed: sp.parameters.seed,
            num_images: 1,
          },
          images_per_direction
        )

        return results.flatMap((result, imgIndex) =>
          result.images.map((img) => {
            const score = calculateBrandDNAScore(
              result.provider,
              sp.direction,
              hasExistingDNA,
              directionIndex * images_per_direction + imgIndex
            )

            const visual: GeneratedVisual = {
              direction: sp.direction,
              image: img,
              provider: result.provider,
              brand_dna_score: score,
              prompt_used: sp.positive_prompt,
              seed: img.seed,
            }

            return visual
          })
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        errors.push(`Direction ${sp.direction.name}: ${message}`)
        return []
      }
    })
  )

  directionResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      allVisuals.push(...result.value)
    } else {
      errors.push(result.reason?.message ?? 'Erreur inconnue')
    }
  })

  if (allVisuals.length === 0) {
    return {
      success: false,
      session_id: sessionId,
      visuals: [],
      errors,
      error: 'Aucune image générée. Vérifiez les clés API.',
    }
  }

  // Incrémenter le compteur de générations du tenant
  if (tenantData?.id) {
    await supabase
      .from('tenants')
      .update({ generation_count: (tenantData.generation_count ?? 0) + 1 })
      .eq('id', tenantData.id)
  }

  return {
    success: true,
    session_id: sessionId,
    visuals: allVisuals,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Charge le Brand DNA du tenant courant pour préremplir l'interface
 */
export async function getTenantBrandDNAAction(): Promise<{
  hasDNA: boolean
  brandName?: string
  platform?: string
  cognitiveObjective?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { hasDNA: false }

  const { data } = await supabase
    .from('tenants')
    .select('brand_dna')
    .eq('owner_id', user.id)
    .single()

  if (!data?.brand_dna) return { hasDNA: false }

  const dna = data.brand_dna as BrandDNA
  const activePlatforms = dna.active_platforms ?? []

  return {
    hasDNA: !!dna.identity?.name,
    brandName: dna.identity?.name,
    platform: activePlatforms[0] ?? 'instagram',
    cognitiveObjective: dna.cognitive_objective,
  }
}
