// ============================================================
// Fal.ai Provider — FLUX.1 [dev] — Provider PRIMAIRE
// ============================================================

import { ImageProvider, GenerationRequest, GenerationResult } from './types'

// FLUX1.1 Pro Ultra (mars 2026) — meilleure qualité, 4MP natif
const FAL_MODEL = 'fal-ai/flux-pro/v1.1-ultra'
const FAL_BASE_URL = 'https://fal.run'
const TIMEOUT_MS = 30_000

export class FalProvider implements ImageProvider {
  readonly name = 'fal_ai'

  private get apiKey(): string {
    const key = process.env.FAL_KEY ?? process.env.FAL_API_KEY
    if (!key) throw new Error('FAL_KEY non configurée')
    return key
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(`${FAL_BASE_URL}/${FAL_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: req.positive_prompt,
          image_size: this.toImageSize(req.width, req.height),
          num_inference_steps: req.num_inference_steps,
          guidance_scale: req.guidance_scale,
          num_images: req.num_images ?? 1,
          seed: req.seed,
          enable_safety_checker: true,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Fal.ai erreur ${response.status}: ${body}`)
      }

      const data = await response.json()

      return {
        images: (data.images ?? []).map((img: { url: string; width: number; height: number }) => ({
          url: img.url,
          width: img.width,
          height: img.height,
          seed: data.seed ?? req.seed ?? 0,
        })),
        provider: 'fal_ai',
        duration_ms: Date.now() - start,
        model: FAL_MODEL,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Fal.ai timeout (>${TIMEOUT_MS}ms)`
          : `Fal.ai: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  private toImageSize(width: number, height: number): string {
    const ratio = width / height
    if (ratio >= 1.7) return 'landscape_16_9'
    if (ratio >= 1.3) return 'landscape_4_3'
    if (ratio <= 0.6) return 'portrait_9_16'
    if (ratio <= 0.8) return 'portrait_4_3'
    return 'square'
  }
}
