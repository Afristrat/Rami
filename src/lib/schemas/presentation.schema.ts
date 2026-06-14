import { z } from "zod"

// ============================================================
// Schéma d'un deck de présentation RAMI
// ============================================================
// Modèle interne riche (titre + contenu par slide) — sert à la fois à l'aperçu
// écran et à l'export PPTX (mapping vers les templates mckinsey_pptx côté service).
// Chaque variante de slide est validée par un union discriminé sur `type`.

export const DECK_LANGUAGES = ["fr", "ar", "en"] as const
export type DeckLanguage = (typeof DECK_LANGUAGES)[number]

export const deckSlideSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("cover"),
    title: z.string().min(1).max(160),
    subtitle: z.string().max(240).optional(),
  }),
  z.object({
    type: z.literal("agenda"),
    title: z.string().min(1).max(160),
    items: z.array(z.string().min(1).max(160)).min(2).max(10),
  }),
  z.object({
    type: z.literal("section"),
    title: z.string().min(1).max(160),
    subtitle: z.string().max(240).optional(),
  }),
  z.object({
    type: z.literal("content"),
    title: z.string().min(1).max(160),
    bullets: z.array(z.string().min(1).max(320)).min(1).max(8),
  }),
  z.object({
    type: z.literal("twoColumn"),
    title: z.string().min(1).max(160),
    leftTitle: z.string().min(1).max(80),
    left: z.array(z.string().min(1).max(240)).min(1).max(6),
    rightTitle: z.string().min(1).max(80),
    right: z.array(z.string().min(1).max(240)).min(1).max(6),
  }),
  z.object({
    type: z.literal("stat"),
    title: z.string().min(1).max(160),
    stat: z.string().min(1).max(40),
    caption: z.string().max(240).optional(),
  }),
  z.object({
    type: z.literal("quote"),
    quote: z.string().min(1).max(320),
    author: z.string().max(120).optional(),
  }),
  z.object({
    type: z.literal("conclusion"),
    title: z.string().min(1).max(160),
    bullets: z.array(z.string().min(1).max(320)).min(1).max(8),
  }),
])

export type DeckSlide = z.infer<typeof deckSlideSchema>
export type DeckSlideType = DeckSlide["type"]

export const deckSchema = z.object({
  slides: z.array(deckSlideSchema).min(3).max(20),
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
