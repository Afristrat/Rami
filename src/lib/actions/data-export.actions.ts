"use server"

// ============================================================
// Export RGPD / CNDP — portabilité des données (Art. 20 RGPD, loi 09-08)
// Rassemble les données du tenant courant en JSON structuré.
// ⚠️ N'inclut JAMAIS de secret (tokens OAuth chiffrés exclus).
// ============================================================

import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

export interface DataExportResult {
  success: boolean
  data?: Record<string, unknown>
  error?: string
}

export async function exportMyDataAction(): Promise<DataExportResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "unauthenticated" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "no_tenant" }

  const [profile, tenant, posts, leads, documents, transcriptions, connections] = await Promise.all([
    supabase
      .from("users")
      .select("id, email, full_name, role, onboarding_completed, created_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tenants")
      .select("id, name, slug, plan, brand_dna, created_at")
      .eq("id", tenantId)
      .single(),
    supabase
      .from("posts")
      .select("id, title, content, platforms, status, scheduled_at, published_at, created_at")
      .eq("tenant_id", tenantId),
    supabase.from("leads").select("*").eq("tenant_id", tenantId),
    supabase
      .from("documents")
      .select("id, type, title, client_name, status, content_json, created_at")
      .eq("tenant_id", tenantId),
    supabase
      .from("transcriptions")
      .select("id, title, language, status, transcript_text, ai_summary, ai_actions, created_at")
      .eq("tenant_id", tenantId),
    // Connexions sociales : métadonnées uniquement, JAMAIS les tokens chiffrés.
    supabase
      .from("oauth_connections")
      .select("id, platform, account_name, account_id, is_active, created_at")
      .eq("tenant_id", tenantId),
  ])

  return {
    success: true,
    data: {
      export_metadata: {
        generated_for: user.email,
        tenant_id: tenantId,
        format: "RAMI data export — portabilité RGPD/CNDP",
        note: "Les tokens d'accès aux réseaux sociaux sont volontairement exclus pour des raisons de sécurité.",
        version: 1,
      },
      profile: profile.data ?? null,
      tenant: tenant.data ?? null,
      posts: posts.data ?? [],
      leads: leads.data ?? [],
      documents: documents.data ?? [],
      transcriptions: transcriptions.data ?? [],
      social_connections: connections.data ?? [],
    },
  }
}
