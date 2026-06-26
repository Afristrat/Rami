// ============================================================
// Mishkāt — Construction des BrandTokens depuis le Brand DNA RAMI
// Fonction PURE : les URLs (backgrounds, logo) sont signées par
// l'appelant serveur et injectées ici. Aucune I/O dans ce module.
// ============================================================

import { causseColorToHex } from '@/lib/services/brand-dna/normalize'
import type { BrandDnaFormData } from '@/lib/schemas/brand-dna.schema'
import type { BrandTokens } from './types'

// Palette de repli souveraine (HEX sûrs) si le Brand DNA est incomplet.
const FALLBACK = {
  primary: '#1E3A5F',
  secondary: '#4E45D5',
  accent: '#10B981',
  bg: '#F7F6F8',
  text: '#0A0A0F',
} as const

function hex(value: string | null | undefined, fallback: string): string {
  if (!value) return fallback
  return causseColorToHex(value) ?? fallback
}

export interface BrandTokensExtras {
  backgrounds: string[]
  logoUrl: string
}

export function buildBrandTokens(
  brandId: string,
  dna: BrandDnaFormData | null,
  extra: BrandTokensExtras,
): BrandTokens {
  const tokens: BrandTokens = {
    brand_id: brandId,
    palette: {
      primary: hex(dna?.colorPrimary, FALLBACK.primary),
      secondary: hex(dna?.colorSecondary, FALLBACK.secondary),
      accent: hex(dna?.colorAccent, FALLBACK.accent),
      bg: FALLBACK.bg,
      text: FALLBACK.text,
    },
    typography: {
      display: { family: dna?.typography?.heading?.family ?? 'Geist', weight: 700 },
      body: { family: dna?.typography?.body?.family ?? 'Geist', weight: 400 },
    },
    logo_url: extra.logoUrl,
  }
  if (extra.backgrounds.length > 0) {
    tokens.media = { backgrounds: extra.backgrounds }
  }
  return tokens
}
