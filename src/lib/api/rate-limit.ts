// ============================================================
// API publique v1 — rate limiting par clé (US-051)
// Réutilise la table `rate_limits` (fail-open si absente), scopée par clé.
// Défense en profondeur : la clé elle-même reste l'authentification.
// ============================================================

import type { createServiceClient } from "@/lib/supabase/service"

type ServiceClient = ReturnType<typeof createServiceClient>

export const API_RATE_LIMIT_PER_DAY = 1000
const WINDOW_MS = 24 * 3600 * 1000

/** Vérifie le quota de requêtes (1000 / 24h / clé). Fail-open. */
export async function checkApiRateLimit(
  supabase: ServiceClient,
  keyId: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString()
    const { count, error } = await supabase
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("action", `api_v1:${keyId}`)
      .gte("created_at", windowStart)

    if (error) return { allowed: true, remaining: API_RATE_LIMIT_PER_DAY } // fail-open
    const used = count ?? 0
    return {
      allowed: used < API_RATE_LIMIT_PER_DAY,
      remaining: Math.max(0, API_RATE_LIMIT_PER_DAY - used),
    }
  } catch {
    return { allowed: true, remaining: API_RATE_LIMIT_PER_DAY } // fail-open
  }
}

/** Enregistre une requête consommée (best-effort, fail-silent). */
export async function recordApiUsage(
  supabase: ServiceClient,
  keyId: string,
  tenantId: string
): Promise<void> {
  try {
    await supabase.from("rate_limits").insert({ tenant_id: tenantId, action: `api_v1:${keyId}` })
  } catch {
    // fail-silent si la table est absente
  }
}
