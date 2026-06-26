// ============================================================
// Mishkāt — Schéma Zod du brief vidéo (entrée du formulaire RAMI)
// Sous-ensemble simplifié exposé à l'utilisateur, dérivé en MishkatBrief.
// ============================================================

import { z } from 'zod'
import {
  MISHKAT_AUDIENCES,
  MISHKAT_TONES,
  MISHKAT_OBJECTIVES,
  MISHKAT_LANGS,
  type MishkatBrief,
} from '@/lib/services/mishkat/types'

export const MishkatVideoInputSchema = z.object({
  intent: z.string().min(10).max(1000).trim(),
  audience: z.enum(MISHKAT_AUDIENCES),
  tone: z.enum(MISHKAT_TONES),
  objective: z.enum(MISHKAT_OBJECTIVES),
  duration_s: z.number().int().min(10).max(180),
  primaryLang: z.enum(MISHKAT_LANGS).default('fr'),
  secondaryLang: z.enum(MISHKAT_LANGS).optional(),
  music: z.boolean().default(true),
  voiceover: z.boolean().default(false),
  captionsBurned: z.boolean().default(true),
  // Images de la bibliothèque du tenant (flux v1 « pool »), max 8.
  assetIds: z.array(z.string().uuid()).max(8).default([]),
  title: z.string().max(120).optional(),
})

export type MishkatVideoInput = z.infer<typeof MishkatVideoInputSchema>

/**
 * Dérive le brief Mishkāt complet. Force deux formats (16:9 + 9:16) et le
 * bilinguisme (primary + secondary) → 4 variantes : (FR·AR) × (16:9·9:16).
 */
export function toMishkatBrief(brandId: string, input: MishkatVideoInput): MishkatBrief {
  const rtl = input.primaryLang === 'ar' || input.primaryLang === 'darija'
  return {
    brand_id: brandId,
    intent: input.intent,
    audience: input.audience,
    channel_format: [
      { channel: 'youtube', aspect: '16:9' },
      { channel: 'reels', aspect: '9:16' },
    ],
    language: {
      primary: input.primaryLang,
      ...(input.secondaryLang ? { secondary: input.secondaryLang } : {}),
      rtl,
    },
    tone: input.tone,
    duration_s: input.duration_s,
    objective: input.objective,
    sound: {
      music: input.music,
      voiceover: input.voiceover,
      captions_burned: input.captionsBurned,
    },
    ...(input.title ? { title: input.title } : {}),
  }
}
