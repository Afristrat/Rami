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
 * URL du logo pour BrandTokens. Le Brand DNA stocke le logo en base64
 * (`logoDataUrl`), inexploitable comme URL → on ne renvoie une URL que si
 * un vrai lien http est présent. Sinon '' → fallback souverain Mishkāt.
 */
export async function resolveLogoUrl(
  _supabase: SupabaseClient,
  _tenantId: string,
  dna: BrandDnaFormData | null,
): Promise<string> {
  const logo = dna?.logoDataUrl
  if (logo && /^https?:\/\//i.test(logo)) return logo
  return ''
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
