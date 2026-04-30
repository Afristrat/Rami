// ============================================================
// Veo Provider — Google AI Studio — Provider PRINCIPAL vidéo
// Modèles disponibles (mars 2026) :
//   • veo-2.0-generate-001   — stable, accès général
//   • veo-3.0-generate-preview — preview, meilleure qualité, audio natif
// API : Gemini API (generativelanguage.googleapis.com)
// Auth : clé API Google AI Studio (GOOGLE_AI_API_KEY)
// Classement #1 mars 2026 : 4K, audio natif, prompt adherence maximale
// ============================================================

import {
  VideoProvider_Interface,
  VideoGenerationRequest,
  VideoGenerationResult,
  VIDEO_PLATFORM_SPECS,
} from './types'

// Veo 3 preview en priorité — fallback sur Veo 2 stable si quota/accès limité
const VEO_MODEL_PRIMARY   = 'veo-3.1-generate-preview'
const VEO_MODEL_FALLBACK  = 'veo-3.1-fast-generate-preview'
const GEMINI_BASE_URL     = 'https://generativelanguage.googleapis.com/v1beta'
const TIMEOUT_MS          = 180_000  // Veo peut prendre jusqu'à 3 min

export class VeoProvider implements VideoProvider_Interface {
  readonly name = 'veo' as const
  readonly supportsAudio = true
  readonly maxDurationSeconds = 60

  private get apiKey(): string {
    const key = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY
    if (!key) throw new Error('GOOGLE_AI_API_KEY non configurée — https://aistudio.google.com/app/apikey')
    return key
  }

  async generate(req: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const start = Date.now()

    // Essaie Veo 3 preview d'abord, puis Veo 2 stable en cas d'erreur d'accès
    for (const model of [VEO_MODEL_PRIMARY, VEO_MODEL_FALLBACK]) {
      try {
        const result = await this.generateWithModel(req, model, start)
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        // Si c'est une erreur 403/404 (accès preview non activé), passer au fallback
        if (msg.includes('403') || msg.includes('404') || msg.includes('not found') || msg.includes('preview')) {
          if (model === VEO_MODEL_PRIMARY) {
            // Continuer vers le fallback
            continue
          }
        }
        throw err
      }
    }

    throw new Error('Veo : aucun modèle disponible')
  }

  private async generateWithModel(
    req: VideoGenerationRequest,
    model: string,
    start: number
  ): Promise<VideoGenerationResult> {
    const specs = VIDEO_PLATFORM_SPECS[req.platform]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      // Gemini API — predictLongRunning pour les générations vidéo
      const url = `${GEMINI_BASE_URL}/models/${model}:predictLongRunning?key=${this.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [
            {
              prompt: req.prompt,
              ...(req.reference_image_url && {
                image: { gcsUri: req.reference_image_url }
              }),
            },
          ],
          parameters: {
            aspectRatio: specs.aspect_ratio,    // "9:16" | "16:9" | "1:1"
            durationSeconds: req.duration_seconds ?? 8,
            sampleCount: 1,
            seed: req.seed,
            enhancePrompt: true,
            // Audio natif disponible sur Veo 3
            ...(model === VEO_MODEL_PRIMARY && req.audio_prompt && {
              audioPrompt: req.audio_prompt,
              addWatermark: false,
            }),
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Veo ${model} erreur ${response.status}: ${body}`)
      }

      const operation = await response.json() as GeminiLROResponse

      // Polling de l'opération longue durée
      const { videoUrl, hasAudio } = await this.pollOperation(operation.name)

      return {
        videos: [
          {
            url: videoUrl,
            width: specs.width,
            height: specs.height,
            duration_seconds: req.duration_seconds ?? 8,
            has_audio: hasAudio,
            format: 'mp4',
            seed: req.seed,
          },
        ],
        provider: 'veo',
        duration_ms: Date.now() - start,
        model,
        estimated_cost_usd: this.estimateCost(req.duration_seconds ?? 8, model),
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Veo ${model} timeout (>${TIMEOUT_MS / 1000}s)`
          : err instanceof Error ? err.message : String(err)
      )
    }
  }

  // Polling LRO Gemini API
  private async pollOperation(
    operationName: string
  ): Promise<{ videoUrl: string; hasAudio: boolean }> {
    const maxAttempts = 45   // 45 × 4s = 3 min max
    const pollInterval = 4_000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, pollInterval))

      const res = await fetch(
        `${GEMINI_BASE_URL}/${operationName}?key=${this.apiKey}`
      )

      if (!res.ok) continue

      const op = await res.json() as GeminiLROResponse

      if (op.done) {
        if (op.error) throw new Error(`Veo opération échouée : ${op.error.message}`)

        // Réponse Gemini API — format predictions[]
        const prediction = op.response?.predictions?.[0]
        const videoUrl = prediction?.video?.uri ?? prediction?.gcsUri
        if (!videoUrl) throw new Error('Veo : URI vidéo absente dans la réponse LRO')

        return {
          videoUrl,
          hasAudio: prediction?.video?.encoding === 'mp4' || !!prediction?.audioUri,
        }
      }
    }

    throw new Error('Veo : timeout de polling LRO')
  }

  private estimateCost(durationSeconds: number, model: string): number {
    // Veo 3.1 generate : ~$0.40/s — Veo 3.1 fast : ~$0.15/s (estimations mars 2026)
    const ratePerSecond = model === VEO_MODEL_PRIMARY ? 0.40 : 0.15
    return Math.round(durationSeconds * ratePerSecond * 100) / 100
  }
}

// ── Types LRO Gemini API ──────────────────────────────────────────────────────

interface GeminiLROResponse {
  name: string
  done?: boolean
  error?: { code: number; message: string }
  response?: {
    predictions?: Array<{
      video?: { uri: string; encoding: string }
      gcsUri?: string
      audioUri?: string
    }>
  }
}
