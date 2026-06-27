// ============================================================
// Mishkāt — Résolution des fonds de marque + logo (serveur)
// Les images viennent de la bibliothèque du tenant (table media_assets,
// bucket Supabase Storage `rami-media`). On produit des URLs signées
// (TTL 7 j) publiquement accessibles au rendu Mishkāt.
// ============================================================

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { BrandDnaFormData } from '@/lib/schemas/brand-dna.schema'
import { log } from '@/lib/utils/logger'

const BUCKET = 'rami-media'
const SIGNED_TTL = 60 * 60 * 24 * 7 // 7 jours

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
    const signed = await signOrPublic(supabase, row.storage_path as string, row.public_url as string | null)
    if (signed) urls.push(signed)
  }
  return urls
}

/**
 * URL du logo pour BrandTokens. Le Brand DNA stocke souvent le logo en base64
 * (`logoDataUrl`) — inexploitable comme URL par le moteur de rendu. On l'héberge
 * alors une seule fois dans `rami-media` (`<tenant>/brand/logo.<ext>`) et on
 * renvoie son URL publique https. Un vrai lien http est renvoyé tel quel.
 * Renvoie '' si aucun logo exploitable → fallback souverain Mishkāt.
 */
export async function resolveLogoUrl(
  supabase: SupabaseClient,
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
  const dir = `${tenantId}/brand`
  const path = `${dir}/logo.${ext}`

  try {
    // Idempotence : ne ré-uploader que si l'objet n'existe pas déjà.
    const { data: listed } = await supabase.storage.from(BUCKET).list(dir)
    const exists = listed?.some((f) => f.name === `logo.${ext}`)
    if (!exists) {
      const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64')
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, { contentType: mime, upsert: true })
      if (error) {
        log({ level: 'warn', module: 'mishkat', action: 'logo_upload_failed', tenant_id: tenantId, metadata: { error: error.message } })
        return ''
      }
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return data?.publicUrl ?? ''
  } catch (err) {
    log({ level: 'warn', module: 'mishkat', action: 'logo_resolve_failed', tenant_id: tenantId, metadata: { error: err instanceof Error ? err.message : String(err) } })
    return ''
  }
}

async function signOrPublic(
  supabase: SupabaseClient,
  storagePath: string,
  publicUrl: string | null,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_TTL)
    if (!error && data?.signedUrl) return data.signedUrl
  } catch {
    // ignore — on retombe sur l'URL publique
  }
  return publicUrl
}
