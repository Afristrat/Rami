/**
 * Client Supabase Storage.
 * Centralise toutes les opérations sur les buckets.
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Buckets Supabase
export const BUCKETS = {
  media:  "media",     // Images et vidéos des posts (accès public via CDN)
  logos:  "logos",     // Logos tenant (accès public)
  audios: "audios",    // Transcriptions audio (accès privé, URL signée)
  docs:   "docs",      // Documents PDF (accès privé, URL signée)
} as const

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS]

// Durée de validité des URLs signées (secondes)
export const SIGNED_URL_TTL = {
  short:   60 * 60,          //  1 heure  (preview)
  medium:  60 * 60 * 24,     // 24 heures (partage)
  long:    60 * 60 * 24 * 7, //  7 jours  (publication)
} as const

/**
 * Crée un client Supabase avec service role pour les opérations storage.
 * JAMAIS exposé côté client — usage serveur uniquement.
 */
function getStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error("Variables Supabase manquantes : NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY")
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}

export interface UploadResult {
  path: string
  publicUrl: string | null
  signedUrl: string | null
  bucket: BucketName
  sizeBytes: number
}

export interface StorageError {
  message: string
  code?: string
}

/**
 * Upload un fichier vers un bucket Supabase Storage.
 * Retourne l'URL publique pour les buckets publics, l'URL signée pour les privés.
 */
export async function uploadToStorage(params: {
  bucket: BucketName
  path: string           // Ex: "tenant-uuid/filename.webp"
  buffer: Buffer
  mimeType: string
  upsert?: boolean
}): Promise<{ data: UploadResult | null; error: StorageError | null }> {
  const client = getStorageClient()

  const { data, error } = await client.storage
    .from(params.bucket)
    .upload(params.path, params.buffer, {
      contentType: params.mimeType,
      upsert: params.upsert ?? false,
    })

  if (error) {
    return { data: null, error: { message: error.message, code: error.name } }
  }

  const isPublicBucket = params.bucket === BUCKETS.media || params.bucket === BUCKETS.logos

  let publicUrl: string | null = null
  let signedUrl: string | null = null

  if (isPublicBucket) {
    const { data: urlData } = client.storage
      .from(params.bucket)
      .getPublicUrl(data.path)
    publicUrl = urlData.publicUrl
  } else {
    const { data: signedData, error: signError } = await client.storage
      .from(params.bucket)
      .createSignedUrl(data.path, SIGNED_URL_TTL.long)
    if (!signError && signedData) {
      signedUrl = signedData.signedUrl
    }
  }

  return {
    data: {
      path: data.path,
      publicUrl,
      signedUrl,
      bucket: params.bucket,
      sizeBytes: params.buffer.length,
    },
    error: null,
  }
}

/**
 * Supprime un fichier du storage.
 */
export async function deleteFromStorage(
  bucket: BucketName,
  path: string
): Promise<{ error: StorageError | null }> {
  const client = getStorageClient()

  const { error } = await client.storage.from(bucket).remove([path])

  if (error) {
    return { error: { message: error.message, code: error.name } }
  }

  return { error: null }
}

/**
 * Génère une URL signée fraîche pour un fichier privé.
 */
export async function createSignedUrl(
  bucket: BucketName,
  path: string,
  ttlSeconds: number = SIGNED_URL_TTL.medium
): Promise<{ url: string | null; error: StorageError | null }> {
  const client = getStorageClient()

  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, ttlSeconds)

  if (error) {
    return { url: null, error: { message: error.message } }
  }

  return { url: data.signedUrl, error: null }
}

/**
 * Calcule l'utilisation storage d'un tenant en listant ses fichiers.
 */
export async function getTenantStorageUsage(
  tenantId: string
): Promise<{ usedBytes: number; fileCount: number; error: StorageError | null }> {
  const client = getStorageClient()

  let totalBytes = 0
  let totalFiles = 0

  for (const bucket of Object.values(BUCKETS)) {
    const { data, error } = await client.storage
      .from(bucket)
      .list(tenantId, { limit: 1000 })

    if (error) {
      // Bucket non créé encore — ignorer
      continue
    }

    for (const file of data ?? []) {
      if (file.metadata?.size) {
        totalBytes += file.metadata.size as number
        totalFiles++
      }
    }
  }

  return { usedBytes: totalBytes, fileCount: totalFiles, error: null }
}

/**
 * Construit le chemin de stockage normalisé pour un tenant.
 * Format : {tenantId}/{category}/{timestamp}-{sanitizedFilename}
 */
export function buildStoragePath(
  tenantId: string,
  category: string,
  filename: string
): string {
  const timestamp = Date.now()
  // Sanitisation : alphanumeric + tirets + points uniquement
  const safe = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)

  return `${tenantId}/${category}/${timestamp}-${safe}`
}
