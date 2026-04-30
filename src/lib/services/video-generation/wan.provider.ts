// ============================================================
// Wan2.2 Provider — Open source 14B, 720P — via Fal.ai — Fallback #4
// API : fal.ai (run/wan-ai/wan2.2-t2v-720p)
// Wan 2.2 reste le meilleur open-source vidéo début 2026
// ============================================================

import {
  VideoProvider_Interface,
  VideoGenerationRequest,
  VideoGenerationResult,
  VIDEO_PLATFORM_SPECS,
} from './types'

const WAN_MODEL = 'wan-ai/wan2.2-t2v-720p'
const FAL_BASE_URL = 'https://fal.run'
const TIMEOUT_MS = 120_000

export class WanProvider implements VideoProvider_Interface {
  readonly name = 'wan' as const
  readonly supportsAudio = false
  readonly maxDurationSeconds = 10

  private get apiKey(): string {
    const key = process.env.FAL_KEY ?? process.env.FAL_API_KEY
    if (!key) throw new Error('FAL_KEY non configurée')
    return key
  }

  async generate(req: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const start = Date.now()
    const specs = VIDEO_PLATFORM_SPECS[req.platform]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      // Wan2.2 utilise l'API async de Fal.ai (enqueue → poll result)
      const queueResponse = await fetch(`${FAL_BASE_URL}/${WAN_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: req.prompt,
          negative_prompt: 'text, watermark, blurry, distorted',
          num_frames: Math.min((req.duration_seconds ?? 5) * 24, 81),
          resolution: '720P',
          aspect_ratio: '9:16',
          seed: req.seed,
          enable_safety_checker: true,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!queueResponse.ok) {
        const body = await queueResponse.text()
        throw new Error(`Wan2.2 erreur ${queueResponse.status}: ${body}`)
      }

      const result = await queueResponse.json() as WanFalResponse

      const videoUrl = result.video?.url
      if (!videoUrl) throw new Error('Wan2.2 : URL vidéo absente dans la réponse')

      return {
        videos: [
          {
            url: videoUrl,
            width: specs.width,
            height: specs.height,
            duration_seconds: req.duration_seconds ?? 5,
            has_audio: false,
            format: 'mp4',
            seed: req.seed,
          },
        ],
        provider: 'wan',
        duration_ms: Date.now() - start,
        model: WAN_MODEL,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Wan2.2 timeout (>${TIMEOUT_MS}ms)`
          : `Wan2.2: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }
}

// ── Types Wan via Fal.ai ──────────────────────────────────────────────────────

interface WanFalResponse {
  video?: { url: string; content_type: string; file_name: string; file_size: number }
  seed?: number
  timings?: Record<string, number>
}
