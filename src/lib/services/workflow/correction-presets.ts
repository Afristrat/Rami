// ============================================================
// Presets de correction (Pilier 3) — module PUR, testable.
// À la validation, l'utilisateur clique des corrections prédéfinies (au lieu
// d'un textarea vide) ; chaque preset = un fragment d'instruction injecté dans
// la régénération de l'élément. Ici : corrections de TEXTE (caption).
// ============================================================

export type CorrectionScope = "text" | "visual"

export interface CorrectionPreset {
  id: string
  label: string // libellé du bouton (FR)
  scope: CorrectionScope
  promptFragment: string // instruction injectée dans la régénération
}

export const TEXT_CORRECTION_PRESETS: readonly CorrectionPreset[] = [
  {
    id: "too_long",
    label: "Trop long",
    scope: "text",
    promptFragment: "Raccourcis nettement le texte sans perdre le message clé.",
  },
  {
    id: "spelling_accents",
    label: "Orthographe & accents",
    scope: "text",
    promptFragment:
      "Corrige toutes les fautes d'orthographe, de grammaire et tous les accents français (é, è, ê, à, ç, ù, œ).",
  },
  {
    id: "tone_pro",
    label: "Ton plus pro",
    scope: "text",
    promptFragment: "Adopte un ton plus professionnel, posé et crédible.",
  },
  {
    id: "tone_warm",
    label: "Ton plus chaleureux",
    scope: "text",
    promptFragment: "Adopte un ton plus chaleureux, humain et incarné.",
  },
  {
    id: "punchier",
    label: "Accroche + percutante",
    scope: "text",
    promptFragment: "Rends l'accroche (la première ligne) nettement plus percutante.",
  },
  {
    id: "less_salesy",
    label: "Moins commercial",
    scope: "text",
    promptFragment: "Rends le texte moins commercial et moins racoleur, plus crédible et sobre.",
  },
  {
    id: "add_cta",
    label: "Ajouter un CTA",
    scope: "text",
    promptFragment: "Ajoute un appel à l'action clair et naturel à la fin.",
  },
  {
    id: "remove_jargon",
    label: "Retirer le jargon",
    scope: "text",
    promptFragment: "Retire le jargon et simplifie le vocabulaire pour rester accessible.",
  },
] as const

const BY_ID: Record<string, CorrectionPreset> = Object.fromEntries(
  TEXT_CORRECTION_PRESETS.map((p) => [p.id, p])
)

/** Résout des presets par id (ignore les id inconnus/forgés). PUR. */
export function resolveCorrectionPresets(ids: readonly string[]): CorrectionPreset[] {
  const seen = new Set<string>()
  const out: CorrectionPreset[] = []
  for (const id of ids) {
    const p = BY_ID[id]
    if (p && !seen.has(p.id)) {
      seen.add(p.id)
      out.push(p)
    }
  }
  return out
}

/**
 * Construit l'instruction de correction à partir des presets cliqués + d'un
 * éventuel texte libre. Renvoie "" si rien n'est demandé. PUR.
 */
export function buildCorrectionInstruction(
  ids: readonly string[],
  freeText?: string | null
): string {
  const fragments = resolveCorrectionPresets(ids).map((p) => `- ${p.promptFragment}`)
  const extra = (freeText ?? "").trim()
  if (extra) fragments.push(`- ${extra.slice(0, 500)}`)
  if (fragments.length === 0) return ""
  return ["Corrections demandées :", ...fragments].join("\n")
}
