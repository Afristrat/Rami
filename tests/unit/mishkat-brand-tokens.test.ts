import { buildBrandTokens } from '@/lib/services/mishkat/brand-tokens'
import { buildPsychologySpec, deriveTargetEmotion } from '@/lib/services/mishkat/psychology'
import { contrastRatio, type BrandIdentity } from '@/lib/services/brand-dna/resolver'

function makeIdentity(over: Partial<BrandIdentity> = {}): BrandIdentity {
  return {
    palette: ['#2563EB'],
    accent: '#2563EB',
    onAccent: '#FFFFFF',
    secondary: null,
    hasBrandColor: true,
    brandName: 'Rami',
    handle: 'Rami',
    monogram: 'RA',
    logoDataUrl: null,
    hasLogo: false,
    shapeKey: 'diagonales',
    shapeSignal: 'Dynamisme, vitesse, rupture, innovation',
    shapePromptKeywords: 'diagonal lines, motion blur, dynamic angles, speed lines',
    headingFamily: null,
    bodyFamily: null,
    sector: 'tech_saas',
    cognitiveObjective: 'confiance',
    culture: 'maroc',
    tone: 'premium',
    ...over,
  }
}

describe('deriveTargetEmotion', () => {
  it("priorise l'objectif cognitif de la marque", () => {
    expect(deriveTargetEmotion('expertise', 'awareness', 'premium')).toBe('expertise')
  })
  it('retombe sur le ton vidéo (override fort) si pas d\'objectif cognitif', () => {
    expect(deriveTargetEmotion(null, 'awareness', 'urgence')).toBe('urgence')
  })
  it("retombe sur l'objectif vidéo, sinon défaut confiance", () => {
    expect(deriveTargetEmotion(null, 'proof', 'default')).toBe('expertise')
    expect(deriveTargetEmotion(null, 'inconnu', 'default')).toBe('confiance')
  })
  it('tolère les accents/casse (serenite vs sérénité)', () => {
    expect(deriveTargetEmotion('Sérénité', 'awareness', 'default')).toBe('serenite')
  })
})

describe('buildPsychologySpec', () => {
  it('calibre fond/dégradé à l\'émotion et garantit un texte lisible (WCAG)', () => {
    const psy = buildPsychologySpec(makeIdentity({ cognitiveObjective: 'confiance' }), { objective: 'awareness', tone: 'premium' })
    expect(psy.target_emotion).toBe('confiance')
    expect(psy.composition_style).toBe('Blueprint + Scientifique')
    expect(psy.palette.bg).toBe('#0B1220')
    expect(psy.palette.gradient).toHaveLength(2)
    // Texte LISIBLE sur le fond calibré (contraste AA ≥ 4.5).
    expect(contrastRatio(psy.palette.bg, psy.palette.text)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(psy.palette.accent, psy.palette.onAccent)).toBeGreaterThanOrEqual(4.5)
  })

  it('porte la forme Gestalt résolue par le resolver (psychologie des formes)', () => {
    const psy = buildPsychologySpec(
      makeIdentity({ shapeKey: 'carre', shapeSignal: 'Stabilité, honnêteté, ordre, fiabilité', shapePromptKeywords: 'geometric blocks, structured grid' }),
      { objective: 'proof', tone: 'default' },
    )
    expect(psy.gestalt.shape).toBe('carre')
    expect(psy.gestalt.keywords).toContain('geometric')
  })

  it('applique l\'override Causse finance islamique → vert quand pas de couleur de marque', () => {
    const psy = buildPsychologySpec(makeIdentity({ sector: 'finance_islamique', hasBrandColor: false }), { objective: 'awareness', tone: 'default' })
    expect(psy.palette.accent.toLowerCase()).toBe('#16a34a') // vert Causse
  })
})

describe('buildBrandTokens', () => {
  it('injecte le spec psychologique + route les couleurs d\'émotion dans la palette (option A)', () => {
    const t = buildBrandTokens('rami', makeIdentity(), { objective: 'awareness', tone: 'premium' }, { backgrounds: ['https://x/1.jpg'], logoUrl: '' })
    expect(t.brand_id).toBe('rami')
    expect(t.psychology?.target_emotion).toBe('confiance')
    // (A) primary/secondary = arrêts du dégradé d'émotion (champs rendus par Mishkāt).
    expect(t.palette.primary).toBe(t.psychology?.palette.gradient[1])
    expect(t.palette.secondary).toBe(t.psychology?.palette.gradient[0])
    expect(t.palette.bg).toBe(t.psychology?.palette.bg)
    // L'accent de MARQUE réel est préservé (reconnaissance).
    expect(t.palette.accent.toLowerCase()).toBe('#2563eb')
    expect(t.media?.backgrounds).toEqual(['https://x/1.jpg'])
  })

  it('reste robuste sans couleur de marque ni objectif, sans clé media sans fond', () => {
    const t = buildBrandTokens('rami', makeIdentity({ hasBrandColor: false, palette: ['#1D4ED8'], cognitiveObjective: null }), { objective: 'awareness', tone: 'default' }, { backgrounds: [], logoUrl: '' })
    expect(t.palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(t.palette.accent).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(t.media).toBeUndefined()
    expect(t.typography.display.family).toBe('Geist')
    expect(t.psychology).toBeDefined()
  })
})
