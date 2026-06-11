// ============================================================
// Offre commerciale — logique PURE (US-025)
// ============================================================
// Construction des prompts LLM et parsing défensif du contenu généré.
// Aucune I/O ici → testable sans DB ni réseau. L'action serveur
// (documents.actions) orchestre : Brand DNA → prompts → callTextLLM →
// parseOfferContent → persistance dans documents.content_json.
//
// DÉFCON 1 : le LLM ne doit JAMAIS inventer de chiffres (prix, délais,
// statistiques). Le prompt l'interdit explicitement — toute donnée chiffrée
// absente du brief est rendue comme « à définir » par le générateur.

import { z } from "zod"
import type { BrandDNA } from "@/lib/services/brand-dna/prompt-compiler"

// ── Schéma du contenu d'offre ──────────────────────────────

const OfferServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  deliverables: z.array(z.string()).default([]),
})

const OfferPricingItemSchema = z.object({
  label: z.string().min(1),
  description: z.string().default(""),
  /** Prix affiché tel quel (ex. « 25 000 MAD » ou « À définir ») — jamais inventé. */
  price: z.string().default(""),
})

export const CommercialOfferContentSchema = z.object({
  executive_summary: z.string().min(1),
  context: z.string().min(1),
  objectives: z.array(z.string()).min(1),
  services: z.array(OfferServiceSchema).min(1),
  methodology: z.array(z.string()).min(1),
  pricing: z.array(OfferPricingItemSchema).default([]),
  next_steps: z.array(z.string()).default([]),
})

export type CommercialOfferContent = z.infer<typeof CommercialOfferContentSchema>

// ── Prompts ────────────────────────────────────────────────

export function buildOfferSystemPrompt(): string {
  return [
    "Tu es un consultant senior en stratégie commerciale pour les marchés africains et MENA.",
    "Tu rédiges des offres commerciales professionnelles, structurées et persuasives, en français irréprochable (accents corrects partout).",
    "RÈGLE ABSOLUE : n'invente JAMAIS de chiffres (prix, budgets, délais, statistiques, pourcentages).",
    "Si le brief ne fournit pas de prix, le champ price reste une chaîne vide.",
    'Réponds UNIQUEMENT par un objet JSON valide, sans markdown, au format : {"executive_summary": "string", "context": "string", "objectives": ["string"], "services": [{"name": "string", "description": "string", "deliverables": ["string"]}], "methodology": ["string"], "pricing": [{"label": "string", "description": "string", "price": "string"}], "next_steps": ["string"]}',
  ].join(" ")
}

export interface OfferPromptInput {
  title: string
  clientName: string | null
  brief: string | null
  brandDNA: BrandDNA
}

export function buildOfferUserPrompt(input: OfferPromptInput): string {
  const { title, clientName, brief, brandDNA } = input
  const lines: string[] = []

  lines.push(`Rédige le contenu d'une offre commerciale intitulée : « ${title} ».`)
  if (clientName) lines.push(`Client destinataire : ${clientName}.`)

  const identity = brandDNA.identity
  if (identity?.name) lines.push(`Émetteur de l'offre : ${identity.name}.`)
  if (identity?.sector) lines.push(`Secteur de l'émetteur : ${identity.sector}.`)
  if (identity?.positioning) lines.push(`Positionnement : ${identity.positioning}.`)
  if (brandDNA.editorial_tone?.register)
    lines.push(`Ton éditorial à respecter : ${brandDNA.editorial_tone.register}.`)
  if (brandDNA.culture_markets?.primary_culture)
    lines.push(`Marché / culture cible : ${brandDNA.culture_markets.primary_culture}.`)

  if (brief && brief.trim().length > 0) {
    lines.push(`Brief fourni par l'utilisateur : ${brief.trim()}`)
  } else {
    lines.push(
      "Aucun brief détaillé fourni : propose une structure d'offre générique adaptée au secteur de l'émetteur, sans inventer de données chiffrées."
    )
  }

  lines.push(
    "Rappel : aucun chiffre inventé. Les prix absents du brief restent des chaînes vides."
  )

  return lines.join("\n")
}

// ── Parsing défensif ───────────────────────────────────────

/**
 * Parse la réponse brute du LLM en CommercialOfferContent.
 * Tolère les clôtures markdown (```json … ```). Retourne null si le JSON
 * est invalide ou ne respecte pas le schéma — l'appelant décide du repli.
 */
export function parseOfferContent(raw: string): CommercialOfferContent | null {
  if (!raw || raw.trim().length === 0) return null

  let text = raw.trim()
  // Retire une éventuelle clôture markdown ```json … ```
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) text = fenced[1].trim()

  // Isole le premier objet JSON si du texte l'entoure.
  const start = text.indexOf("{")
  const end = text.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  text = text.slice(start, end + 1)

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return null
  }

  const result = CommercialOfferContentSchema.safeParse(parsed)
  return result.success ? result.data : null
}
