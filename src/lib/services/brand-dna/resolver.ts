// ============================================================
// Brand DNA Resolver — SOURCE UNIQUE DE VÉRITÉ de l'identité visuelle
// ============================================================
// Tout moteur de création (post-visuel composé, carrousel, présentations, PDF,
// aperçus UI) DOIT passer par ce module pour obtenir ses tokens de marque. Plus
// aucune couleur d'accent ni forme ni logo hardcodés dans un renderer.
//
// Garanties (preuve par tests) :
//   • COULEUR  : palette HEX réelle du tenant (IDs Causse résolus) + accent
//                + `onAccent` LISIBLE calculé par luminance (contraste WCAG) →
//                jamais de texte illisible sur la couleur de marque.
//   • FORME    : forme Gestalt dérivée du SECTEUR (mapping exhaustif des 30
//                secteurs) — la « psychologie des formes » promise par le pitch.
//   • LOGO     : logo validé (data URI exploitable) OU fallback MONOGRAMME
//                (initiales) — présence de marque garantie même sans logo.
//   • TYPO/TON : exposés pour les moteurs qui savent les exploiter.
//   • FALLBACK : un DNA incomplet ne casse jamais le rendu (valeurs sûres).
//
// PUR (aucune dépendance DB/IO) → entièrement testable. Réutilise
// `normalizeBrandDNA` (ne duplique pas la résolution de palette).

import { normalizeBrandDNA, causseColorToHex } from "./normalize"
import { GESTALT_SHAPES } from "@/lib/utils/causse-matrix"

export type GestaltShapeKey = keyof typeof GESTALT_SHAPES

/** Tokens d'identité résolus, prêts à consommer par n'importe quel renderer. */
export interface BrandIdentity {
  // ── Couleurs ──────────────────────────────────────────────────────────────
  /** Palette HEX réelle (1 à 3 entrées), du Brand DNA ou fallback Causse sûr. */
  palette: string[]
  /** Couleur d'accent dominante (HEX). */
  accent: string
  /** Texte LISIBLE posé SUR `accent` (#FFFFFF ou quasi-noir) — contraste WCAG. */
  onAccent: string
  /** Couleur secondaire (HEX) si disponible, sinon null. */
  secondary: string | null
  /** Vrai si l'accent provient d'une VRAIE couleur de marque (pas du fallback). */
  hasBrandColor: boolean

  // ── Identité de marque ──────────────────────────────────────────────────────
  brandName: string | null
  /** Handle d'affichage (ex. "AI-Mpower") — borné à 60 car. */
  handle: string | null
  /** Initiales de repli (1-2 lettres MAJ) quand pas de logo. Toujours présent. */
  monogram: string
  /** Data URI du logo si exploitable (png/jpeg/webp/svg, taille raisonnable). */
  logoDataUrl: string | null
  /** Vrai si un logo exploitable est disponible. */
  hasLogo: boolean

  // ── Forme (Gestalt) ─────────────────────────────────────────────────────────
  shapeKey: GestaltShapeKey
  /** Signal psychologique de la forme (FR). */
  shapeSignal: string
  /** Mots-clés de prompt image associés à la forme. */
  shapePromptKeywords: string

  // ── Typographie ─────────────────────────────────────────────────────────────
  headingFamily: string | null
  bodyFamily: string | null

  // ── Contexte (texte / prompts) ──────────────────────────────────────────────
  sector: string | null
  cognitiveObjective: string | null
  culture: string | null
  tone: string | null
}

// ── Contraste (WCAG 2.1) ──────────────────────────────────────────────────────

const NEAR_BLACK = "#0B0B0F"
const WHITE = "#FFFFFF"
const HEX6 = /^#[0-9a-fA-F]{6}$/

/** Vrai si la chaîne est un HEX #RRGGBB valide. PUR. */
export function isHex6(value: unknown): value is string {
  return typeof value === "string" && HEX6.test(value)
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  if (!isHex6(hex)) return null
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

/** Luminance relative WCAG d'un canal sRGB (0..1). */
function channelLuminance(c: number): number {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

/** Luminance relative WCAG d'une couleur HEX (0 = noir, 1 = blanc). PUR. */
export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  return (
    0.2126 * channelLuminance(rgb.r) +
    0.7152 * channelLuminance(rgb.g) +
    0.0722 * channelLuminance(rgb.b)
  )
}

/** Ratio de contraste WCAG entre deux couleurs HEX (1..21). PUR. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Renvoie la couleur de TEXTE la plus lisible (blanc ou quasi-noir) à poser sur
 * un fond `bg`, en maximisant le contraste WCAG. PUR. Garantit qu'on n'écrit
 * jamais de texte sombre sur une couleur de marque sombre (ni l'inverse).
 */
export function readableTextColor(bg: string): string {
  if (!isHex6(bg)) return WHITE
  return contrastRatio(bg, WHITE) >= contrastRatio(bg, NEAR_BLACK) ? WHITE : NEAR_BLACK
}

// ── Logo ──────────────────────────────────────────────────────────────────────

/** Taille max d'un data URI logo acceptée (≈ 1,5 Mo base64). Au-delà → ignoré. */
const MAX_LOGO_CHARS = 1_500_000
const LOGO_DATAURI = /^data:image\/(png|jpe?g|webp|svg\+xml);base64,/i

/**
 * Vrai si la valeur est un data URI image exploitable (format supporté par les
 * renderers Satori/@react-pdf + taille raisonnable). PUR.
 */
export function isUsableLogo(value: unknown): value is string {
  return (
    typeof value === "string" &&
    LOGO_DATAURI.test(value) &&
    value.length > 64 &&
    value.length <= MAX_LOGO_CHARS
  )
}

// ── Monogramme ─────────────────────────────────────────────────────────────────

/**
 * Initiales de repli (1-2 lettres MAJ) à partir d'un nom de marque. Si plusieurs
 * mots significatifs → 1ʳᵉ lettre des 2 premiers ; sinon 2 premières lettres.
 * Fallback ultime "•" si rien d'exploitable. PUR.
 */
export function monogramFrom(name: string | null | undefined): string {
  const cleaned = (name ?? "").replace(/[^\p{L}\p{N}\s-]/gu, " ").trim()
  if (!cleaned) return "•"
  const words = cleaned.split(/[\s-]+/).filter(Boolean)
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase()
  }
  return words[0].slice(0, 2).toUpperCase()
}

// ── Secteur → forme Gestalt (mapping EXHAUSTIF des 30 secteurs) ────────────────
// Les IDs proviennent de SECTORS (brand-dna.schema.ts). Toute valeur inconnue
// (legacy, "autre", custom) retombe sur `cercle` (unité/communauté, neutre).

const SECTOR_TO_SHAPE: Record<string, GestaltShapeKey> = {
  // Stabilité / ordre → carré
  finance_banque: "carre",
  finance_islamique: "carre",
  assurance_mutuelles: "carre",
  immobilier_promotion: "carre",
  btp_construction: "carre",
  juridique_droit: "carre",
  industrie_manufacturing: "carre",
  // Données / clarté / systématique → grille
  ia_data: "grille",
  cybersecurite: "grille",
  media_presse: "grille",
  telecommunications: "grille",
  // Innovation / vitesse → diagonales
  tech_saas: "diagonales",
  ecommerce_marketplace: "diagonales",
  energie_environnement: "diagonales",
  // Ambition / performance / progression → triangle
  consulting_conseil: "triangle",
  sport_fitness: "triangle",
  education_formation: "triangle",
  edtech_elearning: "triangle",
  marketing_publicite: "triangle",
  // Communauté / humain / protection → cercle
  sante_medical: "cercle",
  pharmacie_parapharmacie: "cercle",
  bien_etre_spa: "cercle",
  ressources_humaines: "cercle",
  ong_social_impact: "cercle",
  // Élégance / naturel / fluidité → courbes
  luxe_haute_couture: "courbes",
  mode_pret_a_porter: "courbes",
  beaute_cosmetiques: "courbes",
  tourisme_hospitality: "courbes",
  restauration_food: "courbes",
  agroalimentaire_agriculture: "courbes",
}

/**
 * Forme Gestalt dominante d'un secteur. Tolérant : accepte les IDs des 30
 * secteurs ET quelques alias legacy (finance, tech, santé, luxe…). PUR.
 */
export function sectorToShapeKey(sector: string | null | undefined): GestaltShapeKey {
  if (!sector) return "cercle"
  const s = sector.trim().toLowerCase()
  if (SECTOR_TO_SHAPE[s]) return SECTOR_TO_SHAPE[s]
  // Alias legacy / préfixes (le secteur peut venir d'anciennes données).
  if (s.startsWith("finance") || s.includes("banque") || s.includes("assurance")) return "carre"
  if (s.startsWith("tech") || s.includes("saas") || s.includes("startup")) return "diagonales"
  if (s.includes("data") || s.includes("cyber")) return "grille"
  if (s.includes("luxe") || s.includes("mode") || s.includes("beaut") || s.includes("food") || s.includes("agro"))
    return "courbes"
  if (s.includes("sante") || s.includes("santé") || s.includes("sant") || s.includes("rh") || s.includes("ong"))
    return "cercle"
  if (s.includes("sport") || s.includes("consulting") || s.includes("educ")) return "triangle"
  return "cercle"
}

// ── Résolution principale ──────────────────────────────────────────────────────

const FALLBACK_ACCENT = "#1D4ED8" // bleu_roi : neutre, confiance, contraste sûr

/**
 * Résout l'identité visuelle complète d'un tenant à partir de son `brand_dna`
 * brut (shape plate réelle ou nestée) + son nom. Fournit des tokens sûrs et
 * lisibles, avec fallbacks gracieux. PUR.
 *
 * @param rawBrandDna  La valeur `tenants.brand_dna` (JSONB) — peut être null.
 * @param opts.tenantName  Nom du tenant (fallback handle/monogramme si le DNA
 *                         n'a pas de brandName).
 */
export function resolveBrandIdentity(
  rawBrandDna: unknown,
  opts?: { tenantName?: string | null }
): BrandIdentity {
  const dna = normalizeBrandDNA(rawBrandDna)
  const raw = (rawBrandDna && typeof rawBrandDna === "object" ? rawBrandDna : {}) as Record<string, unknown>

  // Palette : normalizeBrandDNA a déjà résolu les IDs Causse → HEX (filtrés).
  const palette = (dna.color_palette ?? [])
    .map((c) => c.hex)
    .filter(isHex6)
  const hasBrandColor = palette.length > 0
  const accent = palette[0] ?? FALLBACK_ACCENT
  const secondary = palette[1] ?? null
  const onAccent = readableTextColor(accent)

  // Identité.
  const brandName = dna.identity?.name ?? (typeof opts?.tenantName === "string" ? opts.tenantName : null)
  const handle = (brandName ?? "").trim().slice(0, 60) || null
  const monogram = monogramFrom(brandName)

  // Logo : on lit le data URI brut et on le valide (jamais via normalize).
  const rawLogo = raw.logoDataUrl
  const logoDataUrl = isUsableLogo(rawLogo) ? rawLogo : null

  // Forme dérivée du secteur.
  const sector = dna.identity?.sector ?? null
  const shapeKey = sectorToShapeKey(sector)
  const shape = GESTALT_SHAPES[shapeKey]

  // Typographie (optionnelle dans le schéma).
  const typo = (raw.typography && typeof raw.typography === "object" ? raw.typography : {}) as Record<string, unknown>
  const headingFamily = familyOf(typo.heading)
  const bodyFamily = familyOf(typo.body)

  return {
    palette: palette.length > 0 ? palette : [accent],
    accent,
    onAccent,
    secondary,
    hasBrandColor,
    brandName,
    handle,
    monogram,
    logoDataUrl,
    hasLogo: logoDataUrl !== null,
    shapeKey,
    shapeSignal: shape.signal,
    shapePromptKeywords: shape.prompt_keywords,
    headingFamily,
    bodyFamily,
    sector,
    cognitiveObjective: dna.cognitive_objective ?? null,
    culture: dna.culture_markets?.primary_culture ?? null,
    tone: dna.editorial_tone?.register ?? null,
  }
}

function familyOf(level: unknown): string | null {
  if (level && typeof level === "object") {
    const f = (level as Record<string, unknown>).family
    if (typeof f === "string" && f.trim().length > 0) return f.trim()
  }
  return null
}

/** Réexport pratique pour les renderers qui valident des HEX. */
export { causseColorToHex }
