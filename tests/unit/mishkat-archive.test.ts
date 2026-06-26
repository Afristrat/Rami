import { variantKey, aspectToToken, archiveProductionIfNeeded, type ArchivedVariant } from '@/lib/services/mishkat/archive'
import type { MishkatVariant } from '@/lib/services/mishkat/types'

jest.mock('@/lib/services/mishkat/client', () => ({
  fetchVariant: jest.fn(async () => ({ buffer: Buffer.from('mp4-bytes'), mimeType: 'video/mp4' })),
}))
import { fetchVariant } from '@/lib/services/mishkat/client'

describe('dérivation de clé de variante', () => {
  it('aspectToToken convertit le ratio', () => {
    expect(aspectToToken('16:9')).toBe('16x9')
    expect(aspectToToken('9:16')).toBe('9x16')
  })
  it('variantKey produit <lang>-<format>.mp4', () => {
    expect(variantKey({ lang: 'fr', format: '16:9' })).toBe('fr-16x9.mp4')
    expect(variantKey({ lang: 'ar', format: '9:16' })).toBe('ar-9x16.mp4')
  })
})

function fakeSupabase() {
  return {
    storage: {
      from: () => ({
        upload: jest.fn(async () => ({ error: null })),
        getPublicUrl: () => ({ data: { publicUrl: 'https://rami/x.mp4' } }),
      }),
    },
    from: () => ({
      insert: () => ({ select: () => ({ single: async () => ({ data: { id: 'media-1' }, error: null }) }) }),
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

describe('archiveProductionIfNeeded', () => {
  const live: MishkatVariant[] = [{ lang: 'fr', format: '16:9', gatePassed: true, url: 'https://m/fr-16x9' }]

  afterEach(() => jest.clearAllMocks())

  it('archive une variante neuve et renvoie media_id', async () => {
    const res = await archiveProductionIfNeeded(fakeSupabase(), 'tenant-1', 'user-1', 'job-1', live, [])
    expect(res[0].media_id).toBe('media-1')
    expect(res[0].public_url).toBe('https://rami/x.mp4')
    expect(fetchVariant).toHaveBeenCalledTimes(1)
  })

  it('est idempotent : ne re-télécharge pas une variante déjà archivée', async () => {
    const existing: ArchivedVariant[] = [
      { lang: 'fr', format: '16:9', gatePassed: true, url: 'https://m/fr-16x9', media_id: 'media-old', public_url: 'https://rami/old.mp4' },
    ]
    const res = await archiveProductionIfNeeded(fakeSupabase(), 'tenant-1', 'user-1', 'job-1', live, existing)
    expect(res[0].media_id).toBe('media-old')
    expect(fetchVariant).not.toHaveBeenCalled()
  })
})
