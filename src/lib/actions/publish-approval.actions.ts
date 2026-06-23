"use server"

// ============================================================
// Approbation humaine pour publication (verrou — pose approved_by/at)
// Réservée à un membre authentifié ayant accès au tenant du post (RLS +
// scope explicite sur tenant_id). C'est le SEUL chemin qui déverrouille la
// publication ; la page token externe ne pose PAS cette approbation.
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

export async function approvePostForPublish(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "Aucun espace de travail trouvé" }

  // Le post doit appartenir à un tenant accessible au membre (RLS + scope explicite)
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()
  if (!post) return { success: false, error: "Post introuvable" }

  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from("posts")
    .update({ approved_by: user.id, approved_at: nowIso, updated_at: nowIso })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
  if (error) return { success: false, error: error.message }

  // Journalisation (table audit_log — pas de colonne "status")
  await supabase.from("audit_log").insert({
    tenant_id: tenantId,
    user_id: user.id,
    action: "post.human_approved",
    resource_type: "social_post",
    resource_id: postId,
  })

  return { success: true }
}
