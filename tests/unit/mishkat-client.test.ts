import { createProduction, getProduction, MishkatConfigError } from '@/lib/services/mishkat/client'
import type { MishkatBrief } from '@/lib/services/mishkat/types'

const DUMMY_BRIEF = { brand_id: 'rami' } as unknown as MishkatBrief
const originalEnv = process.env

beforeEach(() => {
  process.env = { ...originalEnv, MISHKAT_API_KEY: 'test-key', MISHKAT_API_BASE_URL: 'https://m.test' }
})
afterEach(() => {
  process.env = originalEnv
  jest.restoreAllMocks()
})

describe('Mishkāt client', () => {
  it('envoie le Bearer + Content-Type et parse 202 { id, status }', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: 'job-1', status: 'queued' }), { status: 202 }),
    )
    const res = await createProduction({ brief: DUMMY_BRIEF })
    expect(res).toEqual({ id: 'job-1', status: 'queued' })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://m.test/v1/productions')
    expect(init?.method).toBe('POST')
    const headers = init?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer test-key')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('lève MishkatConfigError quand la clé est absente', async () => {
    delete process.env.MISHKAT_API_KEY
    await expect(createProduction({ brief: DUMMY_BRIEF })).rejects.toBeInstanceOf(MishkatConfigError)
  })

  it('getProduction relaie le statut', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ status: 'done', variants: [] }), { status: 200 }),
    )
    const p = await getProduction('job-1')
    expect(p.status).toBe('done')
  })

  it('jette MishkatApiError sur HTTP non-2xx', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('nope', { status: 500 }))
    await expect(getProduction('job-x')).rejects.toMatchObject({ status: 500 })
  })
})
