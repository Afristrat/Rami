import { z } from "zod"

// ============================================================
// Schéma d'un POST VISUEL « design-first » — une carte composée par le CODE
// (vraie typo Noto, accents garantis, couleurs Brand DNA), pas hallucinée par
// l'IA image. Rendu en image via next/og (Satori) → WebP (sharp) → MinIO.
//
// 4 layouts couvrant les posts de feed les plus fréquents. Contraintes
// généreuses ; `parsePostVisual` fait un sauvetage tolérant (jamais de crash).
// ============================================================

/** Format → ratio d'aspect (le 1er est le défaut). 1080 px de large dans tous les cas. */
export const POST_FORMATS = ["1:1", "4:5", "9:16"] as const
export type PostFormat = (typeof POST_FORMATS)[number]

/** Dimensions de rendu (largeur fixe 1080) par format. */
export const POST_DIMENSIONS: Record<PostFormat, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
}

// ── Layouts ──────────────────────────────────────────────────────────────────

/** Affirmation / accroche : le post de feed le plus courant. */
export const headlineLayout = z.object({
  type: z.literal("headline"),
  eyebrow: z.string().max(60).optional(),
  title: z.string().min(1).max(160),
  subtitle: z.string().max(240).optional(),
})

/** Chiffre clé mis en avant. */
export const statLayout = z.object({
  type: z.literal("stat"),
  value: z.string().min(1).max(20), // ex. "1 000"
  label: z.string().min(1).max(140),
  context: z.string().max(240).optional(),
})

/** Citation / verbatim. */
export const quoteLayout = z.object({
  type: z.literal("quote"),
  text: z.string().min(1).max(320),
  attribution: z.string().max(80).optional(),
})

/** Liste de points (conseils, étapes, bénéfices). */
export const checklistLayout = z.object({
  type: z.literal("checklist"),
  title: z.string().min(1).max(140),
  items: z.array(z.string().max(160)).min(1).max(6),
})

export const postLayout = z.discriminatedUnion("type", [
  headlineLayout,
  statLayout,
  quoteLayout,
  checklistLayout,
])
export type PostLayout = z.infer<typeof postLayout>
export type PostLayoutType = PostLayout["type"]

// ── Carte complète ───────────────────────────────────────────────────────────

/** Formes Gestalt (psychologie des formes) appliquées au décor de la carte. */
export const GESTALT_SHAPE_KEYS = ["cercle", "carre", "triangle", "diagonales", "courbes", "grille"] as const
export type GestaltShapeKeyZ = (typeof GESTALT_SHAPE_KEYS)[number]

/**
 * Tokens de marque injectés par le SERVEUR (Brand DNA Resolver) — jamais par le
 * LLM. Garantissent l'application visuelle de l'identité : pastille logo/monogramme,
 * texte lisible sur l'accent, forme Gestalt selon le secteur.
 */
export const brandMarkSchema = z.object({
  /** Initiales de repli (quand pas de logo). */
  monogram: z.string().min(1).max(3),
  /** Texte lisible posé sur l'accent (contraste WCAG, calculé serveur). */
  onAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  /** Couleur secondaire de marque (optionnelle). */
  secondary: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  /** Forme Gestalt dominante (dérivée du secteur). */
  shapeKey: z.enum(GESTALT_SHAPE_KEYS),
  /** Data URI du logo si exploitable (sinon on rend le monogramme). */
  logoDataUrl: z.string().optional(),
})
export type BrandMark = z.infer<typeof brandMarkSchema>

export const postVisualSchema = z.object({
  format: z.enum(POST_FORMATS).default("1:1"),
  theme: z.enum(["dark", "light"]).default("dark"),
  accentHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#F59E0B"),
  /** Marque / handle affiché en pied (ex. "@ai-mpower"). */
  handle: z.string().max(60).optional(),
  /** Tokens de marque (injectés serveur depuis le Brand DNA Resolver). */
  brand: brandMarkSchema.optional(),
  layout: postLayout,
})
export type PostVisual = z.infer<typeof postVisualSchema>

/**
 * Parse tolérant : valide le layout ; si invalide, renvoie null (le caller
 * affiche une erreur honnête plutôt que de rendre une carte cassée).
 */
export function parsePostVisual(input: unknown): PostVisual | null {
  if (typeof input !== "object" || input === null) return null
  const obj = input as Record<string, unknown>
  const layout = postLayout.safeParse(obj.layout)
  if (!layout.success) return null
  const meta = postVisualSchema
    .omit({ layout: true })
    .safeParse({
      format: obj.format,
      theme: obj.theme,
      accentHex: obj.accentHex,
      handle: obj.handle,
      brand: obj.brand,
    })
  const base = meta.success
    ? meta.data
    : { format: "1:1" as const, theme: "dark" as const, accentHex: "#F59E0B" }
  return { ...base, layout: layout.data }
}
