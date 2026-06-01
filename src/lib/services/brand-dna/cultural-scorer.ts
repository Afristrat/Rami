// ============================================================
// Cultural Scorer — Score de cohérence culturelle (US-016)
// ============================================================
// Évalue l'alignement entre la palette d'une marque et son secteur,
// d'après la matrice Causse (SECTOR_COLOR_RULES). Module PUR :
// aucune dépendance React/i18n/IO → testable unitairement.
//
// Deux entrées :
//   - scoreCulturalCoherence({ sector, colorIds })  → cas Brand DNA (couleurs nommées Causse)
//   - scoreCulturalCoherenceFromHex({ sector, hexColors }) → cas visuel généré (HEX bruts)
//     convertit chaque HEX en famille Causse par plus proche voisin RGB.

import { CAUSSE_COLORS, SECTOR_COLOR_RULES } from "@/lib/schemas/brand-dna.schema"

/** Niveau qualitatif dérivé du score 0-100. */
export type CulturalLevel = "excellent" | "good" | "warning" | "poor"

/** Statut d'une couleur de la palette au regard du secteur. */
export type CulturalColorVerdict = "recommended" | "avoid" | "neutral"

export interface CulturalJustification {
  /** Identifiant Causse de la couleur évaluée (ex. "rouge_passion"). */
  colorId: string
  verdict: CulturalColorVerdict
  /** Clé i18n `brandDna.sectorColorRules.{reasonKey}` quand le secteur documente la raison de l'évitement. */
  reasonKey?: string
  /** Identifiant Causse de la couleur alternative suggérée (uniquement pour un verdict "avoid"). */
  alternativeColorId?: string
}

export interface CulturalScoreResult {
  /** Score entier 0-100. */
  score: number
  level: CulturalLevel
  justifications: CulturalJustification[]
  /** false quand le secteur n'a aucune règle Causse documentée (score neutre par défaut). */
  hasRules: boolean
}

// ─── Barème ───────────────────────────────────────────────
// Baseline neutre 70 (« bon » par défaut, sans information contraire).
const BASELINE = 70
const BONUS = 10
const PENALTY = 20

const allCausseIds = new Set<string>(CAUSSE_COLORS.map((c) => c.id))

/** Parse "#RRGGBB" (ou "RRGGBB") → [r, g, b] ; null si invalide. */
function hexToRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace(/^#/, "")
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return null
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  return [r, g, b]
}

/**
 * Renvoie l'identifiant de la couleur Causse la plus proche d'un HEX donné
 * (distance euclidienne dans l'espace RGB). null si le HEX est invalide.
 */
export function nearestCausseColor(hex: string): string | null {
  const rgb = hexToRgb(hex)
  if (!rgb) return null
  let bestId: string | null = null
  let bestDist = Number.POSITIVE_INFINITY
  for (const color of CAUSSE_COLORS) {
    const ref = hexToRgb(color.hex)
    if (!ref) continue
    const dr = rgb[0] - ref[0]
    const dg = rgb[1] - ref[1]
    const db = rgb[2] - ref[2]
    const dist = dr * dr + dg * dg + db * db
    if (dist < bestDist) {
      bestDist = dist
      bestId = color.id
    }
  }
  return bestId
}

/** Niveau qualitatif à partir du score 0-100. */
export function getCulturalLevel(score: number): CulturalLevel {
  if (score >= 85) return "excellent"
  if (score >= 65) return "good"
  if (score >= 45) return "warning"
  return "poor"
}

/**
 * Score de cohérence culturelle d'une palette (couleurs nommées Causse) vis-à-vis d'un secteur.
 * Les identifiants inconnus de CAUSSE_COLORS sont ignorés. Un secteur sans règle → score neutre.
 */
export function scoreCulturalCoherence(input: {
  sector: string
  colorIds: string[]
}): CulturalScoreResult {
  const colorIds = input.colorIds.filter((id) => allCausseIds.has(id))
  const rule = SECTOR_COLOR_RULES[input.sector]

  if (!rule) {
    return {
      score: BASELINE,
      level: getCulturalLevel(BASELINE),
      justifications: colorIds.map((colorId) => ({ colorId, verdict: "neutral" as const })),
      hasRules: false,
    }
  }

  let score = BASELINE
  const recommended = new Set(rule.recommended)
  const avoid = new Set(rule.avoid)

  const justifications: CulturalJustification[] = colorIds.map((colorId) => {
    if (recommended.has(colorId)) {
      score += BONUS
      return { colorId, verdict: "recommended" }
    }
    if (avoid.has(colorId)) {
      score -= PENALTY
      return {
        colorId,
        verdict: "avoid",
        reasonKey: rule.avoidReasonKey,
        alternativeColorId: rule.avoidAlternative,
      }
    }
    return { colorId, verdict: "neutral" }
  })

  score = Math.max(0, Math.min(100, score))

  return {
    score,
    level: getCulturalLevel(score),
    justifications,
    hasRules: true,
  }
}

/**
 * Variante prenant des couleurs HEX brutes (visuels générés) : chaque HEX est ramené
 * à sa famille Causse la plus proche avant le scoring.
 */
export function scoreCulturalCoherenceFromHex(input: {
  sector: string
  hexColors: string[]
}): CulturalScoreResult {
  const colorIds = input.hexColors
    .map(nearestCausseColor)
    .filter((id): id is string => id !== null)
  return scoreCulturalCoherence({ sector: input.sector, colorIds })
}
