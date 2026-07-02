// ============================================================
// render-watch-worker — suivi de fond d'un rendu Mishkāt, indépendant du
// navigateur. Root cause corrigée (2026-07-02) : sans ce worker, un timeout
// client (POLL_TIMEOUT_MS) avant la fin réelle du rendu (~7-8 min observés)
// laissait `video_productions.status` bloqué sur `rendering` pour toujours.
// ============================================================

jest.useFakeTimers()

const mockPollAndPersist = jest.fn()
const mockUpdate = jest.fn((..._a: unknown[]) => updateChain)
let mockRow: { data: unknown } = { data: null }

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
jest.mock('@/lib/services/mishkat/finalize', () => ({
  pollAndPersistProduction: (...a: unknown[]) => mockPollAndPersist(...a),
}))
// pgboss importe le module ESM `pg-boss` (non transformé par Jest) ; le cœur
// testé (processRenderWatchJob) ne s'en sert pas → on neutralise l'import.
jest.mock('@/lib/queue/pgboss', () => ({ getBoss: jest.fn(), JOBS: { RENDER_WATCH: 'render-watch' } }))

import { processRenderWatchJob } from '@/lib/queue/render-watch-worker'

const basePayload = { productionRowId: 'row-1', tenantId: 't1', mishkatJobId: 'render-1' }

beforeEach(() => {
  jest.clearAllMocks()
  mockRow = { data: { variants: [], status: 'rendering', user_id: 'user-1' } }
})

// Fait avancer les timers pas à pas tant que la promesse n'est pas résolue
// (le worker boucle via setTimeout réel neutralisé par les fake timers).
async function drain(promise: Promise<void>, steps = 20): Promise<void> {
  let done = false
  void promise.then(() => (done = true))
  for (let i = 0; i < steps && !done; i++) {
    await jest.advanceTimersByTimeAsync(10_000)
  }
  await promise
}

describe('processRenderWatchJob', () => {
  it('convergence immédiate vers done → un seul poll, pas de boucle, userId de la ligne transmis', async () => {
    mockPollAndPersist.mockResolvedValue({ live: { status: 'done' } })
    await drain(processRenderWatchJob(basePayload))
    expect(mockPollAndPersist).toHaveBeenCalledTimes(1)
    // Root cause 2026-07-02 (bis) : sans userId, le worker ne peut pas référencer
    // la vidéo terminée dans la Bibliothèque (cf. finalize.ts).
    expect(mockPollAndPersist).toHaveBeenCalledWith(expect.anything(), 't1', 'row-1', 'render-1', [], { userId: 'user-1' })
  })

  it('ligne sans user_id (créée avant la migration) : opts sans userId, pas de crash', async () => {
    mockRow = { data: { variants: [], status: 'rendering', user_id: null } }
    mockPollAndPersist.mockResolvedValue({ live: { status: 'done' } })
    await drain(processRenderWatchJob(basePayload))
    expect(mockPollAndPersist).toHaveBeenCalledWith(expect.anything(), 't1', 'row-1', 'render-1', [], {})
  })

  it('convergence vers error → un seul poll', async () => {
    mockPollAndPersist.mockResolvedValue({ live: { status: 'error' } })
    await drain(processRenderWatchJob(basePayload))
    expect(mockPollAndPersist).toHaveBeenCalledTimes(1)
  })

  it('plusieurs statuts intermédiaires avant done → boucle jusqu\'à convergence', async () => {
    mockPollAndPersist
      .mockResolvedValueOnce({ live: { status: 'rendering' } })
      .mockResolvedValueOnce({ live: { status: 'rendering' } })
      .mockResolvedValueOnce({ live: { status: 'done' } })
    await drain(processRenderWatchJob(basePayload))
    expect(mockPollAndPersist).toHaveBeenCalledTimes(3)
  })

  it('erreur transitoire (réseau) : continue de boucler plutôt que d\'abandonner', async () => {
    mockPollAndPersist
      .mockRejectedValueOnce(new Error('502'))
      .mockResolvedValueOnce({ live: { status: 'done' } })
    await drain(processRenderWatchJob(basePayload))
    expect(mockPollAndPersist).toHaveBeenCalledTimes(2)
  })

  it('ligne déjà finalisée (done) : ne poll pas Mishkāt', async () => {
    mockRow = { data: { variants: [], status: 'done' } }
    await processRenderWatchJob(basePayload)
    expect(mockPollAndPersist).not.toHaveBeenCalled()
  })

  it('ligne introuvable : ne poll pas Mishkāt', async () => {
    mockRow = { data: null }
    await processRenderWatchJob(basePayload)
    expect(mockPollAndPersist).not.toHaveBeenCalled()
  })

  it('budget de suivi dépassé sans convergence → marque status=error explicite', async () => {
    mockPollAndPersist.mockResolvedValue({ live: { status: 'rendering' } })
    await drain(processRenderWatchJob(basePayload), 120) // dépasse MAX_WATCH_MS (18 min / 10s = 108 polls)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'error', error_message: expect.stringContaining('Délai de suivi dépassé') }),
    )
  })
})
