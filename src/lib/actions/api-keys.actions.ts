"use server"

// ============================================================
// API publique v1 — gestion des clés (US-051 LOT 0)
// Créer / lister / révoquer les clés API du tenant courant (session dashboard).
// La clé en clair n'est renvoyée QU'UNE fois (à la création) ; ensuite seul le
// prefix est visible. Gaté par la feature `api_publique` (Agency+/Enterprise).
// ============================================================

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { hasFeatureAccess, type Plan } from "@/lib/billing/plans"
import { generateApiKey, API_SCOPES, type ApiScope } from "@/lib/services/api-keys/keys"
import { log } from "@/lib/utils/logger"

export type CreateApiKeyResult =
  | { success: true; id: string; rawKey: string; prefix: string }
  | { success: false; error: string }

export interface ApiKeyListItem {
  id: string
  name: string
  key_prefix: string
  scopes: string[]
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

/**
 * Crée une nouvelle clé API pour le tenant courant.
 * Renvoie la clé EN CLAIR une seule fois — elle n'est jamais re-affichable.
 */
export async function createApiKeyAction(input: {
  name: string
  scopes: ApiScope[]
}): Promise<CreateApiKeyResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "Aucun espace de travail trouvé" }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", tenantId)
    .single<{ plan: Plan }>()

  if (!tenant || !hasFeatureAccess(tenant.plan, "api_publique")) {
    return { success: false, error: "L'API publique nécessite un plan Agency+ ou Enterprise." }
  }

  const name = input.name.trim().slice(0, 100)
  if (!name) return { success: false, error: "Nom requis." }

  const scopes = input.scopes.filter((s) => (API_SCOPES as readonly string[]).includes(s))
  if (scopes.length === 0) return { success: false, error: "Au moins un scope est requis." }

  const key = generateApiKey()
  const { data: inserted, error } = await supabase
    .from("api_keys")
    .insert({
      tenant_id: tenantId,
      name,
      key_prefix: key.prefix,
      key_hash: key.hash,
      scopes,
      created_by: user.id,
    })
    .select("id")
    .single<{ id: string }>()

  if (error || !inserted) {
    log({
      level: "error",
      module: "api_keys",
      action: "create_failed",
      tenant_id: tenantId,
      metadata: { error: error?.message },
    })
    return { success: false, error: "Échec de la création de la clé." }
  }

  log({
    level: "info",
    module: "api_keys",
    action: "created",
    tenant_id: tenantId,
    metadata: { keyId: inserted.id, scopes },
  })

  revalidatePath("/settings/api")
  return { success: true, id: inserted.id, rawKey: key.raw, prefix: key.prefix }
}

/** Liste les clés du tenant courant (sans hash ni clé en clair). */
export async function listApiKeysAction(): Promise<{
  success: boolean
  keys: ApiKeyListItem[]
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, keys: [], error: "Non authentifié" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, keys: [], error: "Aucun espace de travail trouvé" }

  const { data } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, scopes, last_used_at, revoked_at, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })

  return { success: true, keys: (data ?? []) as ApiKeyListItem[] }
}

/** Révoque (désactive définitivement) une clé du tenant courant. */
export async function revokeApiKeyAction(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { success: false, error: "Aucun espace de travail trouvé" }

  const { error } = await supabase
    .from("api_keys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .is("revoked_at", null)

  if (error) return { success: false, error: "Échec de la révocation." }

  log({ level: "info", module: "api_keys", action: "revoked", tenant_id: tenantId, metadata: { keyId: id } })
  revalidatePath("/settings/api")
  return { success: true }
}
