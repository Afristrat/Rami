// ============================================================
// Enrichissement de leads — types partagés (abstraction multi-provider)
// ============================================================

/** Données d'enrichissement normalisées (commun à tous les providers). */
export interface LeadEnrichment {
  title: string | null
  organization: string | null
  email: string | null
  linkedin_url: string | null
  industry: string | null
  company_size: string | null
  location: string | null
  /** Sous-ensemble brut de la réponse provider (traçabilité). */
  raw: Record<string, unknown>
}

export type EnrichmentResult =
  | { success: true; data: LeadEnrichment }
  | { success: false; reason: "no_key" | "not_found" | "error"; message?: string }

/** Entrée d'enrichissement (au moins un champ renseigné). */
export interface EnrichInput {
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  organization?: string | null
  linkedinUrl?: string | null
}

/** Providers d'enrichissement supportés (cf. ai_provider_keys category='enrichment'). */
export type EnrichmentProviderId = "apollo" | "hunter"
