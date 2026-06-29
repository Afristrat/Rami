// ============================================================
// Phase 2 vidéo — génération d'une image de fond par scène (flux v2 Mishkāt).
// Providers image / fetch / sharp / MinIO mockés : on teste le mapping
// storyboard → sceneImages et la robustesse (scènes sans prompt / échecs).
// ============================================================

const mockGenerateImage = jest.fn()
const mockUploadToStorage = jest.fn()

jest.mock('@/lib/services/image-generation', () => ({
  generateImage: (...a: unknown[]) => mockGenerateImage(...a),
}))
jest.mock('@/lib/services/storage/client', () => ({
  uploadToStorage: (...a: unknown[]) => mockUploadToStorage(...a),
  buildStoragePath: (tenantId: string, file: string) => `${tenantId}/123-${file}`,
}))
jest.mock('sharp', () => {
  const chain = { rotate: () => chain, resize: () => chain, webp: () => chain, toBuffer: async () => Buffer.from('webp') }
  return { __esModule: true, default: () => chain }
})

import { generateSceneImages } from '@/lib/services/mishkat/scene-images'
import type { MishkatStoryboard } from '@/lib/services/mishkat/types'

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })) as unknown as typeof fetch
  mockGenerateImage.mockResolvedValue({ images: [{ url: 'https://provider/x.png', width: 1920, height: 1080 }], provider: 'fal_ai', duration_ms: 1, model: 'flux' })
  mockUploadToStorage.mockResolvedValue({ data: { path: 'media/t/x.webp', publicUrl: 'https://minio/x.webp', signedUrl: null, bucket: 'media', sizeBytes: 10 }, error: null })
})

const storyboard: MishkatStoryboard = {
  scenes: [
    { id: 's1', image_prompt: 'un atelier industriel lumineux, ambiance confiance' },
    { id: 's2', image_prompt: 'gros plan sur une poignée de main, tons chauds' },
    { id: 's3' }, // pas d'image_prompt → ignorée
  ],
}

describe('generateSceneImages', () => {
  it('génère une image par scène avec image_prompt et renvoie la carte sceneId→url', async () => {
    const r = await generateSceneImages('t1', storyboard, '16:9')
    expect(Object.keys(r.sceneImages).sort()).toEqual(['s1', 's2'])
    expect(r.sceneImages.s1).toBe('https://minio/x.webp')
    expect(r.skipped).toEqual(['s3'])
    expect(mockGenerateImage).toHaveBeenCalledTimes(2)
  })

  it('utilise les dimensions du format (9:16 → portrait)', async () => {
    await generateSceneImages('t1', { scenes: [{ id: 's1', image_prompt: 'paysage vertical' }] }, '9:16')
    expect(mockGenerateImage).toHaveBeenCalledWith(expect.objectContaining({ width: 1080, height: 1920 }))
  })

  it('une scène dont la génération échoue est listée dans skipped, sans bloquer les autres', async () => {
    mockGenerateImage
      .mockResolvedValueOnce({ images: [], provider: 'fal_ai', duration_ms: 1, model: 'flux' }) // s1 : aucune image
      .mockResolvedValueOnce({ images: [{ url: 'https://provider/ok.png' }], provider: 'fal_ai', duration_ms: 1, model: 'flux' }) // s2 ok
    const r = await generateSceneImages('t1', { scenes: [{ id: 's1', image_prompt: 'aaa bbb' }, { id: 's2', image_prompt: 'ccc ddd' }] }, '16:9')
    expect(r.sceneImages.s2).toBe('https://minio/x.webp')
    expect(r.skipped).toContain('s1')
  })

  it('storyboard vide → carte vide, aucun appel provider', async () => {
    const r = await generateSceneImages('t1', { scenes: [] }, '16:9')
    expect(r.sceneImages).toEqual({})
    expect(mockGenerateImage).not.toHaveBeenCalled()
  })
})
