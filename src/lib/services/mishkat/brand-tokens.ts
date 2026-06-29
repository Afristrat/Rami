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
    // Option (A) — rendre l'émotion VISIBLE via les champs que le renderer Mishkāt
    // consomme DÉJÀ (vérifié dans son code) : `palette.primary` pilote la lueur de
    // fond (`premiumBg`) et `primary→secondary` le dégradé. On y route donc les
    // couleurs d'émotion ; l'accent de marque RÉEL est préservé (reconnaissance)
    // pour les puces/CTA. Le bloc `psychology` reste envoyé pour le futur (option B :
    // formes Gestalt + composition, que Mishkāt ne consomme pas encore).
    // ⚠️ Limite connue : `premiumBg` code en dur une base sombre — tant que (B) n'est
    // pas fait, c'est la TEINTE de la lueur/dégradé qui change, pas la clarté du fond.
    palette: {
      primary: psychology.palette.gradient[1], // teinte vive d'émotion (lueur dominante)
      secondary: psychology.palette.gradient[0], // tone profond d'émotion (2ᵉ arrêt)
      accent: psychology.palette.accent, // accent de marque réel si présent, sinon couleur d'émotion
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
