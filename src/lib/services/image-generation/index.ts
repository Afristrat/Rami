// ============================================================
// Image Generation — Orchestrateur avec fallback chain
// Fal.ai → Replicate → Together AI
// ============================================================

import { FalProvider } from './fal.provider'
import { ReplicateProvider } from './replicate.provider'
import { TogetherProvider } from './together.provider'
import { GenerationRequest, GenerationResult } from './types'

const fal = new FalProvider()
const replicate = new ReplicateProvider()
const together = new TogetherProvider()

// Ordre de priorité : Fal.ai → Replicate → Together AI
const PROVIDER_CHAIN = [fal, replicate, together]

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
