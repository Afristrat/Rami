// ============================================================
// Normalisation Brand DNA — shape PLATE réelle → interface BrandDNA (prompt-compiler)
// ============================================================
// Le brand_dna sauvegardé par l'onboarding est PLAT (`sector`, `colorPrimary` = ID
// Causse, `objectifCognitif`, `primaryCulture`, `positioning`…), alors que le
// prompt-compiler attend une shape NESTÉE (`identity.sector`, `color_palette[].hex`,
// `culture_markets.primary_culture`). Sans normalisation, les VRAIES couleurs de marque
// étaient ignorées en prod (fallback Causse). Ce module corrige la dette à la racine.
//
// PUR → testable sans DB. Tolérant : accepte aussi un brand_dna déjà nesté.

import { CAUSSE_COLORS } from "@/lib/schemas/brand-dna.schema"
import type { BrandDNA } from "./prompt-compiler"

const HEX_BY_ID: Record<string, string> = Object.fromEntries(
  CAUSSE_COLORS.map((c) => [c.id, c.hex])
)

/** Résout un identifiant de couleur (ID Causse ou HEX direct) en HEX, sinon null. */
export function causseColorToHex(value: string | null | undefined): string | null {
  if (!value) return null
  const v = value.trim()
  if (/^#[0-9a-fA-F]{3,8}$/.test(v)) return v // déjà un HEX
  return HEX_BY_ID[v] ?? null
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.trim().length > 0 ? v : undefined
}

type PaletteEntry = { hex: string; name: string | undefined }

/**
 * Normalise un brand_dna brut (PLAT réel OU déjà nesté) vers l'interface BrandDNA
 * du prompt-compiler. Résout les IDs de couleur Causse en HEX. Champs absents →
 * undefined (le compiler retombe alors proprement sur la matrice Causse).
 */
export function normalizeBrandDNA(raw: unknown): BrandDNA {
  const r = asRecord(raw)
  if (!r) return {}

  const identity = asRecord(r.identity)
  const cultureMarkets = asRecord(r.culture_markets)
  const editorialTone = asRecord(r.editorial_tone)
  const objectifs = Array.isArray(r.objectifsCognitifs) ? r.objectifsCognitifs : []

  const name = str(identity?.name) ?? str(r.brandName) ?? str(r.nomEntreprise)
  const sector = str(identity?.sector) ?? str(r.sector) ?? str(r.secteur)
  const positioning = str(identity?.positioning) ?? str(r.positioning)
  const tagline = str(identity?.tagline) ?? str(r.tagline)
  const cognitive =
    str(r.cognitive_objective) ?? str(r.objectifCognitif) ?? str(objectifs[0])
  const culture =
    str(cultureMarkets?.primary_culture) ?? str(r.primaryCulture) ?? str(r.marchePrimaire)
  const register = str(editorialTone?.register) ?? str(r.voiceTone) ?? str(r.tonEditorial)

  // Plateformes actives (PLAT `activePlatforms` ou nesté `active_platforms`).
  const rawPlatforms = Array.isArray(r.active_platforms)
    ? r.active_platforms
    : Array.isArray(r.activePlatforms)
      ? r.activePlatforms
      : []
  const activePlatforms = rawPlatforms.filter((p): p is string => typeof p === "string")

  // Palette : préférer une palette déjà nestée, sinon construire depuis les IDs PLAT.
  let palette: PaletteEntry[]
  if (Array.isArray(r.color_palette) && r.color_palette.length > 0) {
    palette = (r.color_palette as unknown[])
      .map((c): PaletteEntry | null => {
        const co = asRecord(c)
        const hex = causseColorToHex(str(co?.hex) ?? str(co?.id))
        return hex ? { hex, name: str(co?.name) ?? str(co?.id) } : null
      })
      .filter((c): c is PaletteEntry => c !== null)
  } else {
    palette = [r.colorPrimary, r.colorSecondary, r.colorAccent]
      .map((id): PaletteEntry | null => {
        const sid = str(id)
        const hex = causseColorToHex(sid)
        return hex ? { hex, name: sid } : null
      })
      .filter((c): c is PaletteEntry => c !== null)
  }

  return {
    identity: { name, sector, positioning, tagline },
    cognitive_objective: cognitive,
    culture_markets: { primary_culture: culture },
    color_palette: palette,
    editorial_tone: { register },
    active_platforms: activePlatforms.length > 0 ? activePlatforms : undefined,
  }
}
