// ============================================================
// Luma Ray3 Provider — Vitesse + API simple — Fallback #3
// API : lumalabs.ai/api
// ============================================================

import {
  VideoProvider_Interface,
  VideoGenerationRequest,
  VideoGenerationResult,
  VIDEO_PLATFORM_SPECS,
} from './types'

// Luma Ray 2 Flash (mars 2026) — plus rapide que Ray 2, API stable
// Ray 2 Ultra disponible mais plus lent — Flash optimal pour fallback
const LUMA_MODEL = 'ray-2-flash'
const LUMA_BASE_URL = 'https://api.lumalabs.ai/dream-machine/v1'
const TIMEOUT_MS = 90_000

export class LumaProvider implements VideoProvider_Interface {
  readonly name = 'luma_ray' as const
  readonly supportsAudio = false
  readonly maxDurationSeconds = 30

  private get apiKey(): string {
    const key = process.env.LUMA_API_KEY
    if (!key) throw new Error('LUMA_API_KEY non configurée')
    return key
  }

  async generate(req: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const start = Date.now()
    const specs = VIDEO_PLATFORM_SPECS[req.platform]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const createResponse = await fetch(`${LUMA_BASE_URL}/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LUMA_MODEL,
          prompt: req.prompt,
          aspect_ratio: '9:16',
          duration: `${req.duration_seconds ?? 9}s`,
          ...(req.reference_image_url && {
            keyframes: {
              frame0: { type: 'image', url: req.reference_image_url },
            },
          }),
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!createResponse.ok) {
        const body = await createResponse.text()
        throw new Error(`Luma erreur ${createResponse.status}: ${body}`)
      }

      const generation = await createResponse.json() as LumaGeneration
      const videoUrl = await this.pollGeneration(generation.id)

      return {
        videos: [
          {
            url: videoUrl,
            width: specs.width,
            height: specs.height,
            duration_seconds: req.duration_seconds ?? 9,
            has_audio: false,
            format: 'mp4',
            seed: req.seed,
          },
        ],
        provider: 'luma_ray',
        duration_ms: Date.now() - start,
        model: LUMA_MODEL,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Luma timeout (>${TIMEOUT_MS}ms)`
          : `Luma: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  private async pollGeneration(generationId: string): Promise<string> {
    const maxAttempts = 25
    const pollInterval = 4_000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, pollInterval))

      const res = await fetch(`${LUMA_BASE_URL}/generations/${generationId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      })

      if (!res.ok) continue

      const gen = await res.json() as LumaGeneration

      if (gen.state === 'completed') {
        const url = gen.assets?.video
        if (!url) throw new Error('Luma : URL vidéo absente dans la réponse')
        return url
      }

      if (gen.state === 'failed') {
        throw new Error(`Luma : génération échouée — ${gen.failure_reason ?? 'erreur inconnue'}`)
      }
    }

    throw new Error('Luma : timeout de polling')
  }
}

// ── Types Luma ────────────────────────────────────────────────────────────────

interface LumaGeneration {
  id: string
  state: 'pending' | 'dreaming' | 'completed' | 'failed'
  failure_reason?: string
  assets?: { video?: string }
  created_at: string
}
