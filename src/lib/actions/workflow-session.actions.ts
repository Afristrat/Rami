"use server"

// ============================================================
// Persistance du workflow « Créer un post » — autosave + reprise
//
// L'état du wizard est sauvegardé en DB (table content_sessions, RLS
// tenant) à chaque transition d'étape, et proposé à la reprise au
// montage. Un seul brouillon actif par utilisateur : l'autosave upsert
// la session courante ; terminer le workflow (post final créé) la passe
// en « completed », la refuser la passe en « abandoned ».
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { parseWorkflowStateEnvelope } from "@/lib/services/workflow/session-state"
import { log } from "@/lib/utils/logger"
import type { WorkflowState } from "@/lib/schemas/workflow.schema"

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function getSessionContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return null
  return { supabase, userId: user.id, tenantId }
}

// ── Autosave (upsert) ────────────────────────────────────────────────────────

export type SaveWorkflowSessionResult =
  | { success: true; sessionId: string }
  | { success: false; error: "unauthenticated" | "invalid_state" | "failed" }

export async function saveWorkflowSessionAction(input: {
  sessionId?: string | null
  state: WorkflowState
}): Promise<SaveWorkflowSessionResult> {
  const ctx = await getSessionContext()
  if (!ctx) return { success: false, error: "unauthenticated" }

  const envelope = parseWorkflowStateEnvelope(input.state)
  if (!envelope.valid) return { success: false, error: "invalid_state" }

  const payload = {
    title: envelope.title,
    current_step: envelope.currentStep,
    state: envelope.state,
    updated_at: new Date().toISOString(),
  }

  if (input.sessionId && UUID_RE.test(input.sessionId)) {
    const { data: updated, error } = await ctx.supabase
      .from("content_sessions")
      .update(payload)
      .eq("id", input.sessionId)
      .eq("created_by", ctx.userId)
      .eq("status", "active")
      .select("id")
      .maybeSingle()
    if (!error && updated) return { success: true, sessionId: updated.id as string }
    // Session disparue/clôturée entre-temps → on retombe sur une création.
  }

  const { data: created, error: insertError } = await ctx.supabase
    .from("content_sessions")
    .insert({
      tenant_id: ctx.tenantId,
      created_by: ctx.userId,
      status: "active",
      ...payload,
    })
    .select("id")
    .single()

  if (insertError || !created) {
    log({
      level: "error",
      module: "workflow",
      action: "session_save_failed",
      tenant_id: ctx.tenantId,
      metadata: { error: insertError?.message },
    })
    return { success: false, error: "failed" }
  }
  return { success: true, sessionId: created.id as string }
}

// ── Reprise ──────────────────────────────────────────────────────────────────

export type LoadWorkflowSessionResult =
  | { found: true; sessionId: string; state: WorkflowState; title: string | null; currentStep: number; updatedAt: string }
  | { found: false }

/** Charge la dernière session active de l'utilisateur courant (reprise au montage). */
export async function loadLatestWorkflowSessionAction(): Promise<LoadWorkflowSessionResult> {
  const ctx = await getSessionContext()
  if (!ctx) return { found: false }

  const { data: row } = await ctx.supabase
    .from("content_sessions")
    .select("id, state, title, current_step, updated_at")
    .eq("created_by", ctx.userId)
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!row) return { found: false }

  // L'état relu de la DB est re-validé : une enveloppe corrompue n'est jamais proposée.
  const envelope = parseWorkflowStateEnvelope(row.state)
  if (!envelope.valid) return { found: false }

  return {
    found: true,
    sessionId: row.id as string,
    state: envelope.state,
    title: envelope.title,
    currentStep: envelope.currentStep,
    updatedAt: row.updated_at as string,
  }
}

// ── Clôture ──────────────────────────────────────────────────────────────────

export async function closeWorkflowSessionAction(
  sessionId: string,
  outcome: "completed" | "abandoned"
): Promise<{ success: boolean }> {
  if (!UUID_RE.test(sessionId) || (outcome !== "completed" && outcome !== "abandoned")) {
    return { success: false }
  }
  const ctx = await getSessionContext()
  if (!ctx) return { success: false }

  const { error } = await ctx.supabase
    .from("content_sessions")
    .update({ status: outcome, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("created_by", ctx.userId)
    .eq("status", "active")

  return { success: !error }
}
