// ============================================================
// Kling 2.6 Provider (Kuaishou) — Fallback #2
// API : api.klingai.com
// ============================================================

import {
  VideoProvider_Interface,
  VideoGenerationRequest,
  VideoGenerationResult,
  VIDEO_PLATFORM_SPECS,
} from './types'

// Kling 2.1 (mars 2026) — version API stable la plus récente de Kling
const KLING_MODEL = 'kling-v2-1'
const KLING_BASE_URL = 'https://api.klingai.com/v1'
const TIMEOUT_MS = 120_000

export class KlingProvider implements VideoProvider_Interface {
  readonly name = 'kling' as const
  readonly supportsAudio = false
  readonly maxDurationSeconds = 60

  private get apiKey(): string {
    const key = process.env.KLING_API_KEY
    if (!key) throw new Error('KLING_API_KEY non configurée')
    return key
  }

  async generate(req: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const start = Date.now()
    const specs = VIDEO_PLATFORM_SPECS[req.platform]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      const createResponse = await fetch(`${KLING_BASE_URL}/videos/text2video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model_name: KLING_MODEL,
          prompt: req.prompt,
          negative_prompt: '',
          cfg_scale: 0.5,
          mode: 'pro',
          aspect_ratio: '9:16',
          duration: String(req.duration_seconds ?? 10),
          seed: req.seed,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!createResponse.ok) {
        const body = await createResponse.text()
        throw new Error(`Kling erreur ${createResponse.status}: ${body}`)
      }

      const data = await createResponse.json() as KlingCreateResponse
      const taskId = data.data?.task_id

      if (!taskId) throw new Error('Kling : task_id absent dans la réponse')

      const videoUrl = await this.pollTask(taskId)

      return {
        videos: [
          {
            url: videoUrl,
            width: specs.width,
            height: specs.height,
            duration_seconds: req.duration_seconds ?? 10,
            has_audio: false,
            format: 'mp4',
            seed: req.seed,
          },
        ],
        provider: 'kling',
        duration_ms: Date.now() - start,
        model: KLING_MODEL,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Kling timeout (>${TIMEOUT_MS}ms)`
          : `Kling: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  private async pollTask(taskId: string): Promise<string> {
    const maxAttempts = 30
    const pollInterval = 4_000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, pollInterval))

      const res = await fetch(`${KLING_BASE_URL}/videos/text2video/${taskId}`, {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
      })

      if (!res.ok) continue

      const data = await res.json() as KlingStatusResponse

      if (data.data?.task_status === 'succeed') {
        const url = data.data?.task_result?.videos?.[0]?.url
        if (!url) throw new Error('Kling : URL vidéo absente dans la réponse')
        return url
      }

      if (data.data?.task_status === 'failed') {
        throw new Error(`Kling : tâche échouée — ${data.data?.task_status_msg ?? 'erreur inconnue'}`)
      }
    }

    throw new Error('Kling : timeout de polling')
  }
}

// ── Types Kling ───────────────────────────────────────────────────────────────

interface KlingCreateResponse {
  code: number
  message: string
  data?: { task_id: string; task_status: string }
}

interface KlingStatusResponse {
  code: number
  data?: {
    task_id: string
    task_status: 'submitted' | 'processing' | 'succeed' | 'failed'
    task_status_msg?: string
    task_result?: {
      videos?: Array<{ id: string; url: string; duration: string }>
    }
  }
}
