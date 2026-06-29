// ============================================================
// US-052 — Service generateVisual (orchestration image / carrousel)
// Les moteurs réels (LLM, image-gen, PDF, MinIO, sharp) sont mockés : on teste
// le ROUTAGE par type, le manifeste, et la gestion des cas d'erreur.
// ============================================================

const mockGenerateCarouselDeck = jest.fn()
const mockRenderCarouselPdf = jest.fn()
const mockGenerateImage = jest.fn()
const mockUploadToStorage = jest.fn()

jest.mock('@/lib/services/visuals/carousel-core', () => ({
  generateCarouselDeck: (...a: unknown[]) => mockGenerateCarouselDeck(...a),
}))
jest.mock('@/lib/services/documents/carousel/carousel-pdf', () => ({
  renderCarouselPdf: (...a: unknown[]) => mockRenderCarouselPdf(...a),
}))
jest.mock('@/lib/services/image-generation', () => ({
  generateImage: (...a: unknown[]) => mockGenerateImage(...a),
}))
jest.mock('@/lib/services/storage/client', () => ({
  uploadToStorage: (...a: unknown[]) => mockUploadToStorage(...a),
  buildStoragePath: (tenantId: string, file: string) => `${tenantId}/123-${file}`,
}))
jest.mock('@/lib/services/brand-dna/resolver', () => ({
  resolveBrandIdentity: () => ({
    accent: '#1D4ED8', onAccent: '#FFFFFF', palette: ['#1D4ED8'], secondary: null,
    brandName: 'Acme', hasBrandColor: true, shapeKey: 'carre', monogram: 'AC',
    handle: 'acme', logoDataUrl: null,
  }),
}))
jest.mock('@/lib/services/brand-dna/normalize', () => ({
  normalizeBrandDNA: (raw: unknown) => raw ?? {},
}))
jest.mock('@/lib/services/brand-dna/prompt-compiler', () => ({
  compileBrandDNAToPrompts: () => [{
    direction: { id: 1, name: 'D1', style: 's', emotion: 'e' },
    positive_prompt: 'p', negative_prompt: 'n',
    parameters: { guidance_scale: 9, num_inference_steps: 35, width: 1080, height: 1080, seed: 42 },
  }],
}))
jest.mock('sharp', () => {
  const chain = {
    rotate: () => chain, resize: () => chain, webp: () => chain,
    toBuffer: async () => Buffer.from('webp'),
    metadata: async () => ({ width: 1080, height: 1080 }),
  }
  return { __esModule: true, default: () => chain }
})

import { generateVisual } from '@/lib/services/visuals/generate'

beforeEach(() => {
  jest.clearAllMocks()
  mockUploadToStorage.mockResolvedValue({
    data: { path: 'media/t1/123-x', publicUrl: 'https://minio.example/x', signedUrl: null, bucket: 'media', sizeBytes: 10 },
    error: null,
  })
})

describe('generateVisual', () => {
  it('route un carrousel 4:5 → PDF + manifeste cohérent', async () => {
    mockGenerateCarouselDeck.mockResolvedValue({
      success: true,
      carousel: { slides: [{ type: 'cover', title: 'Négociation' }, { type: 'cta', heading: 'Contactez' }] },
    })
    mockRenderCarouselPdf.mockResolvedValue(Buffer.from('%PDF-1.7'))

    const r = await generateVisual({
      tenantId: 't1', type: 'carousel', format: '4:5',
      content: { brief: 'un brief assez long pour passer' }, brandDna: { x: 1 }, tenantName: 'Acme',
    })

    expect(r.manifest.width / r.manifest.height).toBeCloseTo(0.8, 2)
    expect(r.manifest.mime).toBe('application/pdf')
    expect(r.manifest.slides).toBe(2)
    expect(r.slides).toHaveLength(1)
    expect(r.slides[0].public_url).toBe('https://minio.example/x')
    expect(r.sourceText).toContain('Négociation')
    expect(r.brandDnaSnapshot.accent).toBe('#1D4ED8')
  })

  it('route une image 1:1 → WebP + manifeste carré', async () => {
    mockGenerateImage.mockResolvedValue({
      images: [{ url: 'https://provider/img.png', width: 1080, height: 1080 }],
      provider: 'fal_ai', duration_ms: 1, model: 'flux',
    })
    // fetch mocké pour le téléchargement de l'image du provider (sharp mocké en haut).
    global.fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })) as unknown as typeof fetch

    const r = await generateVisual({
      tenantId: 't1', type: 'image', format: '1:1',
      content: { brief: 'un brief assez long pour image' }, brandDna: { x: 1 }, tenantName: 'Acme',
    })

    expect(r.manifest.width).toBe(1080)
    expect(r.manifest.height).toBe(1080)
    expect(r.manifest.mime).toBe('image/webp')
    expect(r.manifest.fonts_embedded).toBe(true)
    expect(r.slides).toHaveLength(1)
  })

  it('rejette un format inconnu', async () => {
    await expect(
      generateVisual({ tenantId: 't1', type: 'image', format: '3:2', content: { brief: 'xxxxxxxxxx' }, brandDna: null, tenantName: null })
    ).rejects.toThrow(/Format inconnu/)
  })

  it('rejette un type non supporté', async () => {
    await expect(
      generateVisual({ tenantId: 't1', type: 'hologram', format: '1:1', content: { brief: 'xxxxxxxxxx' }, brandDna: null, tenantName: null })
    ).rejects.toThrow(/non support/)
  })

  it('rejette un brief manquant/trop court', async () => {
    await expect(
      generateVisual({ tenantId: 't1', type: 'carousel', format: '4:5', content: { brief: 'court' }, brandDna: null, tenantName: null })
    ).rejects.toThrow(/brief/)
  })
})
