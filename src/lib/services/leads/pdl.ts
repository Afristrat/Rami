// ============================================================
// People Data Labs (PDL) — provider d'enrichissement (Person Enrichment)
// ============================================================
// Enrichit un contact à partir de (prénom + nom + entreprise) ou d'un profil/email.
// Tier gratuit avec crédits → adapté BYOK. La clé est INJECTÉE (BYOK ai_provider_keys
// ou env PDL_API_KEY), jamais lue ici directement.
//
// Endpoint vérifié (2026-06-01, docs.peopledatalabs.com/docs/reference-person-enrichment-api) :
//   GET https://api.peopledatalabs.com/v5/person/enrich
//   auth : header `X-Api-Key` ; status 200 = match, 404 = aucune correspondance, 401 = clé invalide.
//   réponse : { status, likelihood, data: { full_name, job_title, job_company_name,
//               work_email, linkedin_url, job_company_industry, job_company_size, location_name } }
//
// mapPdlData est PUR → testable sans réseau.

import type { EnrichInput, EnrichmentResult, LeadEnrichment } from "./types"

const PDL_ENRICH_ENDPOINT = "https://api.peopledatalabs.com/v5/person/enrich"

/** Forme partielle de la réponse PDL `data` (champs consommés). */
interface PdlData {
  full_name?: string | null
  job_title?: string | null
  job_company_name?: string | null
  work_email?: string | null
  personal_emails?: string[] | null
  linkedin_url?: string | null
  job_company_industry?: string | null
  job_company_size?: string | null
  location_name?: string | null
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

/** Mapping PUR d'une réponse PDL `data` vers LeadEnrichment. */
export function mapPdlData(data: PdlData): LeadEnrichment {
  const email =
    data.work_email ??
    (Array.isArray(data.personal_emails) && data.personal_emails.length > 0
      ? data.personal_emails[0]
      : null)
  return {
    title: data.job_title ?? null,
    organization: data.job_company_name ?? null,
    email: email ?? null,
    linkedin_url: data.linkedin_url ?? null,
    industry: data.job_company_industry ?? null,
    company_size: data.job_company_size ?? null,
    location: data.location_name ?? null,
    raw: {
      full_name: data.full_name ?? null,
      job_title: data.job_title ?? null,
      job_company_name: data.job_company_name ?? null,
      work_email: data.work_email ?? null,
      linkedin_url: data.linkedin_url ?? null,
      job_company_industry: data.job_company_industry ?? null,
      job_company_size: data.job_company_size ?? null,
      location_name: data.location_name ?? null,
    },
  }
}

/**
 * Enrichit via PDL Person Enrichment. `apiKey` injectée par le routeur (BYOK/env).
 * Dégradation propre : no_key si clé absente, not_found si critères/résultat insuffisants.
 */
export async function enrichViaPdl(
  input: EnrichInput,
  apiKey: string | undefined
): Promise<EnrichmentResult> {
  if (!apiKey) return { success: false, reason: "no_key" }

  const { first, last } = splitName(input)
  const params = new URLSearchParams()
  // Critères acceptés par PDL : profil LinkedIn, email, OU (prénom+nom)+entreprise.
  if (input.linkedinUrl) params.set("profile", input.linkedinUrl)
  if (input.email) params.set("email", input.email)
  if (first) params.set("first_name", first)
  if (last) params.set("last_name", last)
  if (input.organization) params.set("company", input.organization)

  const hasIdentifier =
    Boolean(input.linkedinUrl) ||
    Boolean(input.email) ||
    (Boolean(first) && Boolean(last) && Boolean(input.organization))
  if (!hasIdentifier) {
    return {
      success: false,
      reason: "not_found",
      message: "Critères insuffisants pour PDL (profil, email, ou nom complet + entreprise).",
    }
  }

  try {
    const res = await fetch(`${PDL_ENRICH_ENDPOINT}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json", "X-Api-Key": apiKey },
      signal: AbortSignal.timeout(15_000),
    })

    if (res.status === 401) return { success: false, reason: "no_key", message: "Clé PDL invalide." }
    if (res.status === 404) return { success: false, reason: "not_found" }
    if (!res.ok) return { success: false, reason: "error", message: `PDL HTTP ${res.status}` }

    const json = (await res.json()) as { status?: number; data?: PdlData | null }
    if (!json.data) {
      return { success: false, reason: "not_found" }
    }
    return { success: true, data: mapPdlData(json.data) }
  } catch (err) {
    return { success: false, reason: "error", message: err instanceof Error ? err.message : String(err) }
  }
}
