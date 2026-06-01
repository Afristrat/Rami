// ============================================================
// Rapport « Tendances Couleur MENA » — logique PURE (US-014)
// ============================================================
// Construit un rapport d'autorité couleur pour la région MENA à partir de :
//   1. La matrice Causse (référence sourcée : couleur × émotion × culture × secteur) — MOAT-2.
//   2. Les benchmarks collectifs réels (collective_benchmarks, k-anonymat ≥ 5) — contexte
//      de performance par plateforme, quand disponibles. Sinon le rapport reste honnête
//      (« autorité seule », aucune statistique inventée — DÉFCON 1).
//
// Toutes les fonctions de ce module sont PURES → testables sans réseau ni DB.

import { CAUSSE_COLOR_MATRIX, type CausseColor } from "@/lib/utils/causse-matrix"

export type ColorStance = "recommended" | "avoid" | "neutral"

export interface ColorTrendEntry {
  id: string
  name: string
  hex: string
  stance: ColorStance
  emotions: string[]
  networks: string[]
  /** Note culturelle spécifique à la région/culture cible (MENA). */
  culturalNote: string
  causseQuote: string
}

export interface PlatformBenchmark {
  platform: string
  metric: string
  value: number
  sampleSize: number
}

export interface ColorTrendReport {
  sector: string
  culture: string
  /** Étiquette de période trimestrielle, ex. « 2026-T2 ». */
  period: string
  colors: ColorTrendEntry[]
  platformBenchmarks: PlatformBenchmark[]
  /** « collective » si des benchmarks réels existent, sinon « authority_only ». */
  dataAvailability: "collective" | "authority_only"
  /** Synthèse rédigée par le LLM (optionnelle ; null = repli déterministe côté UI). */
  narrative: string | null
}

export interface BuildColorTrendInput {
  sector: string
  culture: string
  period: string
  benchmarks?: PlatformBenchmark[]
  narrative?: string | null
}

/** Cultures considérées comme MENA (Maroc, Moyen-Orient, Afrique). */
const MENA_CULTURES = new Set(["maroc", "moyen_orient", "afrique_subsaharienne"])

/** Indique si une culture relève du périmètre MENA couvert par le rapport. */
export function isMenaCulture(culture: string): boolean {
  return MENA_CULTURES.has(culture)
}

/** Note culturelle Causse correspondant à la culture cible (repli Moyen-Orient = défaut MENA). */
function culturalNoteFor(color: CausseColor, culture: string): string {
  switch (culture) {
    case "maroc":
      return color.culture_maroc
    case "afrique_subsaharienne":
      return color.culture_afrique ?? color.culture_maroc
    case "moyen_orient":
      return color.culture_moyen_orient ?? color.culture_maroc
    default:
      // Défaut MENA : privilégier la lecture Moyen-Orient, puis Maroc.
      return color.culture_moyen_orient ?? color.culture_maroc
  }
}

/** Normalise un libellé secteur pour comparaison tolérante. */
function normSector(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, "_")
}

/** Détermine la posture d'une couleur pour un secteur donné (recommandée/à éviter/neutre). */
function stanceFor(color: CausseColor, sector: string): ColorStance {
  const s = normSector(sector)
  const recommended = (color.sectors_recommended ?? []).map(normSector)
  const avoid = (color.avoid_sectors ?? []).map(normSector)
  // Correspondance exacte ou par inclusion (ex. « finance_islamique » ⊃ « finance »).
  if (recommended.some((r) => r === s || s.includes(r) || r.includes(s))) return "recommended"
  if (avoid.some((a) => a === s || s.includes(a) || a.includes(s))) return "avoid"
  return "neutral"
}

const STANCE_ORDER: Record<ColorStance, number> = { recommended: 0, neutral: 1, avoid: 2 }

/**
 * Construit le rapport couleur MENA (PUR). Les couleurs sont classées :
 * recommandées d'abord, neutres ensuite, à éviter en dernier.
 */
export function buildColorTrendReport(input: BuildColorTrendInput): ColorTrendReport {
  const colors: ColorTrendEntry[] = Object.entries(CAUSSE_COLOR_MATRIX)
    .map(([id, color]) => ({
      id,
      name: color.name,
      hex: color.hex_primary,
      stance: stanceFor(color, input.sector),
      emotions: color.emotions.slice(0, 4),
      networks: color.networks_optimal,
      culturalNote: culturalNoteFor(color, input.culture),
      causseQuote: color.causse_quote,
    }))
    .sort((a, b) => {
      const byStance = STANCE_ORDER[a.stance] - STANCE_ORDER[b.stance]
      return byStance !== 0 ? byStance : a.name.localeCompare(b.name, "fr")
    })

  const benchmarks = input.benchmarks ?? []

  return {
    sector: input.sector,
    culture: input.culture,
    period: input.period,
    colors,
    platformBenchmarks: benchmarks,
    dataAvailability: benchmarks.length > 0 ? "collective" : "authority_only",
    narrative: input.narrative ?? null,
  }
}

/** Calcule l'étiquette de période trimestrielle (ex. « 2026-T2 ») depuis une date. */
export function quarterLabel(date: Date): string {
  const q = Math.floor(date.getUTCMonth() / 3) + 1
  return `${date.getUTCFullYear()}-T${q}`
}

const NARRATIVE_SYSTEM_PROMPT =
  "Tu es un directeur artistique expert en neuropsychologie des couleurs (matrice Causse) " +
  "et en marketing pour les marchés africains et MENA. Rédige une synthèse exécutive (3-5 phrases) " +
  "des tendances couleur recommandées pour un secteur, dans la culture cible. Sois concret et " +
  "actionnable. Réponds UNIQUEMENT par le texte de la synthèse, sans titre ni markdown."

/** System prompt de la synthèse narrative (constant, exposé pour les tests). */
export function buildColorTrendSystemPrompt(): string {
  return NARRATIVE_SYSTEM_PROMPT
}

/** User prompt de la synthèse narrative à partir du rapport (PUR). */
export function buildColorTrendUserPrompt(report: ColorTrendReport): string {
  const recommended = report.colors.filter((c) => c.stance === "recommended")
  const avoid = report.colors.filter((c) => c.stance === "avoid")
  const recLine = recommended.length
    ? recommended.map((c) => `${c.name} (${c.emotions.join(", ")})`).join(" ; ")
    : "Aucune couleur sectoriellement prioritaire — s'appuyer sur l'objectif cognitif."
  const avoidLine = avoid.length ? avoid.map((c) => c.name).join(", ") : "Aucune restriction forte."
  const benchLine = report.platformBenchmarks.length
    ? report.platformBenchmarks
        .map((b) => `${b.platform}:${b.metric}=${b.value.toFixed(2)} (n=${b.sampleSize})`)
        .join(" ; ")
    : "Données collectives insuffisantes (k-anonymat < 5) — autorité Causse seule."

  return [
    `Secteur : ${report.sector}`,
    `Culture cible (MENA) : ${report.culture}`,
    `Période : ${report.period}`,
    `Couleurs recommandées : ${recLine}`,
    `Couleurs à éviter : ${avoidLine}`,
    `Benchmarks plateformes : ${benchLine}`,
    "",
    "Rédige la synthèse exécutive.",
  ].join("\n")
}
