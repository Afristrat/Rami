"use server"

// ============================================================
// Présentations — génération RÉELLE d'un deck (LLM) + persistance
// Remplace le module mock (MOCK_SLIDES/MOCK_THEMES). Le deck est stocké dans
// la table `documents` (type 'presentation', content_json).
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { normalizeBrandDNA } from "@/lib/services/brand-dna/normalize"
import { resolveBrandIdentity, type BrandIdentity } from "@/lib/services/brand-dna/resolver"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { log } from "@/lib/utils/logger"
import { revalidatePath } from "next/cache"
import {
  buildDeckSystemPrompt,
  buildDeckUserPrompt,
  buildDeckRevisionPrompt,
  buildDeckConversionPrompt,
  parseDeck,
} from "@/lib/services/documents/presentation-deck"
import { extractTextFromFile, MAX_IMPORT_BYTES } from "@/lib/services/documents/file-extract"
import {
  DECK_LANGUAGES,
  deckSchema,
  presentationContentSchema,
  type Deck,
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

/** Construit le thème visuel d'un deck depuis l'identité résolue (Brand DNA). */
function themeFromIdentity(identity: BrandIdentity, explicitAccent?: string) {
  return {
    accentColor: explicitAccent ?? identity.accent,
    secondary: identity.secondary ?? undefined,
    logoDataUrl: identity.logoDataUrl ?? undefined,
    monogram: identity.monogram,
    onAccent: identity.onAccent,
    shapeKey: identity.shapeKey,
  }
}

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
    .select("brand_dna, name")
    .eq("id", tenantId)
    .single()

  const rawDna: unknown = tenantRow?.brand_dna ?? null
  const brandDNA = normalizeBrandDNA(rawDna)
  const identity = resolveBrandIdentity(rawDna, { tenantName: tenantRow?.name ?? null })

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
    theme: themeFromIdentity(identity, parsed.data.accentColor),
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

/**
 * Crée une présentation À PARTIR D'UN FICHIER importé (MD/PDF-texte/Word/Excel).
 * Extraction serveur → conversion LLM (mode CONVERSION, prompt L99) → deck persisté.
 * Échec d'extraction/LLM → erreur honnête, aucun deck fabriqué.
 */
export async function createPresentationFromFileAction(
  formData: FormData
): Promise<CreatePresentationResult> {
  const file = formData.get("file")
  if (!(file instanceof File)) return { error: "Aucun fichier fourni." }
  if (file.size === 0) return { error: "Fichier vide." }
  if (file.size > MAX_IMPORT_BYTES) return { error: "Fichier trop volumineux (max 20 Mo)." }

  const audience = String(formData.get("audience") ?? "").trim().slice(0, 500)
  const langRaw = String(formData.get("language") ?? "fr")
  const language = (DECK_LANGUAGES as readonly string[]).includes(langRaw)
    ? (langRaw as DeckLanguage)
    : "fr"
  const slideCount = Math.min(20, Math.max(3, Math.round(Number(formData.get("slideCount")) || 10)))

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  // Extraction serveur
  const buffer = Buffer.from(await file.arrayBuffer())
  const extracted = await extractTextFromFile({ buffer, mime: file.type, filename: file.name })
  if (!extracted.ok) {
    const messages: Record<typeof extracted.error, string> = {
      unsupported_type: "Format non supporté. Formats acceptés : Markdown, PDF (avec texte), Word (.docx), Excel (.xlsx).",
      extraction_failed: "Impossible de lire le contenu du fichier.",
      empty_or_image: "Aucun texte exploitable. Un PDF scanné/aplati (image) n'est pas pris en charge.",
    }
    return { error: messages[extracted.error] }
  }

  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("brand_dna, name")
    .eq("id", tenantId)
    .single()
  const rawDna: unknown = tenantRow?.brand_dna ?? null
  const brandDNA = normalizeBrandDNA(rawDna)
  const identity = resolveBrandIdentity(rawDna, { tenantName: tenantRow?.name ?? null })

  // Conversion LLM (mode CONVERSION → fidélité aux faits/chiffres de la source).
  let deck
  try {
    const config = await getPromptConfig("document_presentation")
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt: buildDeckSystemPrompt(),
      userPrompt: buildDeckConversionPrompt({
        sourceText: extracted.data.text,
        truncated: extracted.data.truncated,
        audience,
        language,
        slideCount,
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
      action: "deck_import_failed",
      tenant_id: tenantId,
      metadata: { filename: file.name, error: String(err) },
    })
    return { error: "La conversion du fichier a échoué. Réessayez dans quelques instants." }
  }
  if (!deck) return { error: "La conversion a produit un contenu invalide. Réessayez." }

  const cover = deck.slides.find((s) => s.type === "cover")
  const fileBase = file.name.replace(/\.[^.]+$/, "").slice(0, 120)
  const title = ((cover && "title" in cover ? cover.title : fileBase) || "Présentation importée").slice(0, 120)

  const content: PresentationContent = {
    brief: { subject: `Import : ${fileBase}`.slice(0, 200), audience, language, slideCount },
    theme: themeFromIdentity(identity),
    deck,
  }

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

const HEX_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Enregistre les modifications d'un deck (édition structurée) : remplace le deck
 * et la couleur d'accent dans content_json. Le deck est revalidé (jamais de
 * structure corrompue persistée).
 */
export async function updatePresentationDeckAction(
  id: string,
  input: { deck: unknown; accentColor?: string }
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "no_tenant" }

  const parsedDeck = deckSchema.safeParse(input.deck)
  if (!parsedDeck.success) return { success: false, error: "invalid_deck" }

  // Charger le contenu existant pour préserver brief/theme.
  const { data: doc } = await supabase
    .from("documents")
    .select("content_json, title")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("type", "presentation")
    .single()
  if (!doc) return { success: false, error: "not_found" }

  const existing = presentationContentSchema.safeParse(doc.content_json)
  if (!existing.success) return { success: false, error: "corrupt" }

  const accent =
    typeof input.accentColor === "string" && HEX_RE.test(input.accentColor)
      ? input.accentColor
      : existing.data.theme.accentColor

  const nextContent: PresentationContent = {
    ...existing.data,
    theme: { accentColor: accent },
    deck: parsedDeck.data,
  }

  // Titre = titre de la slide de couverture si présent (suit les renommages).
  const cover = parsedDeck.data.slides.find((s) => s.type === "cover")
  const nextTitle = cover && "title" in cover ? cover.title.slice(0, 120) : (doc.title as string)

  const { error } = await supabase
    .from("documents")
    .update({ content_json: nextContent, title: nextTitle, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("type", "presentation")

  if (error) return { success: false, error: "update_failed" }

  revalidatePath(`/presentations/${id}`)
  revalidatePath("/presentations")
  return { success: true }
}

/**
 * Retouche IA : applique une instruction en langage naturel au deck via le LLM
 * et renvoie le deck révisé (validé). N'enregistre PAS — le client revoit puis
 * sauvegarde. Échec/contenu invalide → erreur honnête, deck inchangé.
 */
export async function revisePresentationDeckAction(
  id: string,
  instruction: string
): Promise<{ deck: Deck } | { error: string }> {
  const trimmed = instruction.trim()
  if (trimmed.length < 3) return { error: "instruction_too_short" }
  if (trimmed.length > 1000) return { error: "instruction_too_long" }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "unauthenticated" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "no_tenant" }

  const { data: doc } = await supabase
    .from("documents")
    .select("content_json")
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .eq("type", "presentation")
    .single()
  if (!doc) return { error: "not_found" }

  const existing = presentationContentSchema.safeParse(doc.content_json)
  if (!existing.success) return { error: "corrupt" }

  try {
    const config = await getPromptConfig("document_presentation")
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt: buildDeckSystemPrompt(),
      userPrompt: buildDeckRevisionPrompt({
        currentDeckJson: JSON.stringify(existing.data.deck),
        instruction: trimmed,
        language: existing.data.brief.language,
      }),
      maxTokens: 4000,
      temperature: config.temperature,
    })
    const revised = parseDeck(raw)
    if (!revised) return { error: "invalid_revision" }
    return { deck: revised }
  } catch (err) {
    log({
      level: "error",
      module: "presentations",
      action: "deck_revision_failed",
      tenant_id: tenantId,
      metadata: { id, error: String(err) },
    })
    return { error: "revision_failed" }
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
