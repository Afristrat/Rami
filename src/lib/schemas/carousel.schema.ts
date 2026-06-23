import { z } from "zod"

// ============================================================
// Schéma d'un carrousel (document LinkedIn natif) — slides typées.
// Le moteur rend ces slides en composants React (aperçu fidèle) ET en PDF
// (@react-pdf). Contraintes généreuses + sauvetage par slide dans parseCarousel.
// ============================================================

export const coverSlide = z.object({
  type: z.literal("cover"),
  eyebrow: z.string().max(60).optional(),
  title: z.string().min(1).max(120),
  subtitle: z.string().max(200).optional(),
  author: z.string().max(80).optional(),
})

export const pointSlide = z.object({
  type: z.literal("point"),
  index: z.string().max(6).optional(), // ex. "01"
  heading: z.string().min(1).max(120),
  body: z.string().max(400).optional(),
  bullets: z.array(z.string().max(160)).max(6).optional(),
})

export const statSlide = z.object({
  type: z.literal("stat"),
  value: z.string().min(1).max(20), // ex. "1 000"
  label: z.string().min(1).max(120),
  context: z.string().max(240).optional(),
})

export const quoteSlide = z.object({
  type: z.literal("quote"),
  text: z.string().min(1).max(300),
  attribution: z.string().max(80).optional(),
})

export const comparisonSlide = z.object({
  type: z.literal("comparison"),
  leftTitle: z.string().min(1).max(60),
  leftItems: z.array(z.string().max(160)).min(1).max(5),
  rightTitle: z.string().min(1).max(60),
  rightItems: z.array(z.string().max(160)).min(1).max(5),
})

export const ctaSlide = z.object({
  type: z.literal("cta"),
  heading: z.string().min(1).max(120),
  body: z.string().max(240).optional(),
  action: z.string().max(120).optional(),
})

export const carouselSlide = z.discriminatedUnion("type", [
  coverSlide,
  pointSlide,
  statSlide,
  quoteSlide,
  comparisonSlide,
  ctaSlide,
])
export type CarouselSlide = z.infer<typeof carouselSlide>

export const carouselSchema = z.object({
  theme: z.enum(["dark", "light"]).default("dark"),
  accentHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#F59E0B"),
  handle: z.string().max(60).optional(),
  author: z.string().max(80).optional(),
  slides: z.array(carouselSlide).min(1).max(12),
})
export type Carousel = z.infer<typeof carouselSchema>

/**
 * Parse tolérant : un objet invalide pour une slide ne tue pas tout le deck
 * (sauvetage par slide). Renvoie null si rien de valide.
 */
export function parseCarousel(input: unknown): Carousel | null {
  if (typeof input !== "object" || input === null) return null
  const obj = input as Record<string, unknown>
  const rawSlides = Array.isArray(obj.slides) ? obj.slides : []
  const slides: CarouselSlide[] = []
  for (const s of rawSlides) {
    const r = carouselSlide.safeParse(s)
    if (r.success) slides.push(r.data)
  }
  if (slides.length === 0) return null
  const meta = carouselSchema
    .omit({ slides: true })
    .safeParse({ theme: obj.theme, accentHex: obj.accentHex, handle: obj.handle, author: obj.author })
  const base = meta.success ? meta.data : { theme: "dark" as const, accentHex: "#F59E0B" }
  return { ...base, slides }
}
