'use server'

// ============================================================
// Video Actions — Server Actions pour la génération de vidéos
// Plateformes : TikTok, Instagram Reels, YouTube Shorts
// Provider chain : Veo → Runway → Kling → Luma → Wan
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { generateVideo } from '@/lib/services/video-generation'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import type { VideoPlatform } from '@/lib/services/video-generation/types'
import { GenerateVideoSchema, type GenerateVideoInput } from '@/lib/schemas/video.schema'

// ── Types de résultat ─────────────────────────────────────────────────────────

export interface VideoGenerationActionResult {
  success: boolean
  video_url?: string
  provider?: string
  model?: string
  duration_ms?: number
  width?: number
  height?: number
  duration_seconds?: number
  has_audio?: boolean
  db_id?: string
  error?: string
}

// ── Action principale ─────────────────────────────────────────────────────────

export async function generateVideoAction(
  input: GenerateVideoInput
): Promise<VideoGenerationActionResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: 'Tenant introuvable' }

  // Validation Zod
  const parsed = GenerateVideoSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Données invalides' }
  }

  const { prompt, platform, duration_seconds, reference_image_url, audio_prompt } = parsed.data

  const startTime = Date.now()

  try {
    const result = await generateVideo({
      prompt,
      platform: platform as VideoPlatform,
      duration_seconds,
      reference_image_url: reference_image_url || undefined,
      audio_prompt: audio_prompt || undefined,
    })

    if (!result.videos.length) {
      return { success: false, error: 'Aucune vidéo générée' }
    }

    const video = result.videos[0]

    // Persister en DB
    const { data: dbRecord } = await supabase
      .from('generated_videos')
      .insert({
        tenant_id: tenantId,
        filename: `rami-video-${Date.now()}.${video.format}`,
        r2_url: video.url,
        format: video.format,
        width: video.width,
        height: video.height,
        duration_seconds: video.duration_seconds,
        platform,
        prompt_used: prompt,
        provider_used: result.provider,
        model_used: result.model,
        has_audio: video.has_audio,
        status: 'ready',
        generation_cost_usd: result.estimated_cost_usd ?? null,
      })
      .select('id')
      .single()

    return {
      success: true,
      video_url: video.url,
      provider: result.provider,
      model: result.model,
      duration_ms: Date.now() - startTime,
      width: video.width,
      height: video.height,
      duration_seconds: video.duration_seconds,
      has_audio: video.has_audio,
      db_id: dbRecord?.id,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { success: false, error: message }
  }
}

/**
 * Récupère les vidéos générées récentes du tenant
 */
export async function getRecentVideosAction(limit = 12): Promise<{
  videos: Array<{
    id: string
    r2_url: string | null
    platform: string | null
    duration_seconds: number | null
    width: number | null
    height: number | null
    prompt_used: string | null
    provider_used: string | null
    has_audio: boolean
    status: string
    created_at: string
  }>
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { videos: [], error: 'Non authentifié' }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { videos: [], error: 'Tenant introuvable' }

  const { data, error } = await supabase
    .from('generated_videos')
    .select('id, r2_url, platform, duration_seconds, width, height, prompt_used, provider_used, has_audio, status, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return { videos: [], error: error.message }

  return {
    videos: (data ?? []).map((v) => ({
      id: v.id,
      r2_url: v.r2_url,
      platform: v.platform,
      duration_seconds: v.duration_seconds,
      width: v.width,
      height: v.height,
      prompt_used: v.prompt_used,
      provider_used: v.provider_used,
      has_audio: v.has_audio ?? false,
      status: v.status ?? 'unknown',
      created_at: v.created_at,
    })),
  }
}
