// ============================================================
// API publique v1 — contrat des visuels (US-052)
// Schéma du POST /api/v1/visuals/generate et de la régénération.
// Distinct de visual.schema.ts (modèle interne brief→directions) : ici c'est le
// contrat EXTERNE de l'API publique, extensible par type/format.
// Aucune marque codée en dur : la marque cible est résolue par tenant (brand_id).
// ============================================================

import { z } from "zod"

/** Types de média. Enum OUVERT par conception : carousel/image en v1, video/story… ensuite. */
export const VISUAL_API_TYPES = ["carousel", "image"] as const
export type VisualApiType = (typeof VISUAL_API_TYPES)[number]

/** Formats autorisés par type/canal (valeurs libres validées, pas un enum figé). */
export const VISUAL_API_FORMATS: Record<string, string[]> = {
  carousel: ["1:1", "4:5"],
  image: ["1:1", "4:5", "9:16", "16:9"],
}

/** Vrai si `format` est autorisé pour `type`. */
export function assertFormatForType(type: string, format: string): boolean {
  return (VISUAL_API_FORMATS[type] ?? []).includes(format)
}

export const GenerateVisualSchema = z
  .object({
    type: z.enum(VISUAL_API_TYPES),
    format: z.string().min(3),
    content: z.record(z.string(), z.unknown()),
    brand_id: z.string().uuid().optional(),
  })
  .refine((v) => assertFormatForType(v.type, v.format), {
    message: "format non autorisé pour ce type",
    path: ["format"],
  })

export type GenerateVisualInput = z.infer<typeof GenerateVisualSchema>

export const RegenerateVisualSchema = z.object({
  defects: z
    .array(
      z.object({
        slide: z.number().int().optional(),
        type: z.string(),
        desc: z.string(),
      })
    )
    .min(1),
})

export type RegenerateVisualInput = z.infer<typeof RegenerateVisualSchema>
