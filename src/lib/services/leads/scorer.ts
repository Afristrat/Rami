// ============================================================
// Scoring Brand DNA match d'un lead (US-028)
// ============================================================
// Évalue dans quelle mesure un lead (prospect) correspond au client idéal du tenant
// décrit par son Brand DNA, sur 3 axes : audience, secteur, culture/marché.
//
// Stratégie : un raffinement LLM (deepseek via proxy) produit les 3 scores, avec un
// repli HEURISTIQUE PUR et déterministe si le LLM échoue ou renvoie un JSON invalide.
// Toutes les fonctions de ce module sont PURES → testables sans réseau (DÉFCON 1 :
// aucun score fabriqué — le repli est explicable, et un secteur/culture absent reste
// neutre plutôt qu'inventé).

/** Sous-ensemble du Brand DNA (shape PLATE réelle) utilisé pour le scoring. */
export interface LeadScoringBrandDna {
  brandName?: string | null
  sector?: string | null
  positioning?: string | null
  primaryCulture?: string | null
  audienceDescription?: string | null
  audienceLocation?: string | null
  audiencePainPoints?: string | null
}

/** Attributs d'un lead pertinents pour le scoring. */
export interface LeadScoringInput {
  company_name: string
  contact_name?: string | null
  sector?: string | null
  company_size?: string | null
  location?: string | null
  /** Secteur enrichi (apollo_data.industry) si disponible. */
  industry?: string | null
}

/** Résultat du scoring : 3 axes 0-100 + score global 0-100. */
export interface LeadScore {
  audience: number
  sector: number
  culture: number
  overall: number
}

/** Borne un nombre dans [0,100] et l'arrondit ; valeur non finie → fallback. */
function clamp0100(n: unknown, fallback = 0): number {
  const v = typeof n === "number" && Number.isFinite(n) ? n : fallback
  return Math.max(0, Math.min(100, Math.round(v)))
}

/**
 * Score global pondéré : secteur et audience priment (0.35 chacun), culture complète
 * (0.30). Pondérations choisies pour refléter le « fit commercial » d'un lead.
 */
export function computeOverall(parts: { audience: number; sector: number; culture: number }): number {
  return clamp0100(0.35 * parts.audience + 0.35 * parts.sector + 0.3 * parts.culture)
}

/** Normalise une chaîne pour comparaison (minuscule, sans accents, sans ponctuation). */
function norm(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Score de similarité textuelle simple : exact=90, inclusion=60, mot commun=45, sinon 30. */
function textMatch(a: string | null | undefined, b: string | null | undefined): number | null {
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return null
  if (na === nb) return 90
  if (na.includes(nb) || nb.includes(na)) return 60
  const wordsA = new Set(na.split(" ").filter((w) => w.length > 2))
  const wordsB = nb.split(" ").filter((w) => w.length > 2)
  if (wordsB.some((w) => wordsA.has(w))) return 45
  return 30
}

/**
 * Repli déterministe PUR (sans LLM). Secteur : compare brand.sector au secteur/industrie
 * du lead. Culture : compare primaryCulture/audienceLocation à la localisation du lead.
 * Audience : neutre (50) faute d'analyse sémantique fiable sans LLM. Données absentes →
 * neutre (50), jamais de score inventé.
 */
export function heuristicLeadScore(
  brand: LeadScoringBrandDna,
  lead: LeadScoringInput
): LeadScore {
  const sector = textMatch(brand.sector, lead.sector ?? lead.industry) ?? 50
  const culture =
    textMatch(brand.primaryCulture, lead.location) ??
    textMatch(brand.audienceLocation, lead.location) ??
    50
  const audience = 50
  return { audience, sector, culture, overall: computeOverall({ audience, sector, culture }) }
}

const SYSTEM_PROMPT =
  "Tu es un analyste B2B expert en qualification de leads pour les marchés africains et MENA. " +
  "Évalue la correspondance d'un prospect avec le client idéal d'une marque, sur 3 axes notés de 0 à 100 : " +
  "audience (adéquation avec l'audience cible), sector (proximité sectorielle), culture (alignement marché/culture). " +
  'Réponds UNIQUEMENT par un objet JSON valide, sans markdown : {"audience": number, "sector": number, "culture": number}'

/** Construit le system prompt de scoring (constant, exposé pour les tests). */
export function buildLeadScoringSystemPrompt(): string {
  return SYSTEM_PROMPT
}

/** Construit le user prompt de scoring à partir du Brand DNA et du lead (PUR). */
export function buildLeadScoringUserPrompt(
  brand: LeadScoringBrandDna,
  lead: LeadScoringInput
): string {
  const brandLines = [
    `- Marque : ${brand.brandName || "Non défini"}`,
    `- Secteur : ${brand.sector || "Non défini"}`,
    `- Positionnement : ${brand.positioning || "Non défini"}`,
    `- Culture/marché primaire : ${brand.primaryCulture || "Non défini"}`,
    `- Audience cible : ${brand.audienceDescription || "Non défini"}`,
    `- Localisation audience : ${brand.audienceLocation || "Non défini"}`,
    `- Points de douleur audience : ${brand.audiencePainPoints || "Non défini"}`,
  ].join("\n")

  const leadLines = [
    `- Entreprise : ${lead.company_name}`,
    `- Contact : ${lead.contact_name || "Non défini"}`,
    `- Secteur : ${lead.sector || lead.industry || "Non défini"}`,
    `- Taille : ${lead.company_size || "Non défini"}`,
    `- Localisation : ${lead.location || "Non défini"}`,
  ].join("\n")

  return `CLIENT IDÉAL (Brand DNA) :\n${brandLines}\n\nPROSPECT À ÉVALUER :\n${leadLines}\n\nNote les 3 axes (0-100) en JSON strict.`
}

/**
 * Parse la réponse LLM en {audience, sector, culture}. Extrait le premier objet JSON,
 * valide les 3 champs numériques et les borne [0,100]. Renvoie null si invalide
 * (→ le caller bascule sur le repli heuristique).
 */
export function parseLeadScore(
  raw: string
): { audience: number; sector: number; culture: number } | null {
  if (!raw) return null
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) return null
  let obj: unknown
  try {
    obj = JSON.parse(match[0])
  } catch {
    return null
  }
  if (typeof obj !== "object" || obj === null) return null
  const o = obj as Record<string, unknown>
  if (
    typeof o.audience !== "number" ||
    typeof o.sector !== "number" ||
    typeof o.culture !== "number"
  ) {
    return null
  }
  return {
    audience: clamp0100(o.audience),
    sector: clamp0100(o.sector),
    culture: clamp0100(o.culture),
  }
}

/** Assemble un LeadScore complet (3 axes + global) à partir des 3 axes bruts. */
export function assembleLeadScore(parts: {
  audience: number
  sector: number
  culture: number
}): LeadScore {
  const audience = clamp0100(parts.audience)
  const sector = clamp0100(parts.sector)
  const culture = clamp0100(parts.culture)
  return { audience, sector, culture, overall: computeOverall({ audience, sector, culture }) }
}
