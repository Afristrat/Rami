import { z } from "zod"

// ============================================================
// Schéma d'un deck de présentation RAMI
// ============================================================
// Modèle interne riche (titre + contenu par slide) — sert à la fois à l'aperçu
// écran et à l'export PPTX (mapping vers les templates mckinsey_pptx côté service).
// Chaque variante de slide est validée par un union discriminé sur `type`.

export const DECK_LANGUAGES = ["fr", "ar", "en"] as const
export type DeckLanguage = (typeof DECK_LANGUAGES)[number]

// Contraintes volontairement généreuses : un LLM produit du contenu de longueur
// variable. On préfère accepter et tronquer à l'affichage plutôt que rejeter un
// deck entier sur un dépassement cosmétique.
const TITLE = z.string().min(1).max(300)
const LONG = z.string().min(1).max(800)
const MED = z.string().min(1).max(400)

export const deckSlideSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("cover"),
    title: TITLE,
    subtitle: z.string().max(500).optional(),
  }),
  z.object({
    type: z.literal("agenda"),
    title: TITLE,
    items: z.array(MED).min(2).max(20),
  }),
  z.object({
    type: z.literal("section"),
    title: TITLE,
    subtitle: z.string().max(500).optional(),
  }),
  z.object({
    type: z.literal("content"),
    title: TITLE,
    bullets: z.array(LONG).min(1).max(15),
  }),
  z.object({
    type: z.literal("twoColumn"),
    title: TITLE,
    leftTitle: z.string().min(1).max(160),
    left: z.array(MED).min(1).max(12),
    rightTitle: z.string().min(1).max(160),
    right: z.array(MED).min(1).max(12),
  }),
  z.object({
    type: z.literal("stat"),
    title: TITLE,
    stat: z.string().min(1).max(120),
    caption: z.string().max(400).optional(),
  }),
  z.object({
    type: z.literal("quote"),
    quote: z.string().min(1).max(600),
    author: z.string().max(200).optional(),
  }),
  z.object({
    type: z.literal("conclusion"),
    title: TITLE,
    bullets: z.array(LONG).min(1).max(15),
  }),
])

export type DeckSlide = z.infer<typeof deckSlideSchema>
export type DeckSlideType = DeckSlide["type"]

export const deckSchema = z.object({
  slides: z.array(deckSlideSchema).min(3).max(30),
})

export type Deck = z.infer<typeof deckSchema>

// Contenu persisté dans `documents.content_json` pour un type 'presentation'.
export const presentationContentSchema = z.object({
  brief: z.object({
    subject: z.string(),
    audience: z.string().optional().default(""),
    language: z.enum(DECK_LANGUAGES).default("fr"),
    slideCount: z.number().int().min(3).max(20).default(10),
  }),
  theme: z.object({
    accentColor: z.string().default("#7C3BED"),
  }),
  deck: deckSchema,
})

export type PresentationContent = z.infer<typeof presentationContentSchema>
