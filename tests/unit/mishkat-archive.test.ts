import { variantKey, aspectToToken, archiveProductionIfNeeded, referenceVariantsToLibrary, toPermanentVariants, type ArchivedVariant } from '@/lib/services/mishkat/archive'
import type { MishkatVariant } from '@/lib/services/mishkat/types'

jest.mock('@/lib/services/mishkat/client', () => ({
  fetchVariant: jest.fn(async () => ({ buffer: Buffer.from('mp4-bytes'), mimeType: 'video/mp4' })),
}))
import { fetchVariant } from '@/lib/services/mishkat/client'

// Stockage = MinIO (bucket public `media`) — pas de connexion réelle en test.
jest.mock('@/lib/services/storage/client', () => ({
  BUCKETS: { logos: 'logos', media: 'media', audios: 'audios', docs: 'docs' },
  uploadToStorage: jest.fn(async (params: { path: string }) => ({
    data: { path: `media/${params.path}`, publicUrl: 'https://rami/x.mp4', signedUrl: null, bucket: 'media', sizeBytes: 9 },
    error: null,
  })),
}))

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
    // Seul l'INSERT media_assets passe encore par Supabase (la DB) ;
    // le stockage de l'objet MP4 va sur MinIO (mocké ci-dessus).
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

describe('referenceVariantsToLibrary (root cause 2026-07-02 : la Bibliothèque doit connaître les vidéos)', () => {
  const live: MishkatVariant[] = [{ lang: 'fr', format: '16:9', gatePassed: true, url: 'https://s3-rami.ai-mpower.com/mishkat/productions/job-1/fr-16x9.mp4' }]

  afterEach(() => jest.clearAllMocks())

  it('référence une variante neuve dans media_assets SANS re-télécharger (fetchVariant jamais appelé)', async () => {
    const res = await referenceVariantsToLibrary(fakeSupabase(), 'tenant-1', 'user-1', 'job-1', live, [])
    expect(res[0].media_id).toBe('media-1')
    expect(res[0].public_url).toBe(live[0].url)
    expect(res[0].url).toBe(live[0].url)
    expect(fetchVariant).not.toHaveBeenCalled()
  })

  it('est idempotent : ne réinsère pas une variante déjà référencée', async () => {
    const existing: ArchivedVariant[] = [
      { lang: 'fr', format: '16:9', gatePassed: true, url: 'https://m/fr-16x9', media_id: 'media-old', public_url: 'https://rami/old.mp4' },
    ]
    const res = await referenceVariantsToLibrary(fakeSupabase(), 'tenant-1', 'user-1', 'job-1', live, existing)
    expect(res[0].media_id).toBe('media-old')
  })

  it("échec d'insertion Bibliothèque : non bloquant, l'URL permanente reste renvoyée (media_id null)", async () => {
    const failing = {
      from: () => ({
        insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'RLS denied' } }) }) }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
    const res = await referenceVariantsToLibrary(failing, 'tenant-1', 'user-1', 'job-1', live, [])
    expect(res[0].media_id).toBeNull()
    expect(res[0].public_url).toBe(live[0].url)
  })
})

describe('toPermanentVariants (contrat 2026-06-28 : URL MinIO permanente, sans re-download)', () => {
  const live: MishkatVariant[] = [
    { lang: 'fr', format: '16:9', gatePassed: true, url: 'https://s3-rami.ai-mpower.com/mishkat/productions/job-1/fr-16x9.mp4' },
  ]

  it('persiste variants[].url tel quel comme public_url, sans archiver (media_id null)', () => {
    const res = toPermanentVariants(live, [])
    expect(res[0].public_url).toBe(live[0].url)
    expect(res[0].url).toBe(live[0].url)
    expect(res[0].media_id).toBeNull()
    expect(fetchVariant).not.toHaveBeenCalled()
  })

  it('préserve une copie de redondance déjà archivée (media_id + public_url)', () => {
    const existing: ArchivedVariant[] = [
      { lang: 'fr', format: '16:9', gatePassed: true, url: 'https://m/old', media_id: 'media-redundant', public_url: 'https://rami/redundant.mp4' },
    ]
    const res = toPermanentVariants(live, existing)
    expect(res[0].media_id).toBe('media-redundant')
    expect(res[0].public_url).toBe('https://rami/redundant.mp4')
  })
})
