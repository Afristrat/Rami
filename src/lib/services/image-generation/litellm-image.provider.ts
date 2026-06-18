// ============================================================
// LiteLLM Image Provider — génération via le proxy LiteLLM (clé virtuelle plafonnée)
// Endpoint : ${OPENAI_BASE_URL}/images/generations (OpenAI-compatible)
// Clé : LITELLM_IMAGE_API_KEY (clé virtuelle plafonnée à 5 $, scopée aux modèles d'image)
// Cascade « moins cher d'abord » (prix proxy réels) :
//   gemini-2.5-flash-image (0,039 $) → gemini-3.1-flash-image (0,067 $) → gemini-3-pro-image (0,134 $)
// Réponse : data[].b64_json (base64) → data URI gérée en amont du stockage MinIO
// ============================================================

import { ImageProvider, GenerationRequest, GenerationResult } from './types'

const TIMEOUT_MS = 60_000

// Ordre par défaut : du moins cher au plus cher (cf. prix configurés dans le proxy).
const DEFAULT_MODELS = [
  'gemini-2.5-flash-image',
  'gemini-3.1-flash-image',
  'gemini-3-pro-image',
]

export class LiteLLMImageProvider implements ImageProvider {
  readonly name = 'litellm_image'

  private get baseUrl(): string {
    const base = process.env.OPENAI_BASE_URL
    if (!base) throw new Error('OPENAI_BASE_URL non configurée')
    return base.replace(/\/$/, '')
  }

  private get apiKey(): string {
    const key = process.env.LITELLM_IMAGE_API_KEY
    if (!key) throw new Error('LITELLM_IMAGE_API_KEY non configurée')
    return key
  }

  /** Modèles à essayer, du moins cher au plus cher (surchargeable via LITELLM_IMAGE_MODELS). */
  private get models(): string[] {
    const env = process.env.LITELLM_IMAGE_MODELS
    if (env) {
      const list = env.split(',').map((m) => m.trim()).filter(Boolean)
      if (list.length > 0) return list
    }
    return DEFAULT_MODELS
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now()
    const prompt = req.negative_prompt
      ? `${req.positive_prompt}\n\nExclure : ${req.negative_prompt}`
      : req.positive_prompt

    const errors: string[] = []

    for (const model of this.models) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
      try {
        const res = await fetch(`${this.baseUrl}/images/generations`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ model, prompt, n: req.num_images ?? 1 }),
          signal: controller.signal,
        })
        clearTimeout(timeout)

        if (!res.ok) {
          const body = await res.text()
          errors.push(`${model}: ${res.status} ${body.slice(0, 160)}`)
          continue // modèle suivant (plus cher)
        }

        const data = (await res.json()) as LiteLLMImageResponse
        const images = (data.data ?? [])
          .map((d) => {
            if (d.b64_json) {
              return {
                url: `data:image/png;base64,${d.b64_json}`,
                width: req.width,
                height: req.height,
                seed: req.seed ?? 0,
              }
            }
            if (d.url) {
              return { url: d.url, width: req.width, height: req.height, seed: req.seed ?? 0 }
            }
            return null
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)

        if (images.length === 0) {
          errors.push(`${model}: aucune image dans la réponse`)
          continue
        }

        return {
          images,
          provider: 'litellm_image',
          duration_ms: Date.now() - start,
          model,
        }
      } catch (err) {
        clearTimeout(timeout)
        const isTimeout = err instanceof Error && err.name === 'AbortError'
        errors.push(
          `${model}: ${isTimeout ? `timeout >${TIMEOUT_MS}ms` : err instanceof Error ? err.message : String(err)}`
        )
      }
    }

    throw new Error(`LiteLLM image — tous les modèles ont échoué: ${errors.join(' | ')}`)
  }
}

// ── Type réponse OpenAI-compatible /images/generations ───────────────────────
interface LiteLLMImageResponse {
  data?: Array<{ b64_json?: string; url?: string; revised_prompt?: string }>
}
