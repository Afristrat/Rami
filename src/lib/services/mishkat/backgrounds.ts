// ============================================================
// Mishkāt — Résolution des fonds de marque + logo (serveur)
// Les images viennent de la bibliothèque du tenant (table media_assets,
// objets stockés sur MinIO — bucket public `media`). On renvoie des URLs
// publiques (ou signées MinIO en repli) accessibles au rendu Mishkāt.
// ============================================================

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { BrandDnaFormData } from '@/lib/schemas/brand-dna.schema'
import { log } from '@/lib/utils/logger'
import {
  uploadToStorage,
  createSignedUrl,
  BUCKETS,
  SIGNED_URL_TTL,
} from '@/lib/services/storage/client'

/**
 * Résout des URLs signées pour les assets image sélectionnés, en conservant
 * l'ordre demandé. Un asset introuvable ou non-image est ignoré (non bloquant
 * → Mishkāt retombe sur son fond mesh souverain).
 */
export async function resolveBackgroundUrls(
  supabase: SupabaseClient,
  tenantId: string,
  assetIds: string[],
): Promise<string[]> {
  if (assetIds.length === 0) return []

  const { data, error } = await supabase
    .from('media_assets')
    .select('id, storage_path, public_url, file_type')
    .eq('tenant_id', tenantId)
    .in('id', assetIds)

  if (error || !data) {
    log({ level: 'warn', module: 'mishkat', action: 'backgrounds_query_failed', tenant_id: tenantId, metadata: { error: error?.message } })
    return []
  }

  const byId = new Map(data.map((row) => [row.id as string, row]))
  const urls: string[] = []

  for (const id of assetIds) {
    const row = byId.get(id)
    if (!row || row.file_type !== 'image') continue
    const signed = await signOrPublic(row.storage_path as string, row.public_url as string | null)
    if (signed) urls.push(signed)
  }
  return urls
}

/**
 * URL du logo pour BrandTokens. Le Brand DNA stocke souvent le logo en base64
 * (`logoDataUrl`) — inexploitable comme URL par le moteur de rendu. On l'héberge
 * alors dans MinIO (bucket public `media`, chemin stable `<tenant>/brand/logo.<ext>`)
 * et on renvoie son URL publique https. Un vrai lien http est renvoyé tel quel.
 * Renvoie '' si aucun logo exploitable → fallback souverain Mishkāt.
 */
export async function resolveLogoUrl(
  _supabase: SupabaseClient,
  tenantId: string,
  dna: BrandDnaFormData | null,
): Promise<string> {
  const logo = dna?.logoDataUrl
  if (!logo) return ''
  if (/^https?:\/\//i.test(logo)) return logo

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(logo)
  if (!match) return ''
  const mime = match[1]
  const ext = mime.split('/')[1]?.replace('svg+xml', 'svg').replace('jpeg', 'jpg') ?? 'png'
  // Chemin stable (sans timestamp) → upload idempotent par écrasement.
  const path = `${tenantId}/brand/logo.${ext}`

  try {
    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64')
    const { data, error } = await uploadToStorage({
      bucket: BUCKETS.media,
      path,
      buffer,
      mimeType: mime,
    })
    if (error || !data?.publicUrl) {
      log({ level: 'warn', module: 'mishkat', action: 'logo_upload_failed', tenant_id: tenantId, metadata: { error: error?.message } })
      return ''
    }
    return data.publicUrl
  } catch (err) {
    log({ level: 'warn', module: 'mishkat', action: 'logo_resolve_failed', tenant_id: tenantId, metadata: { error: err instanceof Error ? err.message : String(err) } })
    return ''
  }
}

/**
 * Renvoie une URL exploitable pour un asset MinIO : l'URL publique du bucket
 * `media` (public) si présente, sinon une URL signée MinIO fraîche (TTL 7 j).
 */
async function signOrPublic(
  storagePath: string,
  publicUrl: string | null,
): Promise<string | null> {
  if (publicUrl) return publicUrl
  const { url } = await createSignedUrl(storagePath, SIGNED_URL_TTL.long)
  return url
}
