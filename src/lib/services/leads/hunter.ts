// ============================================================
// Hunter.io — provider d'enrichissement (Email Finder)
// ============================================================
// Trouve l'email pro à partir de (prénom + nom + entreprise/domaine).
// Tier gratuit avec accès API → idéal BYOK sans coût. La clé est INJECTÉE
// (BYOK ai_provider_keys ou env HUNTER_API_KEY), jamais lue ici directement.
//
// mapHunterData est PUR → testable sans réseau.

import type { EnrichInput, EnrichmentResult, LeadEnrichment } from "./types"

const HUNTER_EMAIL_FINDER = "https://api.hunter.io/v2/email-finder"

/** Forme partielle de la réponse Hunter Email Finder (champs consommés). */
interface HunterData {
  email?: string | null
  score?: number | null
  position?: string | null
  company?: string | null
  linkedin_url?: string | null
  industry?: string | null
  [key: string]: unknown
}

/** Découpe un nom complet en prénom / nom (best-effort). */
function splitName(input: EnrichInput): { first: string | null; last: string | null } {
  if (input.firstName || input.lastName) {
    return { first: input.firstName ?? null, last: input.lastName ?? null }
  }
  const full = (input.name ?? "").trim()
  if (!full) return { first: null, last: null }
  const parts = full.split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: null }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

/** Domaine extrait d'un email (`x@box.com` → `box.com`), sinon null. */
function domainFromEmail(email?: string | null): string | null {
  if (!email) return null
  const at = email.indexOf("@")
  return at > -1 ? email.slice(at + 1).trim().toLowerCase() || null : null
}

/** Mapping PUR d'une réponse Hunter `data` vers LeadEnrichment. */
export function mapHunterData(data: HunterData): LeadEnrichment {
  return {
    title: data.position ?? null,
    organization: data.company ?? null,
    email: data.email ?? null,
    linkedin_url: data.linkedin_url ?? null,
    industry: data.industry ?? null,
    company_size: null, // Hunter Email Finder n'expose pas la taille
    location: null, // ni la localisation
    raw: {
      email: data.email ?? null,
      score: data.score ?? null,
      position: data.position ?? null,
      company: data.company ?? null,
      linkedin_url: data.linkedin_url ?? null,
    },
  }
}

/**
 * Enrichit via Hunter Email Finder. `apiKey` injectée par le routeur (BYOK/env).
 * Dégradation propre : no_key si clé absente, not_found si critères/résultat insuffisants.
 */
export async function enrichViaHunter(
  input: EnrichInput,
  apiKey: string | undefined
): Promise<EnrichmentResult> {
  if (!apiKey) return { success: false, reason: "no_key" }

  const { first, last } = splitName(input)
  const domain = domainFromEmail(input.email)
  // Hunter exige (domain OU company) + au moins le nom de famille.
  if (!last || (!domain && !input.organization)) {
    return { success: false, reason: "not_found", message: "Critères insuffisants pour Hunter (nom + entreprise/domaine)." }
  }

  const params = new URLSearchParams({ api_key: apiKey })
  if (domain) params.set("domain", domain)
  else if (input.organization) params.set("company", input.organization)
  if (first) params.set("first_name", first)
  params.set("last_name", last)

  try {
    const res = await fetch(`${HUNTER_EMAIL_FINDER}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    })

    if (res.status === 401) return { success: false, reason: "no_key", message: "Clé Hunter invalide." }
    if (!res.ok) return { success: false, reason: "error", message: `Hunter HTTP ${res.status}` }

    const json = (await res.json()) as { data?: HunterData | null }
    if (!json.data || !json.data.email) {
      return { success: false, reason: "not_found" }
    }
    return { success: true, data: mapHunterData(json.data) }
  } catch (err) {
    return { success: false, reason: "error", message: err instanceof Error ? err.message : String(err) }
  }
}
