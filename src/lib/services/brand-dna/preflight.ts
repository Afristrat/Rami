// ============================================================
// Brand Preflight Score — conformité MESURÉE d'un artefact au Brand DNA
// ============================================================
// Inspiré du « preflight check » de l'imprimerie (PAO) : avant publication, on
// mesure objectivement si la sortie respecte l'identité. Transforme la promesse
// produit (« chaque post est une flèche calibrée ») en MÉTRIQUE vérifiable.
//
// NON BLOQUANT par design : c'est un SIGNAL (badge « Conformité marque X% »),
// jamais un barrage. Le seul verrou de publication reste l'approbation humaine.
//
// PUR → testable sans DB/IO.

export type PreflightGrade = "A" | "B" | "C" | "D"

export interface PreflightCheck {
  /** Clé i18n / identifiant de la dimension contrôlée. */
  key: string
  passed: boolean
  /** Poids relatif de la dimension (somme = 1 pour le mode considéré). */
  weight: number
}

export interface PreflightResult {
  /** Score de conformité 0-100. */
  score: number
  grade: PreflightGrade
  checks: PreflightCheck[]
}

function gradeFor(score: number): PreflightGrade {
  if (score >= 90) return "A"
  if (score >= 75) return "B"
  if (score >= 55) return "C"
  return "D"
}

function assemble(checks: PreflightCheck[]): PreflightResult {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0) || 1
  const earned = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0)
  const score = Math.round((earned / totalWeight) * 100)
  return { score, grade: gradeFor(score), checks }
}

/**
 * Artefact COMPOSÉ PAR LE CODE (post-visuel, carrousel, présentation, PDF) :
 * la conformité est STRUCTURELLE et vérifiable directement (la couleur EST celle
 * de la marque, le contraste EST calculé, etc.).
 */
export interface ComposedPreflightInput {
  /** L'accent appliqué = couleur de marque résolue. */
  brandColorApplied: boolean
  /** Le texte sur l'accent respecte un contraste lisible (WCAG ≥ 4.5). */
  contrastSafe: boolean
  /** Logo OU monogramme de la marque présent sur l'artefact. */
  brandMarkPresent: boolean
  /** Forme Gestalt du secteur appliquée au décor. */
  brandShapeApplied: boolean
}

export function preflightComposed(input: ComposedPreflightInput): PreflightResult {
  return assemble([
    { key: "brandColor", weight: 0.35, passed: input.brandColorApplied },
    { key: "contrast", weight: 0.2, passed: input.contrastSafe },
    { key: "brandMark", weight: 0.25, passed: input.brandMarkPresent },
    { key: "brandShape", weight: 0.2, passed: input.brandShapeApplied },
  ])
}

/**
 * Artefact IMAGE GÉNÉRÉE PAR IA : la conformité n'est pas structurellement
 * garantie (le modèle peut dériver). On la MESURE : correspondance de la couleur
 * dominante à la palette (Vision AI, 0-1) + présence des contraintes de prompt.
 */
export interface AiImagePreflightInput {
  /** Score de correspondance couleur dominante ↔ palette (0-1), Vision AI. */
  visionColorMatch: number | null
  /** La palette de marque a bien été injectée comme contrainte de prompt. */
  brandPaletteInPrompt: boolean
  /** La forme Gestalt du secteur a été injectée dans le prompt. */
  brandShapeInPrompt: boolean
}

export function preflightAiImage(input: AiImagePreflightInput): PreflightResult {
  // visionColorMatch null (scoring indisponible) → on neutralise la dimension
  // mesurée (poids reporté sur les contraintes de prompt vérifiables).
  const colorChecks: PreflightCheck[] =
    input.visionColorMatch === null
      ? []
      : [{ key: "visionColorMatch", weight: 0.6, passed: input.visionColorMatch >= 0.7 }]
  return assemble([
    ...colorChecks,
    { key: "paletteInPrompt", weight: 0.25, passed: input.brandPaletteInPrompt },
    { key: "shapeInPrompt", weight: 0.15, passed: input.brandShapeInPrompt },
  ])
}

/** Libellé court FR d'un grade, pour le badge UI. PUR. */
export function preflightLabel(grade: PreflightGrade): string {
  switch (grade) {
    case "A":
      return "Identité de marque respectée"
    case "B":
      return "Bonne cohérence de marque"
    case "C":
      return "Cohérence de marque partielle"
    case "D":
      return "Cohérence de marque faible"
  }
}
