// ============================================================
// pollAndPersistProduction — logique UNIQUE partagée par GET /api/video/[id]
// (polling navigateur) et render-watch-worker (polling de fond, cf. root
// cause 2026-07-02 : timeout navigateur atteint avant la fin réelle du rendu,
// ET root cause du 2026-07-02 (bis) : aucune production vidéo n'était jamais
// référencée dans la Bibliothèque, browser ou worker confondus).
// ============================================================

const mockGetProduction = jest.fn()
const mockArchiveProductionIfNeeded = jest.fn()
const mockReferenceVariantsToLibrary = jest.fn()
const mockToPermanentVariants = jest.fn()

jest.mock('@/lib/services/mishkat/client', () => ({
  getProduction: (...a: unknown[]) => mockGetProduction(...a),
}))
jest.mock('@/lib/services/mishkat/archive', () => ({
  archiveProductionIfNeeded: (...a: unknown[]) => mockArchiveProductionIfNeeded(...a),
  referenceVariantsToLibrary: (...a: unknown[]) => mockReferenceVariantsToLibrary(...a),
  toPermanentVariants: (...a: unknown[]) => mockToPermanentVariants(...a),
}))

import { pollAndPersistProduction } from '@/lib/services/mishkat/finalize'

const originalEnv = process.env

function fakeSupabase(update: (payload: unknown) => void) {
  const chain: Record<string, unknown> = {}
  for (const m of ['eq']) chain[m] = () => chain
  chain.then = (resolve: (v: unknown) => void) => resolve({ error: null })
  return {
    from: () => ({
      update: (payload: unknown) => {
        update(payload)
        return chain
      },
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any
}

beforeEach(() => {
  jest.clearAllMocks()
  process.env = { ...originalEnv }
  mockToPermanentVariants.mockReturnValue([{ lang: 'fr', format: '16:9', gatePassed: true, url: 'https://minio/fr.mp4', media_id: null, public_url: 'https://minio/fr.mp4' }])
  mockReferenceVariantsToLibrary.mockResolvedValue([{ lang: 'fr', format: '16:9', gatePassed: true, url: 'https://minio/fr.mp4', media_id: 'media-1', public_url: 'https://minio/fr.mp4' }])
})
afterEach(() => {
  process.env = originalEnv
})

describe('pollAndPersistProduction', () => {
  it('statut intermédiaire (rendering) : persiste le statut, ne touche pas aux variantes', async () => {
    mockGetProduction.mockResolvedValue({ status: 'rendering' })
    let updated: unknown
    const supabase = fakeSupabase((p) => (updated = p))

    const { live, variants } = await pollAndPersistProduction(supabase, 't1', 'row-1', 'job-1', [])

    expect(live.status).toBe('rendering')
    expect(variants).toBeUndefined()
    expect(updated).toMatchObject({ status: 'rendering', error_message: null })
    expect(mockToPermanentVariants).not.toHaveBeenCalled()
    expect(mockReferenceVariantsToLibrary).not.toHaveBeenCalled()
  })

  it('done + userId (cas par défaut prod) : référence dans la Bibliothèque, pas de re-download', async () => {
    mockGetProduction.mockResolvedValue({ status: 'done', variants: [{ lang: 'fr', format: '16:9', gatePassed: true, url: 'https://minio/fr.mp4' }] })
    let updated: unknown
    const supabase = fakeSupabase((p) => (updated = p))

    const { live, variants } = await pollAndPersistProduction(supabase, 't1', 'row-1', 'job-1', [], { userId: 'u1' })

    expect(live.status).toBe('done')
    expect(mockReferenceVariantsToLibrary).toHaveBeenCalledWith(supabase, 't1', 'u1', 'job-1', [{ lang: 'fr', format: '16:9', gatePassed: true, url: 'https://minio/fr.mp4' }], [])
    expect(mockArchiveProductionIfNeeded).not.toHaveBeenCalled()
    expect(mockToPermanentVariants).not.toHaveBeenCalled()
    expect(variants?.[0]?.media_id).toBe('media-1')
    expect(updated).toMatchObject({ status: 'done' })
  })

  it('done + MISHKAT_ARCHIVE_REDUNDANT_COPY=true + userId fourni : archive une copie de redondance (pas de référence simple)', async () => {
    process.env.MISHKAT_ARCHIVE_REDUNDANT_COPY = 'true'
    mockGetProduction.mockResolvedValue({ status: 'done', variants: [] })
    mockArchiveProductionIfNeeded.mockResolvedValue([])
    const supabase = fakeSupabase(() => {})

    await pollAndPersistProduction(supabase, 't1', 'row-1', 'job-1', [], { userId: 'u1' })

    expect(mockArchiveProductionIfNeeded).toHaveBeenCalledWith(supabase, 't1', 'u1', 'job-1', [], [])
    expect(mockReferenceVariantsToLibrary).not.toHaveBeenCalled()
    expect(mockToPermanentVariants).not.toHaveBeenCalled()
  })

  it('done SANS userId (ligne créée avant la migration user_id) : repli sur l\'URL permanente, pas d\'écriture Bibliothèque', async () => {
    mockGetProduction.mockResolvedValue({ status: 'done', variants: [] })
    const supabase = fakeSupabase(() => {})

    await pollAndPersistProduction(supabase, 't1', 'row-1', 'job-1', [])

    expect(mockArchiveProductionIfNeeded).not.toHaveBeenCalled()
    expect(mockReferenceVariantsToLibrary).not.toHaveBeenCalled()
    expect(mockToPermanentVariants).toHaveBeenCalled()
  })

  it('erreur Mishkāt : persiste status=error + le message', async () => {
    mockGetProduction.mockResolvedValue({ status: 'error', error: 'brand DNA introuvable' })
    let updated: unknown
    const supabase = fakeSupabase((p) => (updated = p))

    const { live } = await pollAndPersistProduction(supabase, 't1', 'row-1', 'job-1', [])

    expect(live.status).toBe('error')
    expect(updated).toMatchObject({ status: 'error', error_message: 'brand DNA introuvable' })
  })
})
