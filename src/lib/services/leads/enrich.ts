// ============================================================
// Enrich.so — provider d'enrichissement (Person Enrichment, API-first)
// ============================================================
// Enrichit un contact à partir d'un email (ou autres identifiants). 100 crédits gratuits.
// La clé est INJECTÉE (BYOK ai_provider_keys ou env ENRICH_API_KEY).
//
// Contrat vérifié (2026-06-01, docs.enrich.so) :
//   GET https://api.enrich.so/v1/api/person?email={email}
//   auth : header `Authorization: Bearer {CLE}`.
//   ⚠️ La forme EXACTE de la réponse n'est pas publiée publiquement → le mapping est
//   DÉFENSIF : il accepte plusieurs variantes de noms de champs et la réponse peut être
//   à la racine OU sous `data`/`result`. Tout champ absent → null (jamais inventé, DÉFCON 1).
//
// mapEnrichData est PUR → testable sans réseau.

import type { EnrichInput, EnrichmentResult, LeadEnrichment } from "./types"

const ENRICH_PERSON_ENDPOINT = "https://api.enrich.so/v1/api/person"

/** Réponse Enrich.so (champs tolérés ; variantes multiples car shape non figée publiquement). */
interface EnrichData {
  email?: string | null
  work_email?: string | null
  name?: string | null
  full_name?: string | null
  title?: string | null
  job_title?: string | null
  headline?: string | null
  company?: string | null
  company_name?: string | null
  organization?: string | null
  linkedin_url?: string | null
  linkedin?: string | null
  industry?: string | null
  company_size?: string | null
  location?: string | null
  location_name?: string | null
  [key: string]: unknown
}

/** Première valeur string non vide parmi les candidates, sinon null. */
function firstString(...candidates: Array<unknown>): string | null {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length > 0) return c
  }
  return null
}

/** Mapping PUR et DÉFENSIF d'une réponse Enrich.so vers LeadEnrichment. */
export function mapEnrichData(data: EnrichData): LeadEnrichment {
  return {
    title: firstString(data.title, data.job_title, data.headline),
    organization: firstString(data.company, data.company_name, data.organization),
    email: firstString(data.email, data.work_email),
    linkedin_url: firstString(data.linkedin_url, data.linkedin),
    industry: firstString(data.industry),
    company_size: firstString(data.company_size),
    location: firstString(data.location, data.location_name),
    raw: {
      email: firstString(data.email, data.work_email),
      name: firstString(data.name, data.full_name),
      title: firstString(data.title, data.job_title, data.headline),
      company: firstString(data.company, data.company_name, data.organization),
      linkedin_url: firstString(data.linkedin_url, data.linkedin),
      industry: firstString(data.industry),
      location: firstString(data.location, data.location_name),
    },
  }
}

/** Extrait le bloc de données utile, que la réponse soit à la racine ou imbriquée. */
function unwrap(json: Record<string, unknown>): EnrichData | null {
  if (json && typeof json === "object") {
    const nested =
      (json.data as EnrichData | undefined) ?? (json.result as EnrichData | undefined)
    if (nested && typeof nested === "object") return nested
    // Sinon la réponse elle-même porte les champs.
    if ("email" in json || "name" in json || "full_name" in json || "company" in json) {
      return json as EnrichData
    }
  }
  return null
}

/**
 * Enrichit via Enrich.so Person Enrichment. `apiKey` injectée par le routeur (BYOK/env).
 * Exige au moins un email (identifiant principal du endpoint). Dégradation propre.
 */
export async function enrichViaEnrich(
  input: EnrichInput,
  apiKey: string | undefined
): Promise<EnrichmentResult> {
  if (!apiKey) return { success: false, reason: "no_key" }

  // Le endpoint person d'Enrich.so s'appuie principalement sur l'email.
  if (!input.email) {
    return {
      success: false,
      reason: "not_found",
      message: "Critère insuffisant pour Enrich.so (email requis).",
    }
  }

  const params = new URLSearchParams({ email: input.email })

  try {
    const res = await fetch(`${ENRICH_PERSON_ENDPOINT}?${params.toString()}`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    })

    if (res.status === 401 || res.status === 403) {
      return { success: false, reason: "no_key", message: "Clé Enrich.so invalide." }
    }
    if (res.status === 404) return { success: false, reason: "not_found" }
    if (!res.ok) return { success: false, reason: "error", message: `Enrich.so HTTP ${res.status}` }

    const json = (await res.json()) as Record<string, unknown>
    const data = unwrap(json)
    if (!data) return { success: false, reason: "not_found" }

    const enrichment = mapEnrichData(data)
    if (!enrichment.email && !enrichment.organization && !enrichment.title) {
      return { success: false, reason: "not_found" }
    }
    return { success: true, data: enrichment }
  } catch (err) {
    return { success: false, reason: "error", message: err instanceof Error ? err.message : String(err) }
  }
}
