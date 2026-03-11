// ============================================================
// Together AI Provider — FLUX.1 [schnell] — Provider FALLBACK 2
// ============================================================

import { ImageProvider, GenerationRequest, GenerationResult } from './types'

const MODEL = 'black-forest-labs/FLUX.1-schnell-Free'
const TOGETHER_BASE = 'https://api.together.xyz/v1'
const TIMEOUT_MS = 30_000

export class TogetherProvider implements ImageProvider {
  readonly name = 'together_ai'

  private get apiKey(): string {
    const key = process.env.TOGETHER_API_KEY
    if (!key) throw new Error('TOGETHER_API_KEY non configurée')
    return key
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const response = await fetch(`${TOGETHER_BASE}/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          prompt: req.positive_prompt,
          width: Math.min(req.width, 1024),
          height: Math.min(req.height, 1024),
          steps: Math.min(req.num_inference_steps, 4), // FLUX schnell max 4 steps
          n: req.num_images ?? 1,
          seed: req.seed,
          response_format: 'url',
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Together AI erreur ${response.status}: ${body}`)
      }

      const data = await response.json()

      return {
        images: (data.data ?? []).map((img: { url?: string; b64_json?: string; seed?: number }, idx: number) => ({
          url: img.url ?? `data:image/png;base64,${img.b64_json}`,
          width: Math.min(req.width, 1024),
          height: Math.min(req.height, 1024),
          seed: img.seed ?? req.seed ?? idx,
        })),
        provider: 'together_ai',
        duration_ms: Date.now() - start,
        model: MODEL,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Together AI timeout (>${TIMEOUT_MS}ms)`
          : `Together AI: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }
}
