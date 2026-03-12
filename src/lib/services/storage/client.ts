/**
 * Client MinIO — Self-hosted sur cloud-station.io
 * S3-compatible. Usage serveur uniquement (jamais côté client).
 *
 * Variables requises :
 *   MINIO_ENDPOINT    = endpoint API S3 (ex: https://cst-minio-xxx.cloud-station.io)
 *   MINIO_PUBLIC_URL  = URL CDN publique pour les fichiers publics
 *   MINIO_ACCESS_KEY  = MINIO_ROOT_USER
 *   MINIO_SECRET_KEY  = MINIO_ROOT_PASSWORD
 *   MINIO_BUCKET      = nom du bucket (ex: cloudstation)
 */

import { Client as MinioClient } from "minio"

// ── Buckets (préfixes dans le bucket MinIO unique)
export const BUCKETS = {
  logos:  "logos",
  media:  "media",
  audios: "audios",
  docs:   "docs",
} as const

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS]

// Alias pour rétro-compatibilité
export const STORAGE_PREFIXES = BUCKETS
export type StoragePrefix = BucketName

// ── TTL URLs présignées (secondes)
export const SIGNED_URL_TTL = {
  short:  60 * 60,
  medium: 60 * 60 * 24,
  long:   60 * 60 * 24 * 7,
} as const

const PUBLIC_BUCKETS: BucketName[] = [BUCKETS.logos, BUCKETS.media]

// ── Singleton client MinIO
let _client: MinioClient | null = null

function getMinioClient(): MinioClient {
  if (_client) return _client

  const endpoint = process.env.MINIO_ENDPOINT
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error("Variables MinIO manquantes : MINIO_ENDPOINT, MINIO_ACCESS_KEY, MINIO_SECRET_KEY")
  }

  const url = new URL(endpoint)

  _client = new MinioClient({
    endPoint: url.hostname,
    port: url.port ? parseInt(url.port) : (url.protocol === "https:" ? 443 : 80),
    useSSL: url.protocol === "https:",
    accessKey,
    secretKey,
  })

  return _client
}

function getMinioBucket(): string {
  const bucket = process.env.MINIO_BUCKET
  if (!bucket) throw new Error("Variable MINIO_BUCKET manquante")
  return bucket
}

function getPublicUrl(objectPath: string): string {
  const base = (process.env.MINIO_PUBLIC_URL ?? process.env.MINIO_ENDPOINT ?? "").replace(/\/$/, "")
  const bucket = getMinioBucket()
  return `${base}/${bucket}/${objectPath}`
}

// ── Types

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
 * Upload un Buffer vers MinIO.
 * Accepte `bucket` ou `prefix` (rétro-compatibilité).
 */
export async function uploadToStorage(params: {
  bucket?: BucketName
  prefix?: BucketName
  path: string
  buffer: Buffer
  mimeType: string
  upsert?: boolean
}): Promise<{ data: UploadResult | null; error: StorageError | null }> {
  try {
    const client = getMinioClient()
    const minioBucket = getMinioBucket()
    const prefix = params.bucket ?? params.prefix ?? BUCKETS.media
    const objectPath = `${prefix}/${params.path}`

    await client.putObject(minioBucket, objectPath, params.buffer, params.buffer.length, {
      "Content-Type": params.mimeType,
    })

    const isPublic = PUBLIC_BUCKETS.includes(prefix)
    let publicUrl: string | null = null
    let signedUrl: string | null = null

    if (isPublic) {
      publicUrl = getPublicUrl(objectPath)
    } else {
      signedUrl = await client.presignedGetObject(minioBucket, objectPath, SIGNED_URL_TTL.long)
    }

    return {
      data: {
        path: objectPath,
        publicUrl,
        signedUrl,
        bucket: prefix,
        sizeBytes: params.buffer.length,
      },
      error: null,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur MinIO inconnue"
    return { data: null, error: { message } }
  }
}

/**
 * Supprime un fichier de MinIO.
 * Accepte (bucket, path) ou (objectPath) pour rétro-compatibilité.
 */
export async function deleteFromStorage(
  bucketOrPath: BucketName | string,
  path?: string
): Promise<{ error: StorageError | null }> {
  try {
    const client = getMinioClient()
    const minioBucket = getMinioBucket()
    const objectPath = path ? `${bucketOrPath}/${path}` : bucketOrPath
    await client.removeObject(minioBucket, objectPath)
    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur suppression MinIO"
    return { error: { message } }
  }
}

/**
 * Génère une URL présignée fraîche.
 * Accepte (bucket, path, ttl) ou (objectPath, ttl) pour rétro-compatibilité.
 */
export async function createSignedUrl(
  bucketOrPath: BucketName | string,
  pathOrTtl?: string | number,
  ttlSeconds?: number
): Promise<{ url: string | null; error: StorageError | null }> {
  try {
    const client = getMinioClient()
    const minioBucket = getMinioBucket()

    let objectPath: string
    let ttl: number

    if (typeof pathOrTtl === "string") {
      // Signature (bucket, path, ttl)
      objectPath = `${bucketOrPath}/${pathOrTtl}`
      ttl = ttlSeconds ?? SIGNED_URL_TTL.medium
    } else {
      // Signature (objectPath, ttl)
      objectPath = bucketOrPath
      ttl = pathOrTtl ?? SIGNED_URL_TTL.medium
    }

    const url = await client.presignedGetObject(minioBucket, objectPath, ttl)
    return { url, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur URL présignée MinIO"
    return { url: null, error: { message } }
  }
}

/**
 * Construit le chemin de stockage normalisé pour un tenant.
 * Accepte 2 ou 3 arguments pour rétro-compatibilité.
 */
export function buildStoragePath(
  tenantId: string,
  categoryOrFilename: string,
  filename?: string
): string {
  const timestamp = Date.now()
  const rawFilename = filename ?? categoryOrFilename
  const safe = rawFilename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100)

  return `${tenantId}/${timestamp}-${safe}`
}

/**
 * Calcule l'utilisation storage d'un tenant (liste les objets par préfixe).
 */
export async function getTenantStorageUsage(
  tenantId: string
): Promise<{ usedBytes: number; fileCount: number; error: StorageError | null }> {
  try {
    const client = getMinioClient()
    const minioBucket = getMinioBucket()
    let totalBytes = 0
    let totalFiles = 0

    for (const prefix of Object.values(BUCKETS)) {
      const stream = client.listObjects(minioBucket, `${prefix}/${tenantId}/`, true)

      await new Promise<void>((resolve, reject) => {
        stream.on("data", (obj) => {
          if (obj.size) {
            totalBytes += obj.size
            totalFiles++
          }
        })
        stream.on("end", resolve)
        stream.on("error", reject)
      })
    }

    return { usedBytes: totalBytes, fileCount: totalFiles, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur liste MinIO"
    return { usedBytes: 0, fileCount: 0, error: { message } }
  }
}
