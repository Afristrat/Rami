import type { BrandDnaFormData } from "@/lib/schemas/brand-dna.schema"

/**
 * Calcule un score de complétude Brand DNA entre 0 et 1.
 * Fonction pure, importable côté serveur et côté client.
 *
 * Poids :
 *   - Identité (nom + secteur + positionnement + tagline + objectif) : 25%
 *     → nom(10) + secteur(5) + positionnement(5) + tagline(2) + objectifCognitif(3)
 *   - Logo uploadé                                                    : 15%
 *   - Palette Causse 3 couleurs                                      : 25%
 *   - Ton de voix                                                    : 15%
 *   - Audience & culture                                             : 20%
 */
export function computeDnaScore(data: Partial<BrandDnaFormData>): number {
  let score = 0

  // Identité (25%)
  if (data.brandName && data.brandName.length >= 1) score += 0.1
  if (data.sector && data.sector.length > 0) score += 0.05
  if (data.positioning && data.positioning.length >= 10) score += 0.05
  if (data.tagline && data.tagline.length > 0) score += 0.02
  // Compatibilité v1.0 (objectifCognitif) + v1.1 (objectifsCognitifs)
  const hasObjectif =
    (data.objectifsCognitifs && data.objectifsCognitifs.length > 0) ||
    (data.objectifCognitif && data.objectifCognitif.length > 0)
  if (hasObjectif) score += 0.03

  // Logo (15%)
  if (data.logoDataUrl && data.logoDataUrl.length > 0) score += 0.15

  // Palette (25%)
  if (data.colorPrimary) score += 0.1
  if (data.colorSecondary) score += 0.08
  if (data.colorAccent) score += 0.07

  // Ton (15%)
  if (data.voiceTone) score += 0.15

  // Audience & culture (20%)
  // description(10) + primaryCulture(4) + age(3) + location(2) + painPoints(1) = 20%
  if (data.audienceDescription && data.audienceDescription.length >= 20) score += 0.1
  if (data.primaryCulture && data.primaryCulture.length > 0) score += 0.04
  if (data.audienceAge && data.audienceAge.length > 0) score += 0.03
  if (data.audienceLocation && data.audienceLocation.length > 0) score += 0.02
  if (data.audiencePainPoints && data.audiencePainPoints.length > 0) score += 0.01

  return Math.min(Math.round(score * 100) / 100, 1)
}

export function getDnaScoreLevel(score: number): {
  labelKey: string
  color: string
  bgColor: string
  borderColor: string
  descriptionKey: string
} {
  if (score >= 0.85) {
    return {
      labelKey: "excellent",
      color: "text-green-700 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-950/40",
      borderColor: "border-green-200 dark:border-green-900/60",
      descriptionKey: "excellent",
    }
  }
  if (score >= 0.65) {
    return {
      labelKey: "good",
      color: "text-blue-700 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-900/60",
      descriptionKey: "good",
    }
  }
  if (score >= 0.40) {
    return {
      labelKey: "inProgress",
      color: "text-amber-700 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      borderColor: "border-amber-200 dark:border-amber-900/60",
      descriptionKey: "inProgress",
    }
  }
  return {
    labelKey: "incomplete",
    color: "text-muted-foreground",
    bgColor: "bg-muted/30",
    borderColor: "border-border",
    descriptionKey: "incomplete",
  }
}
