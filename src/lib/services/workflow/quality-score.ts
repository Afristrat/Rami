// ============================================================
// Score qualité du contenu — Step 5 du workflow « Créer un post »
//
// Module PUR (zéro I/O) : remplace l'ancien score « A+ » inventé par un
// calcul RÉEL sur 4 dimensions vérifiables (DEFCON 1 — zéro métrique
// affichée qui ne soit pas calculée) :
//   1. Longueur de la caption vs limite de la plateforme
//   2. Score Brand DNA réel du visuel sélectionné (Vision AI / heuristique)
//   3. Volume de hashtags vs fourchette recommandée par plateforme
//   4. Détection d'un appel à l'action (CTA) dans la caption
// ============================================================

import type { Platform } from "@/lib/scheduler/platform-config"

export interface QualityInput {
  caption: string
  hashtags: string[]
  /** Limite de caractères de la plateforme active. */
  charLimit: number
  platform: Platform
  /** Score Brand DNA réel (0-1) du visuel sélectionné — null si aucun visuel. */
  visualBrandDnaScore: number | null
}

export type MetricStatus = "good" | "warn" | "bad"

export type QualityMetricId = "charCount" | "brandDnaScore" | "hashtagVolume" | "ctaDetection"

export interface QualityMetric {
  id: QualityMetricId
  /** Score réel 0-1 de la métrique — alimente la jauge affichée. */
  ratio: number
  status: MetricStatus
}

export type QualityGrade = "A+" | "A" | "B" | "C" | "D"

export interface QualityResult {
  metrics: QualityMetric[]
  /** Score global 0-100 (moyenne pondérée des métriques réelles). */
  score: number
  grade: QualityGrade
  /** true si la caption dépasse la limite de la plateforme (publication impossible). */
  overLimit: boolean
}

/** Fourchette de hashtags recommandée par plateforme (mêmes règles que la génération). */
export const HASHTAG_RANGES: Record<Platform, readonly [number, number]> = {
  twitter: [1, 3],
  linkedin: [3, 5],
  instagram: [5, 10],
  facebook: [2, 3],
  pinterest: [3, 5],
  youtube: [3, 5],
  tiktok: [5, 10],
}

// Radicaux d'appel à l'action (FR + EN) — détection volontairement large.
const CTA_PATTERN =
  /(découvr|inscri|contacte|clique|réserv|télécharg|rejoign|essaye|essayez|profite|partage|partagez|commente|abonne|visite|demande|découvre|découvrez|réagis|participe|discover|sign up|learn more|join|try (it|now|for)|download|subscribe|register|book now|get started|shop now|follow us|share|comment below|contact us|click)/i

/** Détecte un appel à l'action dans la caption (radicaux FR/EN ou question finale). */
export function detectCta(caption: string): boolean {
  const text = caption.trim()
  if (text.length === 0) return false
  if (CTA_PATTERN.test(text)) return true
  // Une question engage la conversation — compte comme un CTA conversationnel.
  return /\?\s*$/m.test(text) || text.includes("?")
}

function statusFromRatio(ratio: number): MetricStatus {
  if (ratio >= 0.7) return "good"
  if (ratio >= 0.4) return "warn"
  return "bad"
}

function scoreCharCount(length: number, limit: number): number {
  if (length === 0) return 0
  if (length > limit) return 0.1
  if (length > limit * 0.95) return 0.6
  if (length < 30) return 0.45
  return 1
}

function scoreHashtags(count: number, range: readonly [number, number]): number {
  const [min, max] = range
  if (count >= min && count <= max) return 1
  if (count === 0) return 0.3
  if (count < min) return 0.7
  // Au-delà de la fourchette → effet spam
  return 0.5
}

function scoreBrandDna(visualScore: number | null): number {
  if (visualScore === null) return 0.4
  return Math.min(1, Math.max(0, visualScore))
}

// Pondérations du score global (somme = 1)
const WEIGHTS: Record<QualityMetricId, number> = {
  charCount: 0.3,
  brandDnaScore: 0.25,
  hashtagVolume: 0.2,
  ctaDetection: 0.25,
}

function gradeFromScore(score: number): QualityGrade {
  if (score >= 90) return "A+"
  if (score >= 75) return "A"
  if (score >= 60) return "B"
  if (score >= 45) return "C"
  return "D"
}

/** Calcule le score qualité réel du contenu en cours de revue. */
export function computeQualityScore(input: QualityInput): QualityResult {
  const length = input.caption.trim().length
  const overLimit = length > input.charLimit

  const ratios: Record<QualityMetricId, number> = {
    charCount: scoreCharCount(length, input.charLimit),
    brandDnaScore: scoreBrandDna(input.visualBrandDnaScore),
    hashtagVolume: scoreHashtags(input.hashtags.length, HASHTAG_RANGES[input.platform]),
    ctaDetection: detectCta(input.caption) ? 1 : 0.35,
  }

  const metrics: QualityMetric[] = (Object.keys(ratios) as QualityMetricId[]).map((id) => ({
    id,
    ratio: ratios[id],
    status: statusFromRatio(ratios[id]),
  }))

  let score = Math.round(
    (Object.keys(ratios) as QualityMetricId[]).reduce(
      (sum, id) => sum + ratios[id] * WEIGHTS[id],
      0
    ) * 100
  )

  // Caption au-dessus de la limite = publication impossible → plafonné à D.
  if (overLimit) score = Math.min(score, 44)

  return { metrics, score, grade: gradeFromScore(score), overLimit }
}
