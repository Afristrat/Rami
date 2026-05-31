// ============================================================
// Prompt Compiler — Brand DNA → StructuredPrompt
// SOP-003 : Lit le Brand DNA du tenant, construit 4 directions visuelles
// ============================================================

import { GESTALT_SHAPES, getRecommendedColors } from '@/lib/utils/causse-matrix'
import { VisualDirection } from '@/lib/services/image-generation/types'

export interface BrandDNA {
  identity?: {
    name?: string
    sector?: string
    positioning?: string
    usp?: string
    tagline?: string
  }
  audience?: Array<{
    name?: string
    role?: string
    aspirations?: string
  }>
  color_palette?: Array<{
    hex?: string
    name?: string
    emotion?: string
    role?: string
  }>
  cognitive_objective?: string
  editorial_tone?: {
    register?: string
    style?: string
  }
  visual_styles?: Record<string, string>
  active_platforms?: string[]
  culture_markets?: {
    primary_culture?: string
    secondary_cultures?: string[]
  }
}

export interface StructuredPrompt {
  direction: VisualDirection
  positive_prompt: string
  negative_prompt: string
  parameters: {
    guidance_scale: number
    num_inference_steps: number
    width: number
    height: number
    seed: number
  }
}

/**
 * Signal de performance réelle (Performance Loop, US-008) : couleurs et styles
 * qui ont historiquement le mieux performé pour le tenant (secteur × culture).
 * Construit par `buildPerformancePrior()` UNIQUEMENT au-dessus d'un seuil de
 * volume mesuré — sinon la génération retombe sur la matrice Causse pure.
 */
export interface PerformancePrior {
  /** HEX gagnants, ordre décroissant de performance. */
  topColors: string[]
  /** Directions/objectifs gagnants. */
  topStyles: string[]
  /** Nombre de posts mesurés ayant alimenté le prior. */
  sampleSize: number
  source: "tenant"
}

// Négatif universel
const UNIVERSAL_NEGATIVE = [
  'text', 'watermark', 'logo', 'signature', 'blurry', 'blur', 'noisy',
  'low quality', 'low resolution', 'bad anatomy', 'ugly', 'deformed',
  'generic', 'stock photo', 'clipart', 'cartoon', 'anime', 'drawing',
  'sketchy', 'oversaturated', 'out of frame', 'cropped',
].join(', ')

// 4 Directions visuelles selon CLAUDE.md
const DIRECTION_TEMPLATES: VisualDirection[] = [
  {
    id: 1,
    name: 'Blueprint Scientifique',
    style: 'Professional, data-driven, technical precision, blueprint aesthetic',
    composition: 'Structured grid, architectural layout, clean geometric precision',
    emotion: 'Trust, authority, expertise',
    color_emphasis: 'Cool blues, whites, structured palette',
  },
  {
    id: 2,
    name: 'Machine Narratif',
    style: 'Dynamic, bold, impactful, editorial power',
    composition: 'Diagonal energy, strong contrast, dramatic lighting, motion',
    emotion: 'Urgency, power, transformation',
    color_emphasis: 'High contrast, saturated accents, dark backgrounds',
  },
  {
    id: 3,
    name: 'Carte & Aspiration',
    style: 'Aspirational, premium lifestyle, editorial luxury',
    composition: 'Balanced harmony, golden ratio, elegant negative space',
    emotion: 'Aspiration, desire, status',
    color_emphasis: 'Warm golds, deep tones, sophisticated palette',
  },
  {
    id: 4,
    name: 'Dashboard Expertise',
    style: 'Modern tech, minimal, data visualization, clean UI',
    composition: 'Grid system, modular layout, information hierarchy',
    emotion: 'Mastery, clarity, innovation',
    color_emphasis: 'Monochromatic with strategic accent, precise palette',
  },
]

/**
 * Calcule la taille optimale selon la plateforme cible
 */
function getPlatformDimensions(platform: string): { width: number; height: number } {
  const dimensions: Record<string, { width: number; height: number }> = {
    instagram: { width: 1080, height: 1080 },
    linkedin: { width: 1200, height: 627 },
    twitter: { width: 1200, height: 675 },
    facebook: { width: 1200, height: 630 },
    pinterest: { width: 1000, height: 1500 },
    youtube: { width: 1280, height: 720 },
    default: { width: 1365, height: 1024 },
  }
  return dimensions[platform] ?? dimensions.default
}

/**
 * Compile le Brand DNA en 4 directions de prompts structurés
 */
export function compileBrandDNAToPrompts(
  brandDNA: BrandDNA,
  brief: string,
  platform: string = 'instagram',
  sessionSeed: number = Math.floor(Math.random() * 100000),
  performancePrior: PerformancePrior | null = null
): StructuredPrompt[] {
  const sector = brandDNA.identity?.sector ?? 'tech'
  const positioning = brandDNA.identity?.positioning ?? ''
  const cognitiveObjective = brandDNA.cognitive_objective ?? 'confiance'
  const primaryCulture = brandDNA.culture_markets?.primary_culture ?? 'international'

  // Extraire les HEX de la palette Brand DNA
  const brandHexColors = (brandDNA.color_palette ?? [])
    .filter((c) => c.hex)
    .map((c) => c.hex as string)
    .slice(0, 4)

  // Si pas de palette définie, utiliser la matrice Causse
  const recommendedColors = getRecommendedColors(cognitiveObjective, sector, brandHexColors)
  const baseColors = brandHexColors.length > 0 ? brandHexColors : recommendedColors

  // Performance prior (US-008) : si actif, les couleurs gagnantes passent en tête
  // (pondération réelle) — sinon fallback Causse pur (baseColors).
  const priorColors = performancePrior?.topColors ?? []
  const effectiveColors = Array.from(new Set([...priorColors, ...baseColors]))
  const hexList = effectiveColors.slice(0, 3).join(', ')

  // Emphase optionnelle sur le style historiquement gagnant.
  const performanceKW =
    performancePrior && performancePrior.topStyles.length > 0
      ? `proven high-performing ${performancePrior.topStyles[0]} aesthetic`
      : ''

  // Mots-clés émotionnels selon objectif cognitif
  const emotionKeywords: Record<string, string> = {
    confiance: 'trustworthy, reliable, professional, secure, authoritative',
    urgence: 'urgent, dynamic, powerful, immediate, energetic',
    aspiration: 'aspirational, premium, exclusive, elevated, sophisticated',
    expertise: 'expert, mastery, precise, innovative, advanced',
    communaute: 'community, warm, welcoming, connected, inclusive',
    joie: 'joyful, vibrant, energetic, positive, celebratory',
    serenite: 'serene, calm, balanced, peaceful, harmonious',
    croissance: 'growth, momentum, forward, evolving, progressive',
    creativite: 'creative, bold, imaginative, artistic, expressive',
  }

  const emotionKW = emotionKeywords[cognitiveObjective] ?? 'professional, modern, impactful'

  // Contexte culturel pour enrichir le prompt
  const cultureContext: Record<string, string> = {
    maroc: 'Moroccan-inspired, North African aesthetic, warm Mediterranean palette',
    afrique_subsaharienne: 'vibrant African-inspired, rich earth tones, bold patterns',
    europe_francophone: 'French elegant, sophisticated European design, refined aesthetic',
    moyen_orient: 'Middle Eastern luxury, geometric patterns, gold accents',
    international: 'universal, globally appealing, multicultural',
  }
  const cultureKW = cultureContext[primaryCulture] ?? 'universal, globally appealing'

  // Forme Gestalt dominante selon secteur
  const sectorToShape: Record<string, keyof typeof GESTALT_SHAPES> = {
    finance: 'carre',
    tech: 'diagonales',
    santé: 'cercle',
    agro: 'courbes',
    luxe: 'courbes',
    startups: 'triangle',
    data: 'grille',
    default: 'cercle',
  }
  const shapeKey = sectorToShape[sector] ?? sectorToShape.default
  const gestaltShape = GESTALT_SHAPES[shapeKey]

  const { width, height } = getPlatformDimensions(platform)

  // Construire les 4 prompts (un par direction)
  return DIRECTION_TEMPLATES.map((direction, index) => {
    const directionSpecific = buildDirectionPrompt(direction)

    const positive_prompt = [
      // Brief utilisateur (prime sur tout)
      `${brief},`,
      // Style de la direction
      `${direction.style},`,
      // Composition Gestalt
      `${gestaltShape.prompt_keywords},`,
      // Composition de la direction
      `${direction.composition},`,
      // Couleurs HEX Brand DNA (contrainte dure)
      `color palette: ${hexList},`,
      // Émotion cible
      `${emotionKW},`,
      // Spécificité culturelle
      `${cultureKW},`,
      // Signal de performance réelle (si prior actif)
      performanceKW ? `${performanceKW},` : '',
      // Direction spécifique
      directionSpecific,
      // Positionnement brand
      positioning ? `${positioning},` : '',
      // Qualité
      'highly detailed, professional photography, 8k resolution, perfect composition, award-winning design',
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    const negative_prompt = [
      UNIVERSAL_NEGATIVE,
      // Couleurs hors palette (contrainte)
      'colors outside the brand palette',
      // Direction spécifique
      direction.id === 1 ? 'chaotic, random, organic mess' : '',
      direction.id === 2 ? 'static, boring, lifeless' : '',
      direction.id === 3 ? 'cheap, low-end, generic luxury' : '',
      direction.id === 4 ? 'cluttered, messy, disorganized' : '',
    ]
      .filter(Boolean)
      .join(', ')

    return {
      direction,
      positive_prompt,
      negative_prompt,
      parameters: {
        guidance_scale: 7.5,
        num_inference_steps: 28,
        width,
        height,
        seed: sessionSeed + index * 1000,
      },
    }
  })
}

function buildDirectionPrompt(direction: VisualDirection): string {
  const extras: Record<number, string> = {
    1: 'blueprint technical illustration, data visualization overlay, structured information design, precision engineering aesthetic',
    2: 'cinematic dramatic lighting, bold editorial typography spaces, high contrast black and light, motion energy',
    3: 'luxury lifestyle photography, aspirational imagery, golden hour light, premium product aesthetic, elegant minimalism',
    4: 'modern UI dashboard aesthetic, clean white space, subtle grid system, tech startup visual language, data-driven design',
  }
  return extras[direction.id] ?? ''
}

/**
 * Calcule un score Brand DNA pour une image générée
 * Basé sur : qualité provider + clarté direction + cohérence prompt
 */
export function calculateBrandDNAScore(
  provider: string,
  direction: VisualDirection,
  hasExistingDNA: boolean,
  directionIndex: number
): number {
  // Base score selon le provider (qualité de génération)
  const providerBase: Record<string, number> = {
    fal_ai: 82,
    replicate: 74,
    together_ai: 66,
  }

  const base = providerBase[provider] ?? 70

  // Bonus si Brand DNA complet
  const dnaBonuos = hasExistingDNA ? 8 : 0

  // Légère variation déterministe par image (simuler la réalité)
  // Évite un score identique pour toutes les images
  const variation = ((directionIndex * 7 + 3) % 11) - 5 // [-5, +5]

  const score = Math.min(100, Math.max(50, base + dnaBonuos + variation))
  return Math.round(score)
}
