// ============================================================
// Video Generation — Orchestrateur avec fallback chain
// Veo 3.1 → Runway Gen-4.5 → Kling 2.6 → Luma Ray3 → Wan2.2
// ============================================================

import { VeoProvider } from './veo.provider'
import { RunwayProvider } from './runway.provider'
import { KlingProvider } from './kling.provider'
import { LumaProvider } from './luma.provider'
import { WanProvider } from './wan.provider'
import {
  VideoGenerationRequest,
  VideoGenerationResult,
  VideoProvider_Interface,
} from './types'

const veo = new VeoProvider()
const runway = new RunwayProvider()
const kling = new KlingProvider()
const luma = new LumaProvider()
const wan = new WanProvider()

// Ordre de priorité : Veo 3.1 → Runway → Kling → Luma → Wan2.2
const PROVIDER_CHAIN: VideoProvider_Interface[] = [veo, runway, kling, luma, wan]

export async function generateVideo(
  req: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  const errors: string[] = []

  for (const provider of PROVIDER_CHAIN) {
    // Vérifier que le provider supporte la durée demandée
    if (req.duration_seconds && req.duration_seconds > provider.maxDurationSeconds) {
      errors.push(
        `${provider.name}: durée demandée (${req.duration_seconds}s) > max (${provider.maxDurationSeconds}s)`
      )
      continue
    }

    try {
      const result = await provider.generate(req)
      if (result.videos.length > 0) {
        return result
      }
      errors.push(`${provider.name}: aucune vidéo retournée`)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`${provider.name}: ${message}`)
      // Continuer vers le provider suivant
    }
  }

  throw new Error(
    `Tous les providers vidéo ont échoué:\n${errors.map((e, i) => `  ${i + 1}. ${e}`).join('\n')}`
  )
}

export type { VideoGenerationRequest, VideoGenerationResult }
export { VIDEO_PLATFORM_SPECS } from './types'
export type { VideoPlatform, VideoProvider } from './types'
