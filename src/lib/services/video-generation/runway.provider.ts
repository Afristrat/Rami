// ============================================================
// Runway Gen-4.5 Provider — Contrôle caméra avancé — Fallback #1
// API : api.runwayml.com
// ============================================================

import {
  VideoProvider_Interface,
  VideoGenerationRequest,
  VideoGenerationResult,
  VIDEO_PLATFORM_SPECS,
} from './types'

// Gen-4 Turbo (mars 2026) — meilleur ratio qualité/vitesse Runway
// Gen-4.5 en preview sur runway.com mais pas encore API stable
const RUNWAY_MODEL = 'gen4_turbo'
const RUNWAY_BASE_URL = 'https://api.runwayml.com/v1'
const TIMEOUT_MS = 120_000

export class RunwayProvider implements VideoProvider_Interface {
  readonly name = 'runway' as const
  readonly supportsAudio = false
  readonly maxDurationSeconds = 30

  private get apiKey(): string {
    const key = process.env.RUNWAY_API_KEY
    if (!key) throw new Error('RUNWAY_API_KEY non configurée')
    return key
  }

  async generate(req: VideoGenerationRequest): Promise<VideoGenerationResult> {
    const start = Date.now()
    const specs = VIDEO_PLATFORM_SPECS[req.platform]

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    try {
      // Étape 1 : Créer la tâche de génération
      const createResponse = await fetch(`${RUNWAY_BASE_URL}/image_to_video`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-Runway-Version': '2024-11-06',
        },
        body: JSON.stringify({
          model: RUNWAY_MODEL,
          promptText: req.prompt,
          ratio: specs.aspect_ratio === '9:16' ? '720:1280' : '1280:720',
          duration: Math.min(req.duration_seconds ?? 10, this.maxDurationSeconds),
          seed: req.seed,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!createResponse.ok) {
        const body = await createResponse.text()
        throw new Error(`Runway erreur ${createResponse.status}: ${body}`)
      }

      const task = await createResponse.json() as RunwayTask

      // Étape 2 : Polling jusqu'à completion
      const videoUrl = await this.pollTask(task.id)

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
        provider: 'runway',
        duration_ms: Date.now() - start,
        model: RUNWAY_MODEL,
      }
    } catch (err) {
      clearTimeout(timeout)
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      throw new Error(
        isTimeout
          ? `Runway timeout (>${TIMEOUT_MS}ms)`
          : `Runway: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  private async pollTask(taskId: string): Promise<string> {
    const maxAttempts = 30
    const pollInterval = 4_000

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((r) => setTimeout(r, pollInterval))

      const res = await fetch(`${RUNWAY_BASE_URL}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Runway-Version': '2024-11-06',
        },
      })

      if (!res.ok) continue

      const task = await res.json() as RunwayTask

      if (task.status === 'SUCCEEDED') {
        const url = task.output?.[0]
        if (!url) throw new Error('Runway : URL vidéo absente dans la réponse')
        return url
      }

      if (task.status === 'FAILED') {
        throw new Error(`Runway : tâche échouée — ${task.failure ?? 'erreur inconnue'}`)
      }
    }

    throw new Error('Runway : timeout de polling')
  }
}

// ── Types Runway ──────────────────────────────────────────────────────────────

interface RunwayTask {
  id: string
  status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
  output?: string[]
  failure?: string
  createdAt: string
}
