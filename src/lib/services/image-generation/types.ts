// ============================================================
// Image Generation — Types partagés
// ============================================================

export interface GenerationRequest {
  positive_prompt: string
  negative_prompt: string
  width: number
  height: number
  guidance_scale: number
  num_inference_steps: number
  seed?: number
  num_images?: number
}

export interface GeneratedImage {
  url: string
  width: number
  height: number
  seed: number
}

export interface GenerationResult {
  images: GeneratedImage[]
  provider: 'litellm_image' | 'nano_banana' | 'fal_ai' | 'google_imagen' | 'replicate' | 'together_ai'
  duration_ms: number
  model: string
}

export interface ProviderError {
  provider: string
  error: string
  duration_ms: number
}

export interface ImageProvider {
  name: string
  generate(req: GenerationRequest): Promise<GenerationResult>
}

export interface VisualDirection {
  id: 1 | 2 | 3 | 4
  name: string
  style: string
  composition: string
  emotion: string
  color_emphasis: string
}

export interface GeneratedVisual {
  direction: VisualDirection
  image: GeneratedImage
  provider: string
  brand_dna_score: number
  prompt_used: string
  seed: number
}

export interface VisualSession {
  session_id: string
  tenant_id: string
  brief: string
  platform: string
  directions: VisualDirection[]
  visuals: GeneratedVisual[]
  created_at: string
}
