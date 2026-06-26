// ============================================================
// Mishkāt — Archivage des MP4 dans la bibliothèque du tenant (serveur)
// À réception d'une production `done`, on télécharge chaque variante (Bearer
// serveur) et on la stocke dans Supabase Storage `rami-media` + table
// media_assets → RAMI devient la source des archives vidéo (souverain).
// Idempotent : une variante déjà archivée (media_id présent) n'est pas re-fetchée.
// ============================================================

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchVariant } from './client'
import { log } from '@/lib/utils/logger'
import type { MishkatVariant } from './types'

const BUCKET = 'rami-media'

/** Variante enrichie après archivage (persistée dans video_productions.variants). */
export interface ArchivedVariant {
  lang: string
  format: string
  gatePassed: boolean
  url: string // URL Mishkāt d'origine (éphémère)
  media_id: string | null // id media_assets (archive RAMI permanente)
  public_url: string | null // URL RAMI servie au front
}

/** '16:9' → '16x9', '9:16' → '9x16'. */
export function aspectToToken(format: string): string {
  return format.replace(':', 'x')
}

/** Clé de stream Mishkāt : `<lang>-<format>.mp4` (ex. `fr-16x9.mp4`). */
export function variantKey(v: { lang: string; format: string }): string {
  return `${v.lang}-${aspectToToken(v.format)}.mp4`
}

function sameVariant(a: { lang: string; format: string }, b: { lang: string; format: string }): boolean {
  return a.lang === b.lang && a.format === b.format
}

/**
 * Archive les variantes manquantes et renvoie la liste enrichie (idempotent).
 * `existing` = variantes déjà persistées en DB (peuvent porter un media_id).
 */
export async function archiveProductionIfNeeded(
  supabase: SupabaseClient,
  tenantId: string,
  userId: string,
  jobId: string,
  liveVariants: MishkatVariant[],
  existing: ArchivedVariant[] = [],
): Promise<ArchivedVariant[]> {
  const result: ArchivedVariant[] = []

  for (const v of liveVariants) {
    const prior = existing.find((e) => sameVariant(e, v))
    if (prior?.media_id) {
      result.push(prior) // déjà archivée → on réutilise
      continue
    }

    try {
      const key = variantKey(v)
      const { buffer, mimeType } = await fetchVariant(jobId, key)
      const storagePath = `${tenantId}/videos/${jobId}/${key}`

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(storagePath, buffer, { contentType: mimeType || 'video/mp4', upsert: true })
      if (upErr) throw new Error(`upload: ${upErr.message}`)

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
      const publicUrl = urlData?.publicUrl ?? null

      const { data: inserted, error: insErr } = await supabase
        .from('media_assets')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          filename: key,
          original_filename: `mishkat-${jobId}-${key}`,
          file_type: 'video',
          mime_type: mimeType || 'video/mp4',
          file_size_bytes: buffer.length,
          storage_path: storagePath,
          public_url: publicUrl,
          metadata: { source: 'mishkat', job_id: jobId, lang: v.lang, format: v.format },
        })
        .select('id')
        .single()
      if (insErr) throw new Error(`insert: ${insErr.message}`)

      result.push({ lang: v.lang, format: v.format, gatePassed: v.gatePassed, url: v.url, media_id: inserted.id, public_url: publicUrl })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log({ level: 'error', module: 'mishkat', action: 'archive_variant_failed', tenant_id: tenantId, metadata: { jobId, lang: v.lang, format: v.format, error: message } })
      // Non bloquant : on garde la variante non archivée (front pourra réessayer au prochain poll)
      result.push({ lang: v.lang, format: v.format, gatePassed: v.gatePassed, url: v.url, media_id: null, public_url: null })
    }
  }

  return result
}
