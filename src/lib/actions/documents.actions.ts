"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { log } from "@/lib/utils/logger"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { normalizeBrandDNA } from "@/lib/services/brand-dna/normalize"
import {
  buildOfferSystemPrompt,
  buildOfferUserPrompt,
  parseOfferContent,
} from "@/lib/services/documents/commercial-offer"
import {
  buildClientReportContent,
  buildReportNarrativeSystemPrompt,
  buildReportNarrativeUserPrompt,
} from "@/lib/services/documents/client-report"
import { fetchAnalyticsBundle } from "@/lib/services/analytics/fetch"
import {
  CreateDocumentSchema,
  CreateClientReportSchema,
  type CreateDocumentInput,
  type CreateClientReportInput,
  type DocumentType,
  type DocumentStatus,
} from "@/lib/schemas/document.schema"

// ── Types publics ──────────────────────────────────────────

export interface DocumentItem {
  id: string
  title: string
  type: DocumentType
  client_name: string | null
  status: DocumentStatus
  storage_path: string | null
  public_url: string | null
  file_size_bytes: number | null
  created_at: string
  updated_at: string
}

export type GetDocumentsResult =
  | { data: DocumentItem[]; total: number }
  | { error: string }

export type GetDocumentDetailResult =
  | { data: DocumentItem & { content_json: unknown; brand_dna_snapshot: unknown } }
  | { error: string }

export type CreateDocumentResult =
  | { data: DocumentItem }
  | { error: string }

export type DeleteDocumentResult =
  | { success: true }
  | { error: string }

// ── Actions ────────────────────────────────────────────────

/**
 * Liste les documents du tenant courant.
 */
export async function getDocumentsAction(options?: {
  search?: string
  type?: DocumentType
  limit?: number
  offset?: number
}): Promise<GetDocumentsResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  let query = supabase
    .from("documents")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.type) {
    query = query.eq("type", options.type)
  } else {
    // Les présentations ont leur propre surface (/presentations) — exclues de la liste Documents.
    query = query.neq("type", "presentation")
  }

  if (options?.search?.trim()) {
    query = query.ilike("title", `%${options.search.trim()}%`)
  }

  const { data, error, count } = await query

  if (error) {
    if (error.code === "42P01") return { data: [], total: 0 }
    return { error: "Erreur lors du chargement des documents." }
  }

  const items: DocumentItem[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    type: row.type as DocumentType,
    client_name: row.client_name,
    status: row.status as DocumentStatus,
    storage_path: row.storage_path,
    public_url: row.public_url,
    file_size_bytes: row.file_size_bytes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }))

  return { data: items, total: count ?? 0 }
}

/**
 * Récupère le détail d'un document.
 */
export async function getDocumentDetailAction(
  id: string
): Promise<GetDocumentDetailResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const { data: doc, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !doc) return { error: "Document introuvable." }

  return {
    data: {
      id: doc.id,
      title: doc.title,
      type: doc.type as DocumentType,
      client_name: doc.client_name,
      status: doc.status as DocumentStatus,
      storage_path: doc.storage_path,
      public_url: doc.public_url,
      file_size_bytes: doc.file_size_bytes,
      content_json: doc.content_json,
      brand_dna_snapshot: doc.brand_dna_snapshot,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    },
  }
}

/**
 * Crée un nouveau document.
 */
export async function createDocumentAction(
  input: CreateDocumentInput
): Promise<CreateDocumentResult> {
  const parsed = CreateDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantId,
      title: parsed.data.title,
      type: parsed.data.type,
      client_name: parsed.data.client_name ?? null,
      status: "draft",
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "42P01") return { error: "La table documents n'existe pas encore. Appliquez la migration." }
    return { error: "Erreur lors de la création du document." }
  }

  revalidatePath("/dashboard/documents")

  return {
    data: {
      id: doc.id,
      title: doc.title,
      type: doc.type as DocumentType,
      client_name: doc.client_name,
      status: doc.status as DocumentStatus,
      storage_path: doc.storage_path,
      public_url: doc.public_url,
      file_size_bytes: doc.file_size_bytes,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    },
  }
}

/**
 * Crée une offre commerciale GÉNÉRÉE par IA (US-025).
 * Brand DNA du tenant + brief → contenu structuré persisté dans content_json.
 * Échec LLM/parsing → erreur honnête, aucun document fabriqué.
 */
export async function createCommercialOfferAction(
  input: CreateDocumentInput
): Promise<CreateDocumentResult> {
  const parsed = CreateDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") }
  }
  if (parsed.data.type !== "offre_commerciale") {
    return { error: "Type de document non pris en charge par la génération d'offre." }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  // Brand DNA du tenant (shape PLATE réelle → normalisation obligatoire).
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  const rawDna: unknown = tenantRow?.brand_dna ?? null
  const brandDNA = normalizeBrandDNA(rawDna)

  // Génération LLM (deepseek via proxy). Échec → erreur honnête, pas de repli inventé.
  let content: ReturnType<typeof parseOfferContent>
  try {
    const config = await getPromptConfig("document_commercial_offer")
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt: config.systemPrompt || buildOfferSystemPrompt(),
      userPrompt: buildOfferUserPrompt({
        title: parsed.data.title,
        clientName: parsed.data.client_name ?? null,
        brief: parsed.data.brief ?? null,
        brandDNA,
      }),
      maxTokens: 3000,
      temperature: config.temperature,
    })
    content = parseOfferContent(raw)
  } catch (err) {
    log({
      level: "error",
      module: "documents",
      action: "offer_generation_failed",
      tenant_id: tenantId,
      message: "Échec de l'appel LLM pour la génération d'offre commerciale",
      metadata: { error: String(err) },
    })
    return { error: "La génération de l'offre a échoué. Réessayez dans quelques instants." }
  }

  if (!content) {
    log({
      level: "error",
      module: "documents",
      action: "offer_parse_failed",
      tenant_id: tenantId,
      message: "Réponse LLM non conforme au schéma d'offre commerciale",
    })
    return { error: "La génération de l'offre a produit un contenu invalide. Réessayez." }
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantId,
      title: parsed.data.title,
      type: "offre_commerciale",
      client_name: parsed.data.client_name ?? null,
      status: "completed",
      content_json: content,
      brand_dna_snapshot: rawDna,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "42P01") return { error: "La table documents n'existe pas encore. Appliquez la migration." }
    return { error: "Erreur lors de l'enregistrement de l'offre." }
  }

  revalidatePath("/dashboard/documents")

  return {
    data: {
      id: doc.id,
      title: doc.title,
      type: doc.type as DocumentType,
      client_name: doc.client_name,
      status: doc.status as DocumentStatus,
      storage_path: doc.storage_path,
      public_url: doc.public_url,
      file_size_bytes: doc.file_size_bytes,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    },
  }
}

/**
 * Crée un rapport client de performance (US-026).
 * Chiffres 100 % RÉELS (post_metrics via fetchAnalyticsBundle) ; le LLM ne
 * fait que COMMENTER ces chiffres — s'il est indisponible, le rapport est
 * produit sans narrative (repli honnête, jamais de chiffre inventé).
 */
export async function createClientReportAction(
  input: CreateClientReportInput
): Promise<CreateDocumentResult> {
  const parsed = CreateClientReportSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join(", ") }
  }

  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  // Brand DNA pour le branding du rapport (nom de marque).
  const { data: tenantRow } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  const rawDna: unknown = tenantRow?.brand_dna ?? null
  const brandDNA = normalizeBrandDNA(rawDna)

  // Analytics réelles de la période (Drizzle, tenantId issu de la session).
  let report: ReturnType<typeof buildClientReportContent>
  try {
    const bundle = await fetchAnalyticsBundle(tenantId, parsed.data.period)
    report = buildClientReportContent({
      period: parsed.data.period,
      start: bundle.start,
      end: bundle.end,
      brandName: brandDNA.identity?.name ?? null,
      analytics: bundle.data,
      currentMetrics: bundle.currentMetrics,
    })
  } catch (err) {
    log({
      level: "error",
      module: "documents",
      action: "report_metrics_failed",
      tenant_id: tenantId,
      message: "Échec du chargement des metrics pour le rapport client",
      metadata: { error: String(err) },
    })
    return { error: "Impossible de charger les données de performance. Réessayez." }
  }

  // Narrative LLM (commentaire des chiffres réels) — repli silencieux si échec.
  try {
    const config = await getPromptConfig("document_client_report")
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt: config.systemPrompt || buildReportNarrativeSystemPrompt(),
      userPrompt: buildReportNarrativeUserPrompt(report),
      maxTokens: 500,
      temperature: config.temperature,
    })
    report = { ...report, narrative: raw.trim() }
  } catch (err) {
    log({
      level: "warn",
      module: "documents",
      action: "report_narrative_fallback",
      tenant_id: tenantId,
      message: "Narrative LLM indisponible — rapport produit sans synthèse",
      metadata: { error: String(err) },
    })
  }

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantId,
      title: parsed.data.title,
      type: "rapport_client",
      client_name: parsed.data.client_name ?? null,
      status: "completed",
      content_json: report,
      brand_dna_snapshot: rawDna,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "42P01") return { error: "La table documents n'existe pas encore. Appliquez la migration." }
    return { error: "Erreur lors de l'enregistrement du rapport." }
  }

  revalidatePath("/dashboard/documents")

  return {
    data: {
      id: doc.id,
      title: doc.title,
      type: doc.type as DocumentType,
      client_name: doc.client_name,
      status: doc.status as DocumentStatus,
      storage_path: doc.storage_path,
      public_url: doc.public_url,
      file_size_bytes: doc.file_size_bytes,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    },
  }
}

/**
 * Duplique un document (copie du contenu, statut conservé).
 */
export async function duplicateDocumentAction(
  id: string
): Promise<CreateDocumentResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  const { data: source, error: sourceError } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (sourceError || !source) return { error: "Document introuvable." }

  const { data: doc, error } = await supabase
    .from("documents")
    .insert({
      tenant_id: tenantId,
      title: `${source.title} (copie)`.slice(0, 500),
      type: source.type,
      client_name: source.client_name,
      status: source.status,
      content_json: source.content_json,
      brand_dna_snapshot: source.brand_dna_snapshot,
      created_by: user.id,
    })
    .select()
    .single()

  if (error || !doc) return { error: "Erreur lors de la duplication du document." }

  revalidatePath("/dashboard/documents")

  return {
    data: {
      id: doc.id,
      title: doc.title,
      type: doc.type as DocumentType,
      client_name: doc.client_name,
      status: doc.status as DocumentStatus,
      storage_path: doc.storage_path,
      public_url: doc.public_url,
      file_size_bytes: doc.file_size_bytes,
      created_at: doc.created_at,
      updated_at: doc.updated_at,
    },
  }
}

/**
 * Supprime un document.
 */
export async function deleteDocumentAction(
  id: string
): Promise<DeleteDocumentResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)

  if (error) return { error: "Erreur lors de la suppression du document." }

  revalidatePath("/dashboard/documents")

  return { success: true }
}
