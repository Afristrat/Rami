// ============================================================
// API publique v1 — authentification par clé Bearer (US-051 LOT 0)
// Valide `Authorization: Bearer rami_sk_…` :
//   1. forme de la clé          → 401
//   2. hash trouvé & non révoqué → sinon 401
//   3. feature api_publique      → sinon 403
//   4. rate limit                → sinon 429
// Renvoie le contexte tenant authentifié, ou une réponse d'erreur prête.
// La validation passe par le client service-role (bypass RLS) : lookup
// exclusif par key_hash unique.
// ============================================================

import type { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { hasFeatureAccess, type Plan } from "@/lib/billing/plans"
import { extractBearer, hashApiKey, isApiKeyShape, hasScopes, type ApiScope } from "@/lib/services/api-keys/keys"
import { checkApiRateLimit, recordApiUsage } from "@/lib/api/rate-limit"
import { apiError } from "@/lib/api/respond"

export interface ApiAuthContext {
  tenantId: string
  plan: Plan
  scopes: string[]
  keyId: string
}

export type ApiAuthResult =
  | { ok: true; ctx: ApiAuthContext }
  | { ok: false; response: NextResponse }

/**
 * Authentifie une requête API v1. À appeler en tête de chaque route /api/v1/*.
 * En cas de succès, enregistre l'usage (rate limit) et met à jour last_used_at.
 */
export async function authenticateApiRequest(request: NextRequest): Promise<ApiAuthResult> {
  const raw = extractBearer(request.headers.get("authorization"))
  if (!raw || !isApiKeyShape(raw)) {
    return { ok: false, response: apiError(401, "Clé API manquante ou invalide.") }
  }

  const supabase = createServiceClient()
  const hash = hashApiKey(raw)

  const { data: keyRow, error: keyErr } = await supabase
    .from("api_keys")
    .select("id, tenant_id, scopes, revoked_at")
    .eq("key_hash", hash)
    .is("revoked_at", null)
    .maybeSingle<{ id: string; tenant_id: string; scopes: string[] | null; revoked_at: string | null }>()

  if (keyErr || !keyRow) {
    return { ok: false, response: apiError(401, "Clé API inconnue ou révoquée.") }
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("plan")
    .eq("id", keyRow.tenant_id)
    .single<{ plan: Plan }>()

  if (!tenant) {
    return { ok: false, response: apiError(403, "Tenant introuvable.") }
  }

  if (!hasFeatureAccess(tenant.plan, "api_publique")) {
    return {
      ok: false,
      response: apiError(403, "Le plan de ce tenant ne donne pas accès à l'API publique."),
    }
  }

  const rate = await checkApiRateLimit(supabase, keyRow.id)
  if (!rate.allowed) {
    return { ok: false, response: apiError(429, "Limite de requêtes dépassée (1000 / 24h).") }
  }

  // Best-effort : usage + dernière utilisation (n'échoue jamais la requête).
  await recordApiUsage(supabase, keyRow.id, keyRow.tenant_id)
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)

  return {
    ok: true,
    ctx: {
      tenantId: keyRow.tenant_id,
      plan: tenant.plan,
      scopes: keyRow.scopes ?? [],
      keyId: keyRow.id,
    },
  }
}

/**
 * Vérifie que le contexte authentifié possède les scopes requis.
 * Renvoie une réponse 403 prête si un scope manque, sinon null.
 */
export function requireScopes(ctx: ApiAuthContext, required: ApiScope[]): NextResponse | null {
  if (hasScopes(ctx.scopes, required)) return null
  return apiError(403, `Scope(s) requis manquant(s) : ${required.join(", ")}.`)
}
