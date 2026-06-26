import { buildBrandTokens } from '@/lib/services/mishkat/brand-tokens'
import type { BrandDnaFormData } from '@/lib/schemas/brand-dna.schema'

const dna = {
  brandName: 'Rami',
  sector: 'tech',
  positioning: 'x'.repeat(20),
  audienceDescription: 'y'.repeat(25),
  colorPrimary: 'violet_creatif',
  colorSecondary: '#2563eb',
  colorAccent: 'vert_emeraude',
  voiceTone: 'premium',
} as unknown as BrandDnaFormData

describe('buildBrandTokens', () => {
  it('résout les IDs Causse en HEX et conserve les HEX bruts', () => {
    const t = buildBrandTokens('rami', dna, { backgrounds: ['https://x/1.jpg'], logoUrl: '' })
    expect(t.brand_id).toBe('rami')
    expect(t.palette.primary.toLowerCase()).toBe('#7c3aed') // violet_creatif
    expect(t.palette.secondary.toLowerCase()).toBe('#2563eb') // HEX brut conservé
    expect(t.palette.accent.toLowerCase()).toBe('#059669') // vert_emeraude
    expect(t.media?.backgrounds).toEqual(['https://x/1.jpg'])
  })

  it('retombe sur des couleurs sûres si le DNA est vide, sans clé media sans fond', () => {
    const t = buildBrandTokens('rami', null, { backgrounds: [], logoUrl: '' })
    expect(t.palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(t.palette.accent).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(t.media).toBeUndefined()
    expect(t.typography.display.family).toBe('Geist')
  })
})
