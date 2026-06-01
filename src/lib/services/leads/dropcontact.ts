// ============================================================
// Dropcontact 🇫🇷 — provider d'enrichissement (100 % RGPD, serveurs UE)
// ============================================================
// Enrichissement email + données B2B avec garantie RGPD (audité CNIL). API ASYNCHRONE :
// 1) POST /v1/enrich/all (soumet un batch) → request_id
// 2) GET /v1/enrich/all/{request_id} (poll jusqu'à ce que le résultat soit prêt)
// La clé est INJECTÉE (BYOK ai_provider_keys ou env DROPCONTACT_API_KEY).
//
// Contrat vérifié (2026-06-01, developer.dropcontact.com) :
//   auth : header `X-Access-Token`.
//   POST réponse : { error, request_id, success, credits_left }
//   GET prêt : { data: [{ email: [{email, qualification}], job, company, industry,
//                nb_employees, country, linkedin, ... }], success: true }
//   GET en cours : { success: false, reason: "Request not ready yet, try again in 30 seconds" }
//
// mapDropcontactContact est PUR → testable sans réseau.

import type { EnrichInput, EnrichmentResult, LeadEnrichment } from "./types"

const DROPCONTACT_BASE = "https://api.dropcontact.com/v1/enrich/all"

/** Forme partielle d'un contact Dropcontact (champs consommés). */
interface DropcontactEmail {
  email?: string | null
  qualification?: string | null
}
interface DropcontactContact {
  email?: DropcontactEmail[] | null
  job?: string | null
  company?: string | null
  industry?: string | null
  nb_employees?: string | null
  employee_count?: string | null
  country?: string | null
  linkedin?: string | null
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

/** Premier email qualifié d'un contact Dropcontact, sinon null. */
function firstEmail(contact: DropcontactContact): string | null {
  if (!Array.isArray(contact.email) || contact.email.length === 0) return null
  const valid = contact.email.find((e) => e && typeof e.email === "string" && e.email.length > 0)
  return valid?.email ?? null
}

/** Mapping PUR d'un contact Dropcontact vers LeadEnrichment. */
export function mapDropcontactContact(contact: DropcontactContact): LeadEnrichment {
  const size = contact.nb_employees ?? contact.employee_count ?? null
  return {
    title: contact.job ?? null,
    organization: contact.company ?? null,
    email: firstEmail(contact),
    linkedin_url: contact.linkedin ?? null,
    industry: contact.industry ?? null,
    company_size: size,
    location: contact.country ?? null,
    raw: {
      job: contact.job ?? null,
      company: contact.company ?? null,
      industry: contact.industry ?? null,
      nb_employees: size,
      country: contact.country ?? null,
      linkedin: contact.linkedin ?? null,
      email: firstEmail(contact),
    },
  }
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

/** Options de polling (injectables pour les tests → pas d'attente réelle). */
export interface DropcontactPollOptions {
  maxPolls?: number
  pollDelayMs?: number
}

/**
 * Enrichit via Dropcontact (asynchrone). `apiKey` injectée par le routeur (BYOK/env).
 * Soumet le batch puis poll le résultat. Dégradation propre :
 * no_key si clé absente/invalide, not_found si critères/résultat insuffisants, error sinon.
 */
export async function enrichViaDropcontact(
  input: EnrichInput,
  apiKey: string | undefined,
  options: DropcontactPollOptions = {}
): Promise<EnrichmentResult> {
  if (!apiKey) return { success: false, reason: "no_key" }

  const { first, last } = splitName(input)
  // Dropcontact exige : (prénom+nom+entreprise) | (nom complet+entreprise) | linkedin | email.
  const hasIdentifier =
    Boolean(input.email) ||
    Boolean(input.linkedinUrl) ||
    (Boolean(input.name ?? (first && last)) && Boolean(input.organization))
  if (!hasIdentifier) {
    return {
      success: false,
      reason: "not_found",
      message: "Critères insuffisants pour Dropcontact (nom + entreprise, linkedin, ou email).",
    }
  }

  const contact: Record<string, string> = {}
  if (first) contact.first_name = first
  if (last) contact.last_name = last
  if (input.name && !first && !last) contact.full_name = input.name
  if (input.organization) contact.company = input.organization
  if (input.email) contact.email = input.email
  if (input.linkedinUrl) contact.linkedin = input.linkedinUrl

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Access-Token": apiKey,
  }

  try {
    // 1) Soumission du batch
    const submit = await fetch(DROPCONTACT_BASE, {
      method: "POST",
      headers,
      body: JSON.stringify({ data: [contact], siren: false, language: "fr" }),
      signal: AbortSignal.timeout(15_000),
    })

    if (submit.status === 401 || submit.status === 403) {
      return { success: false, reason: "no_key", message: "Clé Dropcontact invalide." }
    }
    if (!submit.ok) return { success: false, reason: "error", message: `Dropcontact HTTP ${submit.status}` }

    const submitJson = (await submit.json()) as { request_id?: string; success?: boolean; error?: boolean }
    if (!submitJson.request_id) {
      return { success: false, reason: "error", message: "Dropcontact : request_id absent." }
    }

    // 2) Polling du résultat
    const maxPolls = options.maxPolls ?? 8
    const pollDelayMs = options.pollDelayMs ?? 3_000
    const pollUrl = `${DROPCONTACT_BASE}/${encodeURIComponent(submitJson.request_id)}`

    for (let attempt = 0; attempt < maxPolls; attempt++) {
      if (attempt > 0) await sleep(pollDelayMs)
      const poll = await fetch(pollUrl, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(15_000),
      })
      if (!poll.ok) {
        return { success: false, reason: "error", message: `Dropcontact poll HTTP ${poll.status}` }
      }
      const pollJson = (await poll.json()) as {
        success?: boolean
        data?: DropcontactContact[] | null
        reason?: string
      }
      if (pollJson.success && Array.isArray(pollJson.data) && pollJson.data.length > 0) {
        const enrichment = mapDropcontactContact(pollJson.data[0])
        // Aucun email ni entreprise enrichis → considérer comme non trouvé.
        if (!enrichment.email && !enrichment.organization && !enrichment.title) {
          return { success: false, reason: "not_found" }
        }
        return { success: true, data: enrichment }
      }
      // success:false + reason "not ready" → continuer à poller.
    }

    return {
      success: false,
      reason: "error",
      message: "Dropcontact : résultat non prêt après plusieurs tentatives.",
    }
  } catch (err) {
    return { success: false, reason: "error", message: err instanceof Error ? err.message : String(err) }
  }
}
