// ============================================================
// Résolution du branding PDF — logique PURE (socle PDF serveur)
// ============================================================
// Détermine l'identité visuelle d'un document exporté selon 3 niveaux,
// conformément à la décision produit (2026-06-11) :
//   1. agency  — l'agence a le forfait « Branding personnalisé » (feature
//      white_label) ET un logo → 100 % agence, aucune mention RAMI.
//   2. cobrand — l'agence a un logo mais PAS le forfait → co-branding
//      (logo agence + « Propulsé par RAMI »).
//   3. rami    — aucun logo agence → branding RAMI seul.
//
// PUR : aucune I/O. Le plan et le brand_dna sont fournis par l'appelant.

import { hasFeatureAccess, type Plan } from "@/lib/billing/plans"
import { resolveBrandIdentity } from "@/lib/services/brand-dna/resolver"

export type PdfBrandingMode = "agency" | "cobrand" | "rami"

export interface PdfBranding {
  mode: PdfBrandingMode
  /** Logo de l'agence (data-URL) si présent et exploitable, sinon null. */
  logoDataUrl: string | null
  /** Nom affiché en en-tête (agence ou « RAMI »). */
  displayName: string
  /** true → afficher la mention « Propulsé par RAMI » en pied de page. */
  showPoweredBy: boolean
  /** Couleur d'accent de marque (Brand DNA Resolver) appliquée au document. */
  accentColor: string
  /** Texte lisible sur l'accent (contraste WCAG). */
  onAccent: string
}

const RAMI_NAME = "RAMI"

/** Valide qu'une valeur est une data-URL d'image exploitable par le moteur PDF. */
export function isUsableLogo(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(value.trim())
  )
}

function pickString(src: Record<string, unknown>, ...keys: string[]): string | null {
  for (const k of keys) {
    const v = src[k]
    if (typeof v === "string" && v.trim().length > 0) return v.trim()
  }
  return null
}

export interface ResolvePdfBrandingInput {
  plan: Plan
  /** brand_dna brut du tenant (shape PLATE réelle ou nestée). */
  brandDna: unknown
}

/**
 * Résout le branding à appliquer au PDF. Ne dépend que du plan et du brand_dna.
 */
export function resolvePdfBranding(input: ResolvePdfBrandingInput): PdfBranding {
  const dna =
    input.brandDna && typeof input.brandDna === "object" && !Array.isArray(input.brandDna)
      ? (input.brandDna as Record<string, unknown>)
      : {}

  const identity =
    dna.identity && typeof dna.identity === "object" && !Array.isArray(dna.identity)
      ? (dna.identity as Record<string, unknown>)
      : {}

  const agencyName =
    pickString(identity, "name") ?? pickString(dna, "brandName", "nomEntreprise")
  const rawLogo = dna.logoDataUrl ?? dna.logo_data_url
  const logo = isUsableLogo(rawLogo) ? rawLogo : null

  const hasCustomBranding = hasFeatureAccess(input.plan, "white_label")

  // Accent de marque (couleur réelle du tenant via le Brand DNA Resolver) — le
  // document n'est plus figé sur le violet RAMI.
  const identityTokens = resolveBrandIdentity(input.brandDna)
  const accentColor = identityTokens.accent
  const onAccent = identityTokens.onAccent

  // Niveau 3 : aucun logo agence → RAMI seul (mais l'accent reste celui de la marque).
  if (!logo) {
    return {
      mode: "rami",
      logoDataUrl: null,
      displayName: RAMI_NAME,
      showPoweredBy: false,
      accentColor,
      onAccent,
    }
  }

  // Niveau 1 : forfait Branding personnalisé + logo → 100 % agence.
  if (hasCustomBranding) {
    return {
      mode: "agency",
      logoDataUrl: logo,
      displayName: agencyName ?? "",
      showPoweredBy: false,
      accentColor,
      onAccent,
    }
  }

  // Niveau 2 : logo sans forfait → co-branding.
  return {
    mode: "cobrand",
    logoDataUrl: logo,
    displayName: agencyName ?? "",
    showPoweredBy: true,
    accentColor,
    onAccent,
  }
}
