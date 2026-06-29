// ============================================================
// Mishkāt — Types du contrat d'API (studio vidéo headless)
// Source de vérité : mishkat/schemas/brief.schema.json + contrat live
// (vérifié 2026-06-26 : GET /v1/brands → {"brands":["rami"]}).
// ============================================================

export const MISHKAT_AUDIENCES = [
  'etudiant',
  'institution',
  'investisseur',
  'grand_public',
  'pairs_tech',
  'interne',
] as const
export type MishkatAudience = (typeof MISHKAT_AUDIENCES)[number]

export const MISHKAT_TONES = [
  'premium',
  'insolent',
  'cinematic',
  'pedagogique',
  'urgence',
  'default',
] as const
export type MishkatTone = (typeof MISHKAT_TONES)[number]

export const MISHKAT_OBJECTIVES = [
  'awareness',
  'acquisition',
  'proof',
  'wrapped_shareable',
  'demo_day',
] as const
export type MishkatObjective = (typeof MISHKAT_OBJECTIVES)[number]

export const MISHKAT_CHANNELS = [
  'linkedin',
  'reels',
  'tiktok',
  'whatsapp_status',
  'youtube',
  'presentation',
  'instagram_feed',
] as const
export type MishkatChannel = (typeof MISHKAT_CHANNELS)[number]

export const MISHKAT_ASPECTS = ['16:9', '9:16', '1:1'] as const
export type MishkatAspect = (typeof MISHKAT_ASPECTS)[number]

export const MISHKAT_LANGS = ['fr', 'ar', 'darija', 'en'] as const
export type MishkatLang = (typeof MISHKAT_LANGS)[number]

export const MISHKAT_PROOFS = ['none', 'data', 'testimonial', 'live_demo', 'logo_wall'] as const
export type MishkatProof = (typeof MISHKAT_PROOFS)[number]

export interface MishkatBrief {
  brand_id: string
  intent: string
  audience: MishkatAudience
  channel_format: Array<{ channel: MishkatChannel; aspect: MishkatAspect }>
  language: { primary: MishkatLang; secondary?: MishkatLang; rtl?: boolean }
  tone: MishkatTone
  duration_s: number
  objective: MishkatObjective
  proof?: MishkatProof
  sound?: { music?: boolean; voiceover?: boolean; captions_burned?: boolean }
  sovereignty?: 'public' | 'sensitive'
  title?: string
}

export interface BrandTokens {
  brand_id: string
  palette: { primary: string; secondary: string; accent: string; bg: string; text: string }
  typography: {
    display: { family: string; url?: string; weight?: number }
    body: { family: string; url?: string; weight?: number }
  }
  logo_url: string
  media?: { backgrounds: string[] }
  /**
   * Spec psychologique calibré (Causse × Gestalt). C'est le CONTRAT que le
   * renderer Mishkāt doit consommer pour produire un visuel « pensé pour
   * l'impact » : couleurs liées à une émotion cible, forme Gestalt du secteur,
   * fond/dégradé calibrés (contraste WCAG garanti), style de composition.
   */
  psychology?: MishkatPsychologySpec
}

/**
 * Calibration psychologique d'une vidéo, dérivée par RAMI depuis le Brand DNA
 * (objectif cognitif + secteur + culture) via la matrice Causse et la
 * psychologie des formes (Gestalt). Toutes les couleurs sont des HEX #RRGGBB.
 */
export interface MishkatPsychologySpec {
  /** Émotion cible (clé Causse : confiance, urgence, aspiration, expertise…). */
  target_emotion: string
  /** Justification Causse de l'émotion (effet physiologique + intention). */
  emotion_rationale: string
  /** Palette calibrée à l'émotion, contraste texte/fond garanti (WCAG). */
  palette: {
    bg: string // fond de base calibré
    text: string // texte LISIBLE sur `bg` (WCAG)
    accent: string // accent (marque si réel, sinon couleur d'émotion Causse)
    onAccent: string // texte lisible sur `accent`
    secondary: string
    /** 2 arrêts de dégradé calibrés émotion (du fond vers l'accent). */
    gradient: [string, string]
  }
  /** Forme Gestalt dominante du secteur + son signal psychologique. */
  gestalt: { shape: string; signal: string; keywords: string }
  /** Style de composition recommandé (cf. règles RAMI objectif→style). */
  composition_style: string
  /** Culture primaire (maroc, international…) — pour les codes locaux. */
  culture: string | null
  /** Réseaux où la couleur d'émotion performe le mieux (Causse). */
  networks_optimal: string[]
}

export const MISHKAT_STATUSES = ['queued', 'generating', 'rendering', 'done', 'error'] as const
export type MishkatStatus = (typeof MISHKAT_STATUSES)[number]

export interface MishkatVariant {
  lang: string
  format: string
  gatePassed: boolean
  url: string
}

export interface MishkatScene {
  id: string
  image_prompt?: string
  [key: string]: unknown
}

export interface MishkatStoryboard {
  scenes: MishkatScene[]
  [key: string]: unknown
}

export interface MishkatProduction {
  id?: string
  status: MishkatStatus
  storyboard?: MishkatStoryboard
  variants?: MishkatVariant[]
  error?: string
}

export interface MishkatCreateResponse {
  id: string
  status: MishkatStatus
}
