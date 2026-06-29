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
    // IDENTITÉ DE MARQUE INTOUCHABLE : `palette.{primary,secondary,accent}` =
    // couleurs RÉELLES de la marque → pilotent les éléments d'identité que Mishkāt
    // rend (accent, CTA, puces, lueur). La plateforme ne fait JAMAIS ressembler une
    // marque à une autre. L'ÉMOTION est une couche de TRAITEMENT (fond/dégradé/grade
    // colorimétrique) portée par le bloc `psychology` ci-dessous, que seul le renderer
    // Mishkāt (option B) applique — sans toucher à l'identité. (`bg`/`text` calibrés
    // restent sûrs : premiumBg les domine, contraste WCAG garanti.)
    palette: {
      primary: identity.palette[0] ?? identity.accent,
      secondary: identity.secondary ?? identity.accent,
      accent: identity.accent,
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
