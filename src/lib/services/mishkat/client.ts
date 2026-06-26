// ============================================================
// Mishkāt — Client serveur (wrapper HTTP typé)
// La clé MISHKAT_API_KEY ne transite JAMAIS côté client : ce module
// est `server-only`. Tout appel passe par le Bearer serveur.
// ============================================================

import 'server-only'

import type {
  MishkatBrief,
  BrandTokens,
  MishkatProduction,
  MishkatCreateResponse,
  MishkatStoryboard,
} from './types'

export class MishkatConfigError extends Error {
  constructor(message = 'MISHKAT_API_KEY non configurée') {
    super(message)
    this.name = 'MishkatConfigError'
  }
}

export class MishkatApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'MishkatApiError'
    this.status = status
  }
}

function cfg(): { key: string; base: string } {
  const key = process.env.MISHKAT_API_KEY
  if (!key) throw new MishkatConfigError()
  const base = process.env.MISHKAT_API_BASE_URL ?? 'https://mishkat.ai-mpower.com'
  return { key, base }
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const { key, base } = cfg()
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    throw new MishkatApiError(`Mishkāt ${path} → HTTP ${res.status}`, res.status)
  }
  return (await res.json()) as T
}

export interface CreateProductionBody {
  brief: MishkatBrief
  brand?: BrandTokens
  storyboard?: MishkatStoryboard
  sceneImages?: Record<string, string>
}

/** POST /v1/productions → 202 { id, status }. */
export function createProduction(body: CreateProductionBody): Promise<MishkatCreateResponse> {
  return call<MishkatCreateResponse>('/v1/productions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** POST /v1/storyboards → 202 { id } (flux v2, étape 1). */
export function createStoryboard(body: { brief: MishkatBrief; brand?: BrandTokens }): Promise<{ id: string }> {
  return call<{ id: string }>('/v1/storyboards', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/** GET /v1/productions/:id → statut + storyboard/variants éventuels. */
export function getProduction(id: string): Promise<MishkatProduction> {
  return call<MishkatProduction>(`/v1/productions/${encodeURIComponent(id)}`, { method: 'GET' })
}

/**
 * GET /v1/productions/:id/variants/:key → stream MP4 (ex. `fr-16x9.mp4`).
 * Réservé à l'archivage serveur (récupère le binaire avec le Bearer).
 */
export async function fetchVariant(id: string, variantKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const { key, base } = cfg()
  const res = await fetch(
    `${base}/v1/productions/${encodeURIComponent(id)}/variants/${encodeURIComponent(variantKey)}`,
    { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store' },
  )
  if (!res.ok) {
    throw new MishkatApiError(`Mishkāt variant ${variantKey} → HTTP ${res.status}`, res.status)
  }
  const bytes = new Uint8Array(await res.arrayBuffer())
  return { buffer: Buffer.from(bytes), mimeType: res.headers.get('content-type') ?? 'video/mp4' }
}
