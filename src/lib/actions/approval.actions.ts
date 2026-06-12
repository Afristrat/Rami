"use server"

// ============================================================
// Approbation externe (LOT 1 Step 6) — actions serveur
//
// 1. createApprovalLinkAction : crée le post (statut review) + un token
//    capability à durée limitée → URL publique /approve/[token].
// 2. decideApprovalAction : décision de l'approbateur EXTERNE (sans compte) —
//    le token unique et non expiré EST l'authentification ; l'accès DB passe
//    par le client service-role avec lookup exclusif sur le token.
// ============================================================

import { randomBytes } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { saveWorkflowPostAction } from "@/lib/actions/workflow.actions"
import {
  APPROVAL_TOKEN_TTL_DAYS,
  buildApprovalUrl,
  isApprovalActionable,
  isValidApprovalToken,
  type ApprovalTokenStatus,
} from "@/lib/services/workflow/approval-link"
import { log } from "@/lib/utils/logger"
import type { Step1Data, Step2Data } from "@/lib/schemas/workflow.schema"

export type CreateApprovalLinkResult =
  | { success: true; url: string; postId: string }
  | { success: false; error: string }

/**
 * Crée le post du workflow en statut « review » et génère un lien
 * d'approbation externe réel (token aléatoire, expiration 14 jours).
 */
export async function createApprovalLinkAction(input: {
  step1: Step1Data
  step2: Step2Data
  finalCaption: string
  finalHashtags: string[]
  finalVisualUrl: string | null
}): Promise<CreateApprovalLinkResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "Aucun espace de travail trouvé" }

  // 1. Post réel en statut review (réutilise la sauvegarde du workflow)
  const saved = await saveWorkflowPostAction({
    step1: input.step1,
    step2: input.step2,
    finalCaption: input.finalCaption,
    finalHashtags: input.finalHashtags,
    finalVisualUrl: input.finalVisualUrl,
    scheduledAt: null,
    status: "review",
  })
  if (!saved.success) return { success: false, error: saved.error }

  // 2. Token capability (32 octets aléatoires → 43 caractères base64url)
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + APPROVAL_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)

  const { error } = await supabase.from("approval_tokens").insert({
    tenant_id: tenantId,
    post_id: saved.postId,
    token,
    status: "pending",
    expires_at: expiresAt.toISOString(),
    created_by: user.id,
  })

  if (error) {
    log({
      level: "error",
      module: "approval",
      action: "create_link_failed",
      tenant_id: tenantId,
      metadata: { postId: saved.postId, error: error.message },
    })
    return { success: false, error: "Échec de la création du lien d'approbation." }
  }

  log({
    level: "info",
    module: "approval",
    action: "link_created",
    tenant_id: tenantId,
    metadata: { postId: saved.postId, expires_at: expiresAt.toISOString() },
  })

  return {
    success: true,
    url: buildApprovalUrl(process.env.NEXT_PUBLIC_APP_URL, token),
    postId: saved.postId,
  }
}

// ── Lecture publique (page /approve/[token]) ─────────────────────────────────

export interface PublicApprovalView {
  state: "pending" | "approved" | "rejected" | "expired" | "not_found"
  post?: {
    title: string | null
    content: string
    platforms: string[]
    mediaUrls: string[]
    tenantName: string | null
  }
}

/**
 * Charge le contenu à approuver pour la page publique. Lookup exclusivement
 * par token (validé en forme) via service-role — aucune donnée d'un autre
 * post n'est accessible.
 */
export async function getApprovalByToken(token: string): Promise<PublicApprovalView> {
  if (!isValidApprovalToken(token)) return { state: "not_found" }

  const service = createServiceClient()
  const { data: row } = await service
    .from("approval_tokens")
    .select("id, status, expires_at, post_id, tenant_id")
    .eq("token", token)
    .maybeSingle()

  if (!row) return { state: "not_found" }

  const { data: post } = await service
    .from("posts")
    .select("title, content, platforms, media_urls")
    .eq("id", row.post_id as string)
    .maybeSingle()

  if (!post) return { state: "not_found" }

  const { data: tenant } = await service
    .from("tenants")
    .select("name")
    .eq("id", row.tenant_id as string)
    .maybeSingle()

  const actionability = isApprovalActionable({
    status: row.status as ApprovalTokenStatus,
    expires_at: row.expires_at as string,
  })

  const state: PublicApprovalView["state"] = actionability.actionable
    ? "pending"
    : actionability.reason === "expired"
    ? "expired"
    : (row.status as "approved" | "rejected")

  return {
    state,
    post: {
      title: (post.title as string | null) ?? null,
      content: post.content as string,
      platforms: (post.platforms as string[]) ?? [],
      mediaUrls: (post.media_urls as string[]) ?? [],
      tenantName: (tenant?.name as string | undefined) ?? null,
    },
  }
}

// ── Décision publique ────────────────────────────────────────────────────────

export type DecideApprovalResult =
  | { success: true; decision: "approved" | "rejected" }
  | { success: false; error: "not_found" | "expired" | "already_decided" | "failed" }

/**
 * Enregistre la décision de l'approbateur externe : met à jour le token ET le
 * statut du post (approved → « approved », rejected → retour en « draft »).
 */
export async function decideApprovalAction(
  token: string,
  decision: "approved" | "rejected",
  comment?: string
): Promise<DecideApprovalResult> {
  if (!isValidApprovalToken(token)) return { success: false, error: "not_found" }
  if (decision !== "approved" && decision !== "rejected") {
    return { success: false, error: "failed" }
  }

  const service = createServiceClient()
  const { data: row } = await service
    .from("approval_tokens")
    .select("id, status, expires_at, post_id, tenant_id")
    .eq("token", token)
    .maybeSingle()

  if (!row) return { success: false, error: "not_found" }

  const actionability = isApprovalActionable({
    status: row.status as ApprovalTokenStatus,
    expires_at: row.expires_at as string,
  })
  if (!actionability.actionable) {
    return { success: false, error: actionability.reason }
  }

  const safeComment = typeof comment === "string" ? comment.trim().slice(0, 1000) : null

  // Mise à jour conditionnée sur status=pending → idempotent en cas de course.
  const { data: updatedToken, error: tokenError } = await service
    .from("approval_tokens")
    .update({
      status: decision,
      comment: safeComment || null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", row.id as string)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (tokenError || !updatedToken) {
    return { success: false, error: tokenError ? "failed" : "already_decided" }
  }

  const { error: postError } = await service
    .from("posts")
    .update({
      status: decision === "approved" ? "approved" : "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.post_id as string)

  if (postError) {
    log({
      level: "error",
      module: "approval",
      action: "decision_post_update_failed",
      tenant_id: row.tenant_id as string,
      metadata: { postId: row.post_id, decision, error: postError.message },
    })
    return { success: false, error: "failed" }
  }

  log({
    level: "info",
    module: "approval",
    action: "external_decision",
    tenant_id: row.tenant_id as string,
    metadata: { postId: row.post_id, decision, hasComment: Boolean(safeComment) },
  })

  return { success: true, decision }
}
