"use server"

// ============================================================
// Présentations — génération RÉELLE d'un deck (LLM) + persistance
// Remplace le module mock (MOCK_SLIDES/MOCK_THEMES). Le deck est stocké dans
// la table `documents` (type 'presentation', content_json).
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { normalizeBrandDNA } from "@/lib/services/brand-dna/normalize"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { log } from "@/lib/utils/logger"
import { revalidatePath } from "next/cache"
import {
  buildDeckSystemPrompt,
  buildDeckUserPrompt,
  parseDeck,
} from "@/lib/services/documents/presentation-deck"
import {
  DECK_LANGUAGES,
  presentationContentSchema,
  type DeckLanguage,
  type PresentationContent,
} from "@/lib/schemas/presentation.schema"
import { z } from "zod"

const CreatePresentationSchema = z.object({
  subject: z.string().min(3).max(2000).trim(),
  audience: z.string().max(500).trim().optional().default(""),
  language: z.enum(DECK_LANGUAGES).default("fr"),
  slideCount: z.coerce.number().int().min(3).max(20).default(10),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export type CreatePresentationInput = z.infer<typeof CreatePresentationSchema>

export type CreatePresentationResult =
  | { id: string }
  | { error: string }

export async function createPresentationDeckAction(
  input: CreatePresentationInput
): Promise<CreatePresentationResult> {
  const parsed = CreatePresentationSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  const rawDna: unknown = tenantRow?.brand_dna ?? null
  const brandDNA = normalizeBrandDNA(rawDna)

  // Génération LLM (deepseek via proxy). Échec → erreur honnête, aucun deck fabriqué.
  let deck
  try {
    const config = await getPromptConfig("document_presentation")
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt: buildDeckSystemPrompt(),
      userPrompt: buildDeckUserPrompt({
        subject: parsed.data.subject,
        audience: parsed.data.audience,
        language: parsed.data.language as DeckLanguage,
        slideCount: parsed.data.slideCount,
        brandDNA,
      }),
      maxTokens: 4000,
      temperature: config.temperature,
    })
    deck = parseDeck(raw)
  } catch (err) {
    log({
      level: "error",
      module: "presentations",
      action: "deck_generation_failed",
      tenant_id: tenantId,
      message: "Échec de l'appel LLM pour la génération du deck",
      metadata: { error: String(err) },
    })
    return { error: "La génération de la présentation a échoué. Réessayez dans quelques instants." }
  }

  if (!deck) {
    log({
      level: "error",
      module: "presentations",
      action: "deck_parse_failed",
      tenant_id: tenantId,
      message: "Réponse LLM non conforme au schéma de deck",
    })
    return { error: "La génération de la présentation a produit un contenu invalide. Réessayez." }
  }

  const content: PresentationContent = {
    brief: {
      subject: parsed.data.subject,
      audience: parsed.data.audience,
      language: parsed.data.language as DeckLanguage,
      slideCount: parsed.data.slideCount,
    },
    theme: { accentColor: parsed.data.accentColor ?? "#7C3BED" },
    deck,
  }

  const title = parsed.data.subject.slice(0, 120)

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantId,
      title,
      type: "presentation",
      status: "completed",
      content_json: content,
      brand_dna_snapshot: rawDna,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error || !doc) {
    if (error?.code === "42P01") return { error: "La table documents n'existe pas encore. Appliquez la migration." }
    return { error: "Erreur lors de l'enregistrement de la présentation." }
  }

  revalidatePath("/presentations")
  revalidatePath("/dashboard/documents")

  return { id: doc.id }
}

export interface PresentationDetail {
  id: string
  title: string
  content: PresentationContent
  created_at: string
}

export async function getPresentationDetailAction(
  id: string
): Promise<{ presentation: PresentationDetail | null }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { presentation: null }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { presentation: null }

  const { data: doc } = await supabase
    .from("documents")
    .select("id, title, type, content_json, created_at")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("type", "presentation")
    .single()

  if (!doc) return { presentation: null }

  const parsed = presentationContentSchema.safeParse(doc.content_json)
  if (!parsed.success) return { presentation: null }

  return {
    presentation: {
      id: doc.id as string,
      title: doc.title as string,
      content: parsed.data,
      created_at: doc.created_at as string,
    },
  }
}

export interface PresentationListItem {
  id: string
  title: string
  slideCount: number
  created_at: string
}

export async function listPresentationsAction(): Promise<{ items: PresentationListItem[] }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { items: [] }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { items: [] }

  const { data: rows } = await supabase
    .from("documents")
    .select("id, title, content_json, created_at")
    .eq("tenant_id", tenantId)
    .eq("type", "presentation")
    .order("created_at", { ascending: false })
    .limit(50)

  const items: PresentationListItem[] = (rows ?? []).map((r) => {
    const parsed = presentationContentSchema.safeParse(r.content_json)
    const slideCount = parsed.success ? parsed.data.deck.slides.length : 0
    return {
      id: r.id as string,
      title: r.title as string,
      slideCount,
      created_at: r.created_at as string,
    }
  })

  return { items }
}
