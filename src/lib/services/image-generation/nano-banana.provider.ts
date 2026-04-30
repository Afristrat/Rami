// ============================================================
// Nano Banana Provider — Gemini 3 Pro Image Preview — Provider PRINCIPAL
// API : Google Generative Language API v1beta
// Modèle : gemini-3-pro-image-preview (Nano Banana Pro chez Google)
// Clé : GEMINI_API_KEY (Google AI Studio)
// Réponse : base64 inline data → data URI retournée au caller
// ============================================================

import { ImageProvider, GenerationRequest, GenerationResult } from './types'

const GOOGLE_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta'
const MODEL = 'gemini-3-pro-image-preview'
const TIMEOUT_MS = 30_000

export class NanoBananaProvider implements ImageProvider {
  readonly name = 'nano_banana'

  private get apiKey(): string {
    const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_AI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY non configurée')
    return key
  }

  async generate(req: GenerationRequest): Promise<GenerationResult> {
    const start = Date.now()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const url = `${GOOGLE_BASE_URL}/models/${MODEL}:generateContent?key=${this.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: req.negative_prompt
                    ? `${req.positive_prompt}\n\nExclure : ${req.negative_prompt}`
                    : req.positive_prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['IMAGE'],
          },
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const body = await response.text()
        throw new Error(`Nano Banana erreur ${response.status}: ${body}`)
      }

      const data = await response.json() as GeminiGenerateContentResponse

      // Extraire les parties inline image de la réponse
      const images: Array<{ url: string; width: number; height: number; seed: number }> = []

      for (const candidate of data.candidates ?? []) {
        for (const part of candidate.content?.parts ?? []) {
          if (part.inlineData?.data && part.inlineData.mimeType) {
            // Convertir en data URI — le workflow RAMI gère les data URIs en amont du stockage MinIO
            const dataUri = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`
            images.push({
              url: dataUri,
              width: req.width,
              height: req.height,
              seed: req.seed ?? 0,
            })
          }
        }
      }

      if (images.length === 0) {
        throw new Error('Nano Banana : aucune image dans la réponse Gemini')
      }

      return {
        images,
        provider: 'nano_banana',
        duration_ms: Date.now() - start,
        model: MODEL,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Nano Banana timeout (>${TIMEOUT_MS}ms)`
          : `Nano Banana: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }
}

// ── Types réponse Gemini generateContent ─────────────────────────────────────

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
        inlineData?: {
          mimeType: string
          data: string  // base64
        }
      }>
      role?: string
    }
    finishReason?: string
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
  }
}
