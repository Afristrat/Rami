import { z } from "zod"
import { V } from "@/lib/utils/validation-messages"
import type { Platform } from "@/lib/scheduler/platform-config"

// ── Étape 1 — Brief & contexte ───────────────────────────────────────────────

export const step1Schema = z.object({
  titre: z.string().min(2, V.titleRequired).max(200).trim(),
  description: z.string().min(10, V.descriptionRequired).max(2000).trim(),
  objectif: z.enum(["confiance", "urgence", "aspiration", "expertise", "communauté", "joie", "sérénité"]),
  cible: z.string().max(300).trim().optional(),
  // Angle éditorial (sélectionné parmi des suggestions ou saisi) — injecté dans
  // la génération de texte pour orienter l'accroche et le traitement.
  angle: z.string().max(120).trim().optional(),
})

export type Step1Data = z.infer<typeof step1Schema>

// ── Étape 2 — Plateformes & format ──────────────────────────────────────────

export const CONTENT_FORMATS = ["post", "carousel", "story", "reel", "article"] as const
export type ContentFormat = typeof CONTENT_FORMATS[number]

export const step2Schema = z.object({
  platforms: z
    .array(z.enum(["twitter", "linkedin", "facebook", "instagram", "pinterest", "mastodon", "youtube", "tiktok"]))
    .min(1, V.platformRequired),
  format: z.enum(CONTENT_FORMATS),
})

export type Step2Data = z.infer<typeof step2Schema>

// ── Étape 3 — Textes générés ─────────────────────────────────────────────────

export interface GeneratedCaption {
  platform: Platform
  caption: string
  hashtags: string[]
  hook: string
  charCount: number
}

export interface Step3Data {
  captions: GeneratedCaption[]
  selectedCaptionIndex: number
}

// ── Étape 4 — Visuels générés ────────────────────────────────────────────────

export interface GeneratedVisual {
  id: string
  url: string
  prompt: string
  brandDnaScore: number
  /** false = score heuristique de secours (Vision AI indisponible) — l'UI doit le signaler */
  visionScored?: boolean
  provider: "fal" | "replicate" | "placeholder" | "nano_banana" | "fal_ai" | "google_imagen" | "together_ai"
}

export interface Step4Data {
  visuals: GeneratedVisual[]
  selectedVisualId: string | null
}

// ── Étape 5 — Review ─────────────────────────────────────────────────────────

export interface Step5Data {
  finalCaption: string
  finalHashtags: string[]
  finalVisualUrl: string | null
  notes: string
}

// ── Étape 6 — Approbation ────────────────────────────────────────────────────

export interface Step6Data {
  approved: boolean
  approvedAt: string | null
}

// ── Étape 7 — Planification ──────────────────────────────────────────────────

export const step7Schema = z.object({
  publishMode: z.enum(["now", "scheduled"]),
  scheduledAt: z.string().optional().nullable(),
})

export type Step7Data = z.infer<typeof step7Schema>

// ── État global workflow ──────────────────────────────────────────────────────

export interface WorkflowState {
  currentStep: 1 | 2 | 3 | 4 | 5 | 6 | 7
  step1: Step1Data | null
  step2: Step2Data | null
  step3: Step3Data | null
  step4: Step4Data | null
  step5: Step5Data | null
  step6: Step6Data | null
  step7: Step7Data | null
}

export const WORKFLOW_STEPS = [
  { number: 1, label: "Brief", icon: "📝" },
  { number: 2, label: "Plateformes", icon: "🎯" },
  { number: 3, label: "Textes", icon: "✍️" },
  { number: 4, label: "Visuels", icon: "🎨" },
  { number: 5, label: "Review", icon: "👁️" },
  { number: 6, label: "Approbation", icon: "✅" },
  { number: 7, label: "Planification", icon: "📅" },
] as const
