// ============================================================
// Enrichissement de leads — routeur multi-provider + BYOK
// ============================================================
// Sélectionne le provider actif et résout sa clé (BYOK ai_provider_keys chiffrée
// → fallback variable d'environnement), puis délègue au provider.
// Additif : le provider Apollo (apollo.ts) reste inchangé (clé via env).

import { createServiceClient } from "@/lib/supabase/service"
import { decryptToken } from "@/lib/services/oauth/state"
import { enrichViaApollo } from "./apollo"
import { enrichViaHunter } from "./hunter"
import type { EnrichInput, EnrichmentResult, EnrichmentProviderId } from "./types"

/** Variable d'environnement de fallback par provider. */
const ENV_KEY: Record<EnrichmentProviderId, string> = {
  apollo: "APOLLO_API_KEY",
  hunter: "HUNTER_API_KEY",
}

/** Provider actif (env `LEADS_ENRICHMENT_PROVIDER`), défaut `apollo` (rétro-compat). */
export function getActiveEnrichmentProvider(): EnrichmentProviderId {
  const v = (process.env.LEADS_ENRICHMENT_PROVIDER ?? "").toLowerCase()
  return v === "hunter" ? "hunter" : "apollo"
}

/**
 * Résout la clé d'un provider : BYOK chiffrée en DB (ai_provider_keys,
 * category='enrichment') si présente, sinon variable d'environnement.
 * Ne lève jamais : renvoie undefined si aucune clé n'est disponible.
 */
export async function resolveEnrichmentKey(
  provider: EnrichmentProviderId
): Promise<string | undefined> {
  const envFallback = process.env[ENV_KEY[provider]] || undefined
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from("ai_provider_keys")
      .select("api_key_encrypted, is_active")
      .eq("provider", provider)
      .eq("category", "enrichment")
      .maybeSingle()

    if (data?.is_active && data.api_key_encrypted) {
      try {
        return decryptToken(data.api_key_encrypted as string)
      } catch {
        return envFallback
      }
    }
    return envFallback
  } catch {
    // DB indisponible → fallback env (jamais de crash)
    return envFallback
  }
}

/**
 * Enrichit un lead via le provider actif (BYOK).
 * Apollo : clé via env (provider inchangé). Hunter : clé injectée (BYOK/env).
 */
export async function enrichLead(input: EnrichInput): Promise<EnrichmentResult> {
  const provider = getActiveEnrichmentProvider()

  if (provider === "hunter") {
    const key = await resolveEnrichmentKey("hunter")
    return enrichViaHunter(input, key)
  }

  // apollo (défaut) — apollo.ts lit APOLLO_API_KEY via l'environnement.
  const result = await enrichViaApollo({
    name: input.name,
    email: input.email,
    organization: input.organization,
    linkedinUrl: input.linkedinUrl,
  })
  return result
}
