"use server"

// ============================================================
// Tableau d'approbation interne (Kanban /dashboard/approvals) — données RÉELLES
// Remplace le mock MOCK_ITEMS : charge les vrais posts à traiter avant publication
// (brouillons + en revue + approuvés + rejetés) du tenant et persiste les décisions.
// Les brouillons (draft, toute origine : workflow, API publique, Hermès) tombent
// dans la colonne « à valider » pour être visibles et validables au même endroit.
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { log } from "@/lib/utils/logger"
import { callTextLLM } from "@/lib/services/ai/text-llm"
import { getPromptConfig } from "@/lib/services/ai/prompt-config"
import { sanitizePromptInput } from "@/lib/utils/sanitize"

/** Statuts d'un post sur lesquels l'édition de contenu est permise. */
const EDITABLE_STATUSES = ["draft", "review", "approved", "rejected"]

export type InternalApprovalStatus = "pending_approval" | "approved" | "rejected"

export interface ApprovalBoardItem {
  id: string
  content: string
  /** Identifiant de plateforme (valeur de l'enum). */
  platform: string
  thumbnailUrl: string | null
  authorName: string
  submittedAt: string
  status: InternalApprovalStatus
  /** Vrai si le post est un brouillon (status DB = draft), pour le distinguer
   *  d'un post explicitement soumis en revue (badge « Brouillon » côté UI). */
  isDraft: boolean
  comment: string
}

/** Mapping statut DB → colonne du board. Un brouillon est « à valider ». */
const DB_TO_BOARD: Record<string, InternalApprovalStatus> = {
  draft: "pending_approval",
  review: "pending_approval",
  approved: "approved",
  rejected: "rejected",
}

/**
 * Charge les posts soumis à validation (review/approved/rejected) du tenant courant,
 * avec le nom réel de l'auteur et le commentaire de revue éventuel. Aucune donnée
 * fabriquée : liste vide si rien à examiner.
 */
export async function getApprovalBoardAction(): Promise<{ items: ApprovalBoardItem[] }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { items: [] }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { items: [] }

  const { data: rows } = await supabase
    .from("posts")
    .select("id, content, platforms, media_urls, status, created_by, ai_metadata, updated_at, created_at")
    .eq("tenant_id", tenantId)
    .in("status", ["draft", "review", "approved", "rejected"])
    .order("updated_at", { ascending: false })
    .limit(60)

  const postRows = rows ?? []

  // Noms réels des auteurs (un seul aller-retour).
  const creatorIds = [
    ...new Set(
      postRows
        .map((p) => p.created_by as string | null)
        .filter((v): v is string => typeof v === "string" && v.length > 0)
    ),
  ]
  const namesById = new Map<string, string>()
  if (creatorIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("id", creatorIds)
    for (const u of usersData ?? []) {
      const name = (typeof u.full_name === "string" && u.full_name.trim().length > 0)
        ? u.full_name.trim()
        : (typeof u.email === "string" ? u.email : "")
      namesById.set(u.id as string, name)
    }
  }

  const items: ApprovalBoardItem[] = postRows.map((p) => {
    const platforms = Array.isArray(p.platforms) ? p.platforms : []
    const media = Array.isArray(p.media_urls) ? p.media_urls : []
    const meta =
      p.ai_metadata && typeof p.ai_metadata === "object" && !Array.isArray(p.ai_metadata)
        ? (p.ai_metadata as Record<string, unknown>)
        : {}
    const comment = typeof meta.review_comment === "string" ? meta.review_comment : ""
    const createdBy = p.created_by as string | null
    return {
      id: p.id as string,
      content: p.content as string,
      platform: platforms.length > 0 ? String(platforms[0]) : "twitter",
      thumbnailUrl: media.length > 0 ? String(media[0]) : null,
      authorName: (createdBy && namesById.get(createdBy)) || "—",
      submittedAt: (p.updated_at as string) ?? (p.created_at as string),
      status: DB_TO_BOARD[p.status as string] ?? "pending_approval",
      isDraft: (p.status as string) === "draft",
      comment,
    }
  })

  return { items }
}

/**
 * Persiste une décision d'approbation interne (approuvé / rejeté). Le commentaire
 * d'un rejet est conservé dans `ai_metadata.review_comment`. Tenant-scopé + garde
 * d'état (jamais sur un post déjà en publication).
 */
export async function decideInternalApprovalAction(
  postId: string,
  decision: "approved" | "rejected",
  comment?: string
): Promise<{ success: boolean; error?: string }> {
  if (decision !== "approved" && decision !== "rejected") {
    return { success: false, error: "invalid_decision" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "no_tenant" }

  const { data: post } = await supabase
    .from("posts")
    .select("id, status, ai_metadata")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()

  if (!post) return { success: false, error: "not_found" }

  // Garde d'état : on décide sur un brouillon, un post en revue, ou déjà décidé
  // (re-décision) ; jamais sur un post en cours/déjà publié.
  if (!["draft", "review", "approved", "rejected"].includes(post.status as string)) {
    return { success: false, error: "not_decidable" }
  }

  const meta =
    post.ai_metadata && typeof post.ai_metadata === "object" && !Array.isArray(post.ai_metadata)
      ? { ...(post.ai_metadata as Record<string, unknown>) }
      : {}
  if (decision === "rejected") {
    meta.review_comment = typeof comment === "string" ? comment.trim().slice(0, 1000) : ""
  }

  const { error } = await supabase
    .from("posts")
    .update({
      status: decision,
      ai_metadata: meta,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .in("status", ["draft", "review", "approved", "rejected"])

  if (error) {
    log({
      level: "error",
      module: "approvals",
      action: "decide_failed",
      tenant_id: tenantId,
      metadata: { postId, decision },
    })
    return { success: false, error: "update_failed" }
  }

  return { success: true }
}

/**
 * Réouvre un post (rejeté ou approuvé) pour modification → le repasse en revue.
 */
export async function reopenForReviewAction(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "no_tenant" }

  const { error } = await supabase
    .from("posts")
    .update({ status: "review", updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .in("status", ["approved", "rejected"])

  if (error) return { success: false, error: "update_failed" }
  return { success: true }
}

/**
 * Enregistre le contenu édité d'un post (brouillon ou post en revue/décidé),
 * tenant-scopé, sans changer son statut. Permet d'ouvrir et modifier un
 * brouillon directement depuis le Kanban d'approbation.
 */
export async function updateDraftContentAction(
  postId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "no_tenant" }

  const clean = content.trim()
  if (clean.length < 1) return { success: false, error: "empty" }
  if (clean.length > 3000) return { success: false, error: "too_long" }

  const { error } = await supabase
    .from("posts")
    .update({ content: clean, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .in("status", EDITABLE_STATUSES)

  if (error) return { success: false, error: "update_failed" }
  return { success: true }
}

/**
 * Améliore le texte d'un post via le LLM (proxy LiteLLM). Réécriture plus
 * percutante SANS inventer de faits ni changer la langue. Renvoie le texte
 * proposé ; la persistance reste à la main de l'utilisateur (bouton Enregistrer).
 */
export async function improveDraftAction(input: {
  content: string
  platform?: string
}): Promise<{ success: true; content: string } | { success: false; error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }

  const content = sanitizePromptInput(input.content ?? "")
  if (content.trim().length < 5) return { success: false, error: "too_short" }

  const config = await getPromptConfig("workflow_brief_enrich")
  const platform = (input.platform ?? "").toString().slice(0, 30)
  const systemPrompt =
    "Tu es un expert en rédaction social media. On te donne le texte d'un post. " +
    "Réécris-le pour le rendre plus percutant : accroche claire dès la première ligne, " +
    "structure lisible, appel à l'action pertinent, ton naturel. N'invente AUCUN fait, " +
    "chiffre ni promesse. Conserve la langue d'origine et le sens. Pas de markdown. " +
    "Réponds UNIQUEMENT avec le texte amélioré."
  const userPrompt = [
    platform ? `Plateforme cible : ${platform}` : "",
    "Texte à améliorer :",
    content,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const raw = await callTextLLM({
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      systemPrompt,
      userPrompt,
      maxTokens: 700,
      temperature: config.temperature,
    })
    const improved = raw.trim().replace(/^["']|["']$/g, "").slice(0, 3000)
    if (improved.length < 5) return { success: false, error: "empty" }
    return { success: true, content: improved }
  } catch (err) {
    log({
      level: "error",
      module: "approvals",
      action: "improve_draft_failed",
      message: "Échec de l'amélioration IA du brouillon",
      metadata: { error: String(err) },
    })
    return { success: false, error: "llm_failed" }
  }
}
