// ============================================================
// Video Generation — Types partagés
// Plateformes cibles : TikTok, Instagram Reels, YouTube Shorts
// ============================================================

export type VideoProvider =
  | 'veo'
  | 'runway'
  | 'kling'
  | 'luma_ray'
  | 'wan'
  | 'ltx_video'
  | 'minimax_video'
  | 'hailuo'
  | 'sora'

export type VideoPlatform = 'tiktok' | 'instagram_reels' | 'youtube_shorts'

// Formats recommandés par plateforme
export const VIDEO_PLATFORM_SPECS: Record<
  VideoPlatform,
  { width: number; height: number; max_duration_s: number; aspect_ratio: string }
> = {
  tiktok: {
    width: 1080,
    height: 1920,
    max_duration_s: 60,
    aspect_ratio: '9:16',
  },
  instagram_reels: {
    width: 1080,
    height: 1920,
    max_duration_s: 90,
    aspect_ratio: '9:16',
  },
  youtube_shorts: {
    width: 1080,
    height: 1920,
    max_duration_s: 60,
    aspect_ratio: '9:16',
  },
}

export interface VideoGenerationRequest {
  prompt: string
  platform: VideoPlatform
  duration_seconds?: number  // défaut selon plateforme (15s)
  width?: number             // défaut selon plateforme
  height?: number            // défaut selon plateforme
  seed?: number
  // Options avancées (non supportées par tous les providers)
  audio_prompt?: string      // description de l'ambiance sonore
  reference_image_url?: string  // image de référence (style)
}

export interface GeneratedVideo {
  url: string
  width: number
  height: number
  duration_seconds: number
  has_audio: boolean
  format: 'mp4' | 'webm'
  seed?: number
}

export interface VideoGenerationResult {
  videos: GeneratedVideo[]
  provider: VideoProvider
  duration_ms: number
  model: string
  estimated_cost_usd?: number
}

export interface VideoProvider_Interface {
  name: VideoProvider
  supportsAudio: boolean
  maxDurationSeconds: number
  generate(req: VideoGenerationRequest): Promise<VideoGenerationResult>
}
