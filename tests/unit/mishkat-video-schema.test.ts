import { MishkatVideoInputSchema, toMishkatBrief } from '@/lib/schemas/mishkat-video.schema'

const valid = {
  intent: 'Annoncer le lancement de Rami aux pairs techniques et montrer le gain de temps.',
  audience: 'pairs_tech',
  tone: 'premium',
  objective: 'awareness',
  duration_s: 30,
  primaryLang: 'fr',
  secondaryLang: 'ar',
  music: true,
  voiceover: false,
  captionsBurned: true,
  assetIds: ['11111111-1111-4111-8111-111111111111'],
}

describe('MishkatVideoInputSchema', () => {
  it('valide un brief correct', () => {
    expect(MishkatVideoInputSchema.safeParse(valid).success).toBe(true)
  })

  it('rejette un intent trop court', () => {
    expect(MishkatVideoInputSchema.safeParse({ ...valid, intent: 'court' }).success).toBe(false)
  })

  it('rejette un assetId non-UUID', () => {
    expect(MishkatVideoInputSchema.safeParse({ ...valid, assetIds: ['not-a-uuid'] }).success).toBe(false)
  })
})

describe('toMishkatBrief', () => {
  it('produit 16:9 + 9:16 et un brief bilingue', () => {
    const brief = toMishkatBrief('rami', MishkatVideoInputSchema.parse(valid))
    const aspects = brief.channel_format.map((c) => c.aspect).sort()
    expect(aspects).toEqual(['16:9', '9:16'])
    expect(brief.language).toEqual({ primary: 'fr', secondary: 'ar', rtl: false })
    expect(brief.sound).toEqual({ music: true, voiceover: false, captions_burned: true })
  })

  it('active rtl quand la langue primaire est l’arabe', () => {
    const brief = toMishkatBrief('rami', MishkatVideoInputSchema.parse({ ...valid, primaryLang: 'ar', secondaryLang: 'fr' }))
    expect(brief.language.rtl).toBe(true)
  })
})
