// ============================================================
// Replicate Provider — FLUX.1 [dev] — Provider FALLBACK 1
// ============================================================

import { ImageProvider, GenerationRequest, GenerationResult } from './types'

const MODEL_VERSION = 'black-forest-labs/flux-dev'
const REPLICATE_BASE = 'https://api.replicate.com/v1'
const TIMEOUT_MS = 45_000
const POLL_INTERVAL_MS = 2_000

export class ReplicateProvider implements ImageProvider {
  readonly name = 'replicate'

  private get apiKey(): string {
    const key = process.env.REPLICATE_API_TOKEN
    if (!key) throw new Error('REPLICATE_API_TOKEN non configurée')
    return key
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now()

    // Créer la prédiction
    const createRes = await fetch(`${REPLICATE_BASE}/models/${MODEL_VERSION}/predictions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait',
      },
      body: JSON.stringify({
        input: {
          prompt: req.positive_prompt,
          width: req.width,
          height: req.height,
          num_inference_steps: req.num_inference_steps,
          guidance: req.guidance_scale,
          seed: req.seed,
          num_outputs: req.num_images ?? 1,
          output_format: 'webp',
          output_quality: 90,
        },
      }),
    })

    if (!createRes.ok) {
      const body = await createRes.text()
      throw new Error(`Replicate erreur ${createRes.status}: ${body}`)
    }

    let prediction = await createRes.json()

    // Polling si nécessaire
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed') {
      if (Date.now() - start > TIMEOUT_MS) {
        throw new Error(`Replicate timeout (>${TIMEOUT_MS}ms)`)
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))

      const pollRes = await fetch(`${REPLICATE_BASE}/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      })
      prediction = await pollRes.json()
    }

    if (prediction.status === 'failed') {
      throw new Error(`Replicate échec: ${prediction.error ?? 'erreur inconnue'}`)
    }

    const urls: string[] = Array.isArray(prediction.output)
      ? prediction.output
      : [prediction.output]

    return {
      images: urls.map((url: string) => ({
        url,
        width: req.width,
        height: req.height,
        seed: req.seed ?? 0,
      })),
      provider: 'replicate',
      duration_ms: Date.now() - start,
      model: MODEL_VERSION,
    }
  }
}
