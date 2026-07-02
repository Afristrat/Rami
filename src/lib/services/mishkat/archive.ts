// ============================================================
// Mishkāt — Variantes vidéo d'une production (serveur)
//
// CONTRAT 2026-06-28 : Mishkāt archive désormais lui-même. Chaque
// `variants[].url` renvoyé par GET /v1/productions/:id est une URL MinIO
// PUBLIQUE PERMANENTE (`https://s3-rami.ai-mpower.com/mishkat/...`, public-read,
// servable directement dans un <video src>). On persiste donc l'URL telle quelle
// (`toPermanentVariants`) — PLUS DE RE-DOWNLOAD requis.
//
// `archiveProductionIfNeeded` (ingestion binaire → bucket MinIO + media_assets)
// devient OPTIONNEL : uniquement une 2ᵉ copie de redondance souveraine, activée
// via l'env MISHKAT_ARCHIVE_REDUNDANT_COPY=true. Idempotent (media_id présent).
// ============================================================

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchVariant } from './client'
import { uploadToStorage, BUCKETS } from '@/lib/services/storage/client'
import { log } from '@/lib/utils/logger'
import type { MishkatVariant } from './types'

/** Variante persistée dans video_productions.variants. */
export interface ArchivedVariant {
  lang: string
  format: string
  gatePassed: boolean
  url: string // URL MinIO publique permanente renvoyée par Mishkāt
  media_id: string | null // id media_assets si copie de redondance archivée, sinon null
  public_url: string | null // URL servie au front (= url permanente par défaut)
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
 * Chemin par défaut (sans re-download) : Mishkāt archive lui-même, donc
 * `variants[].url` est une URL MinIO publique permanente. On la persiste telle
 * quelle (`public_url = url`). Une éventuelle copie de redondance déjà archivée
 * (media_id présent dans `existing`) est préservée.
 */
export function toPermanentVariants(
  liveVariants: MishkatVariant[],
  existing: ArchivedVariant[] = [],
): ArchivedVariant[] {
  return liveVariants.map((v) => {
    const prior = existing.find((e) => sameVariant(e, v))
    return {
      lang: v.lang,
      format: v.format,
      gatePassed: v.gatePassed,
      url: v.url,
      media_id: prior?.media_id ?? null,
      public_url: prior?.public_url ?? v.url,
    }
  })
}

/**
 * Référence les variantes terminées dans la Bibliothèque (media_assets) SANS
 * les re-télécharger : `public_url` = URL MinIO permanente déjà renvoyée par
 * Mishkāt (même pattern que `registerVisualsToLibraryAction` pour les visuels).
 * Idempotent (media_id déjà présent dans `existing` → réutilisé).
 *
 * Root cause corrigée (2026-07-02) : sans cet enregistrement, une production
 * vidéo terminée n'existait QUE dans `video_productions.variants` — jamais
 * dans `media_assets` — donc invisible dans /dashboard/library, quel que soit
 * l'appelant (route GET ou render-watch-worker).
 */
export async function referenceVariantsToLibrary(
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
      result.push(prior) // déjà référencée → idempotent
      continue
    }

    const key = variantKey(v)
    let pathname = v.url
    try {
      pathname = new URL(v.url).pathname.replace(/^\//, '')
    } catch {
      // URL non standard → on garde la valeur brute
    }

    try {
      const { data: inserted, error: insErr } = await supabase
        .from('media_assets')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          filename: key,
          original_filename: `mishkat-${jobId}-${key}`,
          file_type: 'video',
          mime_type: 'video/mp4',
          file_size_bytes: 0, // référence externe (MinIO) — taille non re-mesurée
          storage_path: pathname,
          public_url: v.url,
          metadata: { source: 'mishkat', external_storage: 'minio', job_id: jobId, lang: v.lang, format: v.format },
        })
        .select('id')
        .single()
      if (insErr) throw new Error(`insert: ${insErr.message}`)

      result.push({ lang: v.lang, format: v.format, gatePassed: v.gatePassed, url: v.url, media_id: inserted.id as string, public_url: v.url })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      log({ level: 'error', module: 'mishkat', action: 'reference_variant_failed', tenant_id: tenantId, metadata: { jobId, lang: v.lang, format: v.format, error: message } })
      // Non bloquant : la vidéo reste jouable/téléchargeable via l'URL permanente
      // même si son entrée Bibliothèque n'a pas pu être créée cette fois.
      result.push({ lang: v.lang, format: v.format, gatePassed: v.gatePassed, url: v.url, media_id: null, public_url: v.url })
    }
  }

  return result
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

      const { data: uploaded, error: upErr } = await uploadToStorage({
        bucket: BUCKETS.media,
        path: `${tenantId}/videos/${jobId}/${key}`,
        buffer,
        mimeType: mimeType || 'video/mp4',
      })
      if (upErr || !uploaded) throw new Error(`upload: ${upErr?.message ?? 'MinIO indisponible'}`)

      // `uploaded.path` = objectPath complet MinIO (ex. `media/<tenant>/videos/...`).
      const storagePath = uploaded.path
      const publicUrl = uploaded.publicUrl

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
