// ============================================================
// Phase 2 vidéo — orchestration v2 (worker pg-boss).
// Mishkāt / génération images / DB mockés : on teste la séquence
// storyboard → images → rendu, l'idempotence et la gestion d'erreur.
// ============================================================

const mockGetProduction = jest.fn()
const mockCreateProduction = jest.fn()
const mockGenerateSceneImages = jest.fn()
const mockUpdate = jest.fn((..._a: unknown[]) => updateChain)
let mockRow: { data: unknown } = { data: null }

// Chaîne d'update : .update(...).eq(...).eq(...) → résout (thenable).
const updateChain: Record<string, unknown> = {}
for (const m of ['eq']) updateChain[m] = () => updateChain
updateChain.then = (r: (v: unknown) => void) => r({ error: null })

jest.mock('@/lib/supabase/service', () => {
  const selectChain: Record<string, unknown> = {}
  for (const m of ['select', 'eq']) selectChain[m] = () => selectChain
  selectChain.maybeSingle = async () => mockRow
  const client = {
    from: () => ({
      select: () => selectChain,
      update: (...a: unknown[]) => mockUpdate(...a),
    }),
  }
  return { createServiceClient: () => client }
})
jest.mock('@/lib/services/mishkat/client', () => ({
  getProduction: (...a: unknown[]) => mockGetProduction(...a),
  createProduction: (...a: unknown[]) => mockCreateProduction(...a),
}))
jest.mock('@/lib/services/mishkat/scene-images', () => ({
  generateSceneImages: (...a: unknown[]) => mockGenerateSceneImages(...a),
}))
// pgboss importe le module ESM `pg-boss` (non transformé par Jest) ; le cœur
// testé (processSceneVideoJob) ne s'en sert pas → on neutralise l'import.
const mockEnqueueRenderWatch = jest.fn()
jest.mock('@/lib/queue/pgboss', () => ({
  getBoss: jest.fn(),
  JOBS: { SCENE_VIDEO: 'scene-video' },
  enqueueRenderWatch: (...a: unknown[]) => mockEnqueueRenderWatch(...a),
}))

import { processSceneVideoJob } from '@/lib/queue/scene-video-worker'

const baseRow = {
  mishkat_job_id: 'sb-1',
  brief: { brand_id: 'rami', channel_format: [{ channel: 'youtube', aspect: '16:9' }] },
  brand_snapshot: { brand_id: 'rami' },
  render_job_id: null,
  status: 'generating',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRow = { data: { ...baseRow } }
  mockGenerateSceneImages.mockResolvedValue({ sceneImages: { s1: 'https://minio/s1.webp' }, skipped: [] })
  mockCreateProduction.mockResolvedValue({ id: 'render-1', status: 'queued' })
})

describe('processSceneVideoJob', () => {
  it('storyboard prêt → génère images → lance le rendu → enregistre render_job_id', async () => {
    mockGetProduction.mockResolvedValue({ status: 'generating', storyboard: { scenes: [{ id: 's1', image_prompt: 'x' }] } })

    await processSceneVideoJob('row-1', 't1')

    expect(mockGenerateSceneImages).toHaveBeenCalledWith('t1', { scenes: [{ id: 's1', image_prompt: 'x' }] }, '16:9')
    expect(mockCreateProduction).toHaveBeenCalledWith(expect.objectContaining({ sceneImages: { s1: 'https://minio/s1.webp' } }))
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ render_job_id: 'render-1', status: 'rendering' }))
    // Root cause 2026-07-02 : le rendu doit être suivi côté serveur, indépendamment
    // du polling navigateur (cf. render-watch-worker.ts).
    expect(mockEnqueueRenderWatch).toHaveBeenCalledWith({ productionRowId: 'row-1', tenantId: 't1', mishkatJobId: 'render-1' })
  })

  it('idempotent : render_job_id déjà présent → ne relance pas de rendu', async () => {
    mockRow = { data: { ...baseRow, render_job_id: 'render-déjà' } }
    await processSceneVideoJob('row-1', 't1')
    expect(mockCreateProduction).not.toHaveBeenCalled()
    expect(mockGenerateSceneImages).not.toHaveBeenCalled()
    expect(mockEnqueueRenderWatch).not.toHaveBeenCalled()
  })

  it('storyboard en erreur → marque la production en erreur et relance (throw)', async () => {
    mockGetProduction.mockResolvedValue({ status: 'error', error: 'concept invalide' })
    await expect(processSceneVideoJob('row-1', 't1')).rejects.toThrow('concept invalide')
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'error' }))
    expect(mockCreateProduction).not.toHaveBeenCalled()
    expect(mockEnqueueRenderWatch).not.toHaveBeenCalled()
  })

  it('ligne introuvable → ne fait rien (pas de rendu)', async () => {
    mockRow = { data: null }
    await processSceneVideoJob('row-x', 't1')
    expect(mockCreateProduction).not.toHaveBeenCalled()
  })
})
