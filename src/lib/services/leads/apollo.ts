// ============================================================
// Apollo.io — Enrichissement de leads (US-027)
// ============================================================
// Appelle l'API Apollo People Match (POST /api/v1/people/match) pour enrichir
// un contact (titre, entreprise, email, secteur, taille, localisation).
//
// Le mapping de la réponse (`mapApolloPerson`) est PUR → testable sans réseau.
// `enrichViaApollo` gère gracieusement l'absence de clé et les échecs réseau.

const APOLLO_MATCH_ENDPOINT = "https://api.apollo.io/api/v1/people/match"

/** Données normalisées issues d'Apollo, stockées dans `leads.apollo_data`. */
export interface ApolloEnrichment {
  title: string | null
  organization: string | null
  email: string | null
  linkedin_url: string | null
  industry: string | null
  company_size: string | null
  location: string | null
  /** Sous-ensemble brut de la réponse Apollo (traçabilité, jamais d'emails personnels révélés). */
  raw: Record<string, unknown>
}

/** Forme partielle d'un objet `person` Apollo (champs réellement consommés). */
interface ApolloOrganization {
  name?: string | null
  industry?: string | null
  estimated_num_employees?: number | null
  website_url?: string | null
}
interface ApolloPerson {
  title?: string | null
  headline?: string | null
  email?: string | null
  linkedin_url?: string | null
  organization_name?: string | null
  organization?: ApolloOrganization | null
  city?: string | null
  state?: string | null
  country?: string | null
  [key: string]: unknown
}

export type ApolloResult =
  | { success: true; data: ApolloEnrichment }
  | { success: false; reason: "no_key" | "not_found" | "error"; message?: string }

/** Entrée d'enrichissement (au moins l'un des champs doit être renseigné). */
export interface ApolloMatchInput {
  name?: string | null
  email?: string | null
  organization?: string | null
  linkedinUrl?: string | null
}

/** Concatène ville/région/pays en une localisation lisible. */
function joinLocation(person: ApolloPerson): string | null {
  const parts = [person.city, person.state, person.country].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0
  )
  return parts.length > 0 ? parts.join(", ") : null
}

/** Mapping PUR d'un `person` Apollo vers ApolloEnrichment. */
export function mapApolloPerson(person: ApolloPerson): ApolloEnrichment {
  const org = person.organization ?? null
  const size =
    org && typeof org.estimated_num_employees === "number"
      ? String(org.estimated_num_employees)
      : null
  return {
    title: person.title ?? person.headline ?? null,
    organization: org?.name ?? person.organization_name ?? null,
    email: person.email ?? null,
    linkedin_url: person.linkedin_url ?? null,
    industry: org?.industry ?? null,
    company_size: size,
    location: joinLocation(person),
    raw: {
      title: person.title ?? null,
      headline: person.headline ?? null,
      email: person.email ?? null,
      linkedin_url: person.linkedin_url ?? null,
      organization: org
        ? {
            name: org.name ?? null,
            industry: org.industry ?? null,
            estimated_num_employees: org.estimated_num_employees ?? null,
            website_url: org.website_url ?? null,
          }
        : null,
      city: person.city ?? null,
      state: person.state ?? null,
      country: person.country ?? null,
    },
  }
}

/**
 * Enrichit un contact via Apollo People Match.
 * Renvoie `reason:"no_key"` si APOLLO_API_KEY absente (dégradation propre, pas d'erreur).
 */
export async function enrichViaApollo(input: ApolloMatchInput): Promise<ApolloResult> {
  const apiKey = process.env.APOLLO_API_KEY
  if (!apiKey) {
    return { success: false, reason: "no_key" }
  }

  const body: Record<string, string> = {}
  if (input.name) body.name = input.name
  if (input.email) body.email = input.email
  if (input.organization) body.organization_name = input.organization
  if (input.linkedinUrl) body.linkedin_url = input.linkedinUrl

  if (Object.keys(body).length === 0) {
    return { success: false, reason: "not_found", message: "Aucun critère de recherche." }
  }

  try {
    const res = await fetch(APOLLO_MATCH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      return { success: false, reason: "error", message: `Apollo HTTP ${res.status}` }
    }

    const json = (await res.json()) as { person?: ApolloPerson | null }
    if (!json.person) {
      return { success: false, reason: "not_found" }
    }

    return { success: true, data: mapApolloPerson(json.person) }
  } catch (err) {
    return {
      success: false,
      reason: "error",
      message: err instanceof Error ? err.message : String(err),
    }
  }
}
