// ============================================================
// RAMI — Types globaux
// ============================================================

export type Plan = 'free' | 'solo' | 'pro' | 'agency' | 'agency_plus' | 'enterprise'

export interface Tenant {
  id: string
  slug: string
  name: string
  owner_id: string
  plan: Plan
  logo_url?: string
  brand_dna?: BrandDNA
  created_at: string
  updated_at: string
}

export interface BrandDNA {
  // Identité
  name: string
  tagline?: string
  description?: string
  // Couleurs (Causse)
  primary_color: string
  secondary_color?: string
  accent_color?: string
  color_psychology?: string
  // Typographie
  font_primary?: string
  font_secondary?: string
  // Ton & voix
  tone: 'professional' | 'casual' | 'inspirational' | 'educational' | 'humorous'
  voice_attributes: string[]
  // Audience
  target_audience?: string
  personas?: string[]
  // Visuels (Gestalt)
  visual_style?: 'minimalist' | 'bold' | 'elegant' | 'playful' | 'corporate'
  gestalt_principles?: string[]
  // Metadata
  logo_url?: string
  last_enriched?: string
}

export interface SocialAccount {
  id: string
  tenant_id: string
  platform: Platform
  account_name: string
  account_id: string
  access_token_encrypted: string
  refresh_token_encrypted?: string
  expires_at?: string
  scopes: string[]
  is_active: boolean
  created_at: string
}

export type Platform =
  | 'twitter'
  | 'linkedin'
  | 'facebook'
  | 'instagram'
  | 'pinterest'
  | 'youtube'
  | 'tiktok'

export interface Post {
  id: string
  tenant_id: string
  title?: string
  content: string
  media_urls?: string[]
  platforms: Platform[]
  status: PostStatus
  scheduled_at?: string
  published_at?: string
  brand_dna_snapshot?: Partial<BrandDNA>
  ai_metadata?: AIMetadata
  created_at: string
  updated_at: string
}

export type PostStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'

export interface AIMetadata {
  model?: string
  prompt_tokens?: number
  completion_tokens?: number
  generation_time_ms?: number
  image_provider?: 'fal' | 'replicate' | 'together'
  guidance_scale?: number
}

export interface User {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role: UserRole
  tenant_id?: string
  created_at: string
}

export type UserRole = 'super_admin' | 'agency_owner' | 'brand_manager' | 'content_creator' | 'viewer'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
