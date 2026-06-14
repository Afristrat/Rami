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
    // ── Rôle & standard (L99) ──
    "Tu es un CONSULTANT SENIOR EN STRATÉGIE (standard McKinsey/BCG/Bain). Tu conçois des présentations de niveau comité de direction.",
    "",
    // ── Contrat de sortie ──
    "SORTIE : UNIQUEMENT un objet JSON valide de la forme { \"slides\": [ <slide>, ... ] }. Aucun texte avant/après, aucun bloc de code Markdown.",
    "Chaque <slide> est l'un des types suivants, avec EXACTEMENT ces champs :",
    '- { "type": "cover", "title": string, "subtitle"?: string }',
    '- { "type": "agenda", "title": string, "items": string[] }',
    '- { "type": "section", "title": string, "subtitle"?: string }',
    '- { "type": "content", "title": string, "bullets": string[] }',
    '- { "type": "twoColumn", "title": string, "leftTitle": string, "left": string[], "rightTitle": string, "right": string[] }',
    '- { "type": "stat", "title": string, "stat": string, "caption"?: string }',
    '- { "type": "quote", "quote": string, "author"?: string }',
    '- { "type": "conclusion", "title": string, "bullets": string[] }',
    "",
    // ── Principe de la pyramide (Minto) ──
    "PRINCIPE DE LA PYRAMIDE : chaque slide porte UN SEUL message clé. Le TITRE EST le message à retenir (un « action title » qui affirme une conclusion), pas une étiquette de thème.",
    "Exemple : au lieu de « Marché », écris « Le marché de la finance islamique au Maroc croît plus vite que le conventionnel ».",
    "",
    // ── Structure MECE ──
    "STRUCTURE MECE : cover → executive summary (les 3 messages clés) → contexte/problème → analyse (parties mutuellement exclusives, collectivement exhaustives) → recommandations → feuille de route / prochaines étapes → conclusion.",
    "",
    // ── Rédaction ──
    "RÉDACTION : puces concises (≈ 12 mots max), verbes d'action, structure parallèle. ZÉRO remplissage, zéro cliché marketing, zéro redondance, aucun pavé de texte.",
    "",
    // ── DÉFCON 1 chiffres ──
    "RÈGLE DÉFCON 1 — CHIFFRES : n'utilise un chiffre précis QUE s'il figure dans le brief ou le document source. JAMAIS de statistique inventée. Sinon, formule qualitativement (« forte croissance » plutôt qu'un « +37 % » fabriqué). Pour un 'stat', le chiffre doit provenir de la source.",
    "",
    // ── Audience / langue / marque ──
    "AUDIENCE & LANGUE : adapte le registre à l'audience indiquée ; respecte STRICTEMENT la langue demandée pour TOUT le contenu.",
    "BRAND DNA : intègre le secteur, le ton éditorial et le marché fournis (contexte MENA/Maroc le cas échéant) ; reste cohérent avec l'identité de la marque.",
    "",
    // ── Mode conversion (imports) ──
    "EN MODE CONVERSION d'un document importé (Markdown/PDF/Word/Excel) : restructure FIDÈLEMENT le contenu source en deck. PRÉSERVE tous les faits et chiffres du document (jamais inventer, jamais omettre un chiffre clé), organise selon la pyramide, et N'AJOUTE AUCUNE donnée absente de la source.",
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

/**
 * Prompt utilisateur de RÉVISION : fournit le deck actuel + l'instruction de
 * l'utilisateur ; le LLM renvoie le deck COMPLET révisé (même format JSON).
 */
export function buildDeckRevisionPrompt(input: {
  currentDeckJson: string
  instruction: string
  language: DeckLanguage
}): string {
  return [
    "Voici le deck actuel au format JSON :",
    input.currentDeckJson,
    "",
    `Instruction de modification : ${input.instruction}`,
    "",
    `Renvoie le deck COMPLET révisé, au MÊME format JSON imposé, en ${LANGUAGE_LABELS[input.language]}.`,
    "Ne change que ce que l'instruction demande ; conserve le reste à l'identique.",
    "Aucun texte hors du JSON.",
  ].join("\n")
}

/**
 * Prompt utilisateur de CONVERSION d'un document importé en deck. Le prompt
 * système (mode CONVERSION) impose déjà la fidélité aux faits/chiffres.
 */
export function buildDeckConversionPrompt(input: {
  sourceText: string
  truncated: boolean
  audience: string
  language: DeckLanguage
  slideCount: number
  brandDNA: BrandDNA
}): string {
  return [
    "Convertis le DOCUMENT SOURCE ci-dessous en un deck de présentation au format JSON imposé.",
    `Audience cible : ${input.audience || "non précisée"}`,
    `Langue : ${LANGUAGE_LABELS[input.language]}`,
    `Nombre de slides souhaité : environ ${input.slideCount} (entre 3 et 20).`,
    `Contexte de marque : ${brandSummary(input.brandDNA)}`,
    input.truncated ? "(Le document est long : il a été tronqué, travaille sur l'extrait fourni.)" : "",
    "",
    "RÈGLE DE CONVERSION : restructure FIDÈLEMENT le contenu de la source selon le principe de la pyramide. PRÉSERVE tous les faits et chiffres présents dans le document (jamais en inventer, jamais omettre un chiffre clé). N'AJOUTE aucune donnée absente de la source.",
    "",
    "=== DOCUMENT SOURCE ===",
    input.sourceText,
    "=== FIN DU DOCUMENT SOURCE ===",
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
