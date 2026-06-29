// ============================================================
// Mishkāt — Construction des BrandTokens depuis l'identité de marque résolue
// Fonction PURE : les URLs (backgrounds, logo) sont signées par l'appelant
// serveur et injectées ici. Aucune I/O dans ce module.
// ============================================================
// La palette de base + le spec psychologique calibré (Causse × Gestalt)
// proviennent du resolver Brand DNA + de buildPsychologySpec — plus aucune
// couleur figée : `bg`/`text` sont désormais calibrés à l'émotion cible
// (contraste WCAG garanti).

import type { BrandIdentity } from '@/lib/services/brand-dna/resolver'
import { buildPsychologySpec } from './psychology'
import type { BrandTokens } from './types'

// Repli neutre si l'identité n'a pas de secondaire exploitable.
const FALLBACK_SECONDARY = '#4E45D5'

export interface BrandTokensExtras {
  backgrounds: string[]
  logoUrl: string
}

export function buildBrandTokens(
  brandId: string,
  identity: BrandIdentity,
  brief: { objective: string; tone: string },
  extra: BrandTokensExtras,
): BrandTokens {
  const psychology = buildPsychologySpec(identity, brief)

  const tokens: BrandTokens = {
    brand_id: brandId,
    palette: {
      primary: identity.palette[0] ?? identity.accent,
      secondary: identity.secondary ?? FALLBACK_SECONDARY,
      accent: identity.accent,
      // Fond + texte calibrés à l'émotion cible (et non plus figés clair/foncé).
      bg: psychology.palette.bg,
      text: psychology.palette.text,
    },
    typography: {
      display: { family: identity.headingFamily ?? 'Geist', weight: 700 },
      body: { family: identity.bodyFamily ?? 'Geist', weight: 400 },
    },
    logo_url: extra.logoUrl,
    psychology,
  }
  if (extra.backgrounds.length > 0) {
    tokens.media = { backgrounds: extra.backgrounds }
  }
  return tokens
}
