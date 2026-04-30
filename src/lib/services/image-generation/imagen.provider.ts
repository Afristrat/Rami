// ============================================================
// Google Gemini Image Provider — Google AI Studio
// Modèles disponibles (mars 2026) :
//   • gemini-3.1-flash-image-preview  — 4K, grounding Google Images, multi-ratio
//   • gemini-2.5-flash-image          — standard, plus rapide
// API : Gemini API generateContent avec responseModalities IMAGE
// Auth : GOOGLE_AI_API_KEY
// ============================================================

import { ImageProvider, GenerationRequest, GenerationResult } from './types'

const GEMINI_IMAGE_MODEL_PRIMARY  = 'gemini-3.1-flash-image-preview'
const GEMINI_IMAGE_MODEL_FALLBACK = 'gemini-2.5-flash-image'
const GEMINI_BASE_URL             = 'https://generativelanguage.googleapis.com/v1beta'
const TIMEOUT_MS                  = 60_000

export class ImagenProvider implements ImageProvider {
  readonly name = 'google_imagen'

  private get apiKey(): string {
    const key = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY
    if (!key) throw new Error('GOOGLE_AI_API_KEY non configurée — https://aistudio.google.com/app/apikey')
    return key
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now()

    for (const model of [GEMINI_IMAGE_MODEL_PRIMARY, GEMINI_IMAGE_MODEL_FALLBACK]) {
      try {
        return await this.generateWithModel(req, model, start)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if ((msg.includes('403') || msg.includes('404') || msg.includes('not found') || msg.includes('preview')) && model === GEMINI_IMAGE_MODEL_PRIMARY) {
          continue
        }
        throw err
      }
    }

    throw new Error('Gemini Image : aucun modèle disponible')
  }

  private async generateWithModel(
    req: GenerationRequest,
    model: string,
    start: number
  ): Promise<GenerationResult> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${this.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: req.negative_prompt
                    ? `${req.positive_prompt}\n\nÉviter absolument : ${req.negative_prompt}`
                    : req.positive_prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
            imagenConfig: {
              aspectRatio: this.toAspectRatio(req.width, req.height),
              numberOfImages: req.num_images ?? 1,
              ...(model === GEMINI_IMAGE_MODEL_PRIMARY && {
                // Grounding Google Images pour les images de référence stylisée
                enhancePrompt: true,
              }),
            },
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Gemini Image ${model} erreur ${response.status}: ${body}`)
      }

      const data = await response.json() as GeminiImageResponse

      const parts = data.candidates?.[0]?.content?.parts ?? []
      const imageParts = parts.filter((p) => p.inlineData?.mimeType?.startsWith('image/'))

      if (!imageParts.length) {
        throw new Error('Gemini Image : aucune image dans la réponse')
      }

      return {
        images: imageParts.map((part) => ({
          url: `data:${part.inlineData!.mimeType};base64,${part.inlineData!.data}`,
          width: req.width,
          height: req.height,
          seed: req.seed ?? 0,
        })),
        provider: 'google_imagen',
        duration_ms: Date.now() - start,
        model,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Gemini Image ${model} timeout (>${TIMEOUT_MS / 1000}s)`
          : err instanceof Error ? err.message : String(err)
      )
    }
  }

  private toAspectRatio(width: number, height: number): string {
    const ratio = width / height
    if (ratio >= 1.7)  return '16:9'
    if (ratio >= 1.25) return '4:3'
    if (ratio <= 0.6)  return '9:16'
    if (ratio <= 0.8)  return '3:4'
    return '1:1'
  }
}

// ── Types Gemini Image API ────────────────────────────────────────────────────

interface GeminiImageResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        inlineData?: { mimeType: string; data: string }
      }>
    }
  }>
}
