// ============================================================
// Génération de deck de présentation (PUR — testable sans DB ni réseau)
// Construit les prompts LLM et valide/parse la réponse en un Deck typé.
// ============================================================

import { deckSchema, deckSlideSchema, type Deck, type DeckLanguage } from "@/lib/schemas/presentation.schema"
import type { BrandDNA } from "@/lib/services/brand-dna/prompt-compiler"

const LANGUAGE_LABELS: Record<DeckLanguage, string> = {
  fr: "français",
  ar: "arabe",
  en: "anglais",
}

/**
 * Prompt système : impose le format JSON strict + interdiction d'inventer des
 * chiffres précis non fournis (cohérent avec la règle DEFCON 1 du projet).
 */
export function buildDeckSystemPrompt(): string {
  return [
    "Tu es un consultant senior qui conçoit des présentations professionnelles de niveau cabinet de conseil (style McKinsey).",
    "Tu produis UNIQUEMENT un objet JSON valide, sans texte avant ou après, sans bloc de code Markdown.",
    "Le JSON a la forme : { \"slides\": [ <slide>, ... ] }.",
    "Chaque <slide> est l'un des types suivants, avec EXACTEMENT ces champs :",
    '- { "type": "cover", "title": string, "subtitle"?: string }',
    '- { "type": "agenda", "title": string, "items": string[] }',
    '- { "type": "section", "title": string, "subtitle"?: string }',
    '- { "type": "content", "title": string, "bullets": string[] }',
    '- { "type": "twoColumn", "title": string, "leftTitle": string, "left": string[], "rightTitle": string, "right": string[] }',
    '- { "type": "stat", "title": string, "stat": string, "caption"?: string }',
    '- { "type": "quote", "quote": string, "author"?: string }',
    '- { "type": "conclusion", "title": string, "bullets": string[] }',
    "Structure recommandée : 1 slide 'cover', puis 'agenda', des sections ('section') et du contenu ('content'/'twoColumn'/'stat'/'quote'), et 1 slide 'conclusion' finale.",
    "Les puces sont concises et percutantes. NE JAMAIS inventer de statistique chiffrée précise non fournie dans le brief : pour un 'stat', n'utilise un chiffre que s'il provient du brief, sinon formule une affirmation qualitative.",
    "Respecte strictement la langue demandée pour tout le contenu.",
  ].join("\n")
}

/** Résumé Brand DNA injecté dans le prompt (ton, secteur, marque). */
function brandSummary(brandDNA: BrandDNA): string {
  const parts: string[] = []
  if (brandDNA.identity?.name) parts.push(`Marque : ${brandDNA.identity.name}`)
  if (brandDNA.identity?.sector) parts.push(`Secteur : ${brandDNA.identity.sector}`)
  if (brandDNA.editorial_tone?.register) parts.push(`Ton éditorial : ${brandDNA.editorial_tone.register}`)
  if (brandDNA.culture_markets?.primary_culture) parts.push(`Marché : ${brandDNA.culture_markets.primary_culture}`)
  return parts.length > 0 ? parts.join(" — ") : "Aucun Brand DNA renseigné."
}

export function buildDeckUserPrompt(input: {
  subject: string
  audience: string
  language: DeckLanguage
  slideCount: number
  brandDNA: BrandDNA
}): string {
  return [
    `Sujet de la présentation : ${input.subject}`,
    `Audience cible : ${input.audience || "non précisée"}`,
    `Langue : ${LANGUAGE_LABELS[input.language]}`,
    `Nombre de slides souhaité : environ ${input.slideCount} (entre 3 et 20).`,
    `Contexte de marque : ${brandSummary(input.brandDNA)}`,
    "",
    "Génère le deck complet au format JSON imposé.",
  ].join("\n")
}

/** Retire d'éventuelles fences Markdown et extrait le premier objet JSON. */
function stripToJson(raw: string): string {
  let s = raw.trim()
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim()
  const start = s.indexOf("{")
  const end = s.lastIndexOf("}")
  if (start >= 0 && end > start) return s.slice(start, end + 1)
  return s
}

/**
 * Parse + valide la réponse LLM en un Deck. Retourne null si non conforme
 * (aucun deck fabriqué en cas d'échec).
 */
export function parseDeck(raw: string): Deck | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(stripToJson(raw))
  } catch {
    return null
  }

  const result = deckSchema.safeParse(parsed)
  if (result.success) return result.data

  // Sauvetage : ne pas rejeter tout le deck si une seule slide est non conforme.
  // On conserve les slides individuellement valides (et on exige toujours ≥ 3).
  const rawSlides = (parsed as { slides?: unknown })?.slides
  if (!Array.isArray(rawSlides)) return null
  const valid = rawSlides
    .map((s) => deckSlideSchema.safeParse(s))
    .filter((r): r is ReturnType<typeof deckSlideSchema.safeParse> & { success: true } => r.success)
    .map((r) => r.data)
    .slice(0, 30)
  if (valid.length < 3) return null
  return { slides: valid }
}
