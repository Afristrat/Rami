// ============================================================
// Image Generation — Orchestrateur avec fallback chain
// Nano Banana → Fal.ai FLUX1.1 Ultra → Google Imagen 4 → Replicate → Together AI
//
// Mise à jour mars 2026 :
//   • Fal.ai : FLUX1.1 Pro Ultra (4MP, meilleure qualité)
//   • Google Imagen 4 (preview) → Imagen 3 (stable) en fallback interne
//   • Ordre optimisé : vitesse + qualité + coût
// ============================================================

import { LiteLLMImageProvider } from './litellm-image.provider'
import { NanoBananaProvider } from './nano-banana.provider'
import { FalProvider } from './fal.provider'
import { ImagenProvider } from './imagen.provider'
import { ReplicateProvider } from './replicate.provider'
import { TogetherProvider } from './together.provider'
import { GenerationRequest, GenerationResult } from './types'

const litellmImage = new LiteLLMImageProvider()
const nanoBanana = new NanoBananaProvider()
const fal        = new FalProvider()
const imagen     = new ImagenProvider()
const replicate  = new ReplicateProvider()
const together   = new TogetherProvider()

// Ordre de priorité :
// 1. LiteLLM proxy (clé virtuelle plafonnée 5 $) — cascade interne moins-cher d'abord
//    (gemini-2.5-flash-image → gemini-3.1-flash-image → gemini-3-pro-image)
// 2. Nano Banana (Google direct, si GEMINI_API_KEY présente)
// 3. Fal.ai FLUX1.1 Pro Ultra (qualité premium)
// 4. Google Imagen 4/3 (photorealisme + cohérence couleurs Brand DNA)
// 5. Replicate (fallback fiable)
// 6. Together AI (dernier recours, moins cher)
const PROVIDER_CHAIN = [litellmImage, nanoBanana, fal, imagen, replicate, together]

export async function generateImage(req: GenerationRequest): Promise<GenerationResult> {
  const errors: string[] = []

  for (const provider of PROVIDER_CHAIN) {
    try {
      const result = await provider.generate(req)
      if (result.images.length > 0) {
        return result
      }
      errors.push(`${provider.name}: aucune image retournée`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`${provider.name}: ${message}`)
      // Continuer vers le provider suivant
    }
  }

  throw new Error(
    `Tous les providers ont échoué:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`
  )
}

// Générer plusieurs images en parallèle (batch pour une direction)
export async function generateBatch(
  req: GenerationRequest,
  count: number
): Promise<GenerationResult[]> {
  const seeds = Array.from({ length: count }, (_, i) => (req.seed ?? 42) + i * 7)

  const results = await Promise.allSettled(
    seeds.map((seed) => generateImage({ ...req, seed, num_images: 1 }))
  )

  const successful = results
    .filter((r): r is PromiseFulfilledResult<GenerationResult> => r.status === 'fulfilled')
    .map((r) => r.value)

  if (successful.length === 0) {
    throw new Error('Aucune image générée avec succès dans le batch')
  }

  return successful
}

export type { GenerationRequest, GenerationResult }
