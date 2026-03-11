/**
 * Point d'entrée principal de la couche storage RAMI.
 *
 * Pipeline upload :
 *   1. Validation MIME (type + magic bytes + taille)
 *   2. Vérification quota tenant
 *   3. Redimensionnement si image (→ WebP)
 *   4. Upload Supabase Storage
 *   5. Enregistrement en DB (table media)
 */

import { validateMimeConsistency, isImageMime } from "./mime"
import { checkQuota, type Plan } from "./quota"
import { resizeImage, isResizableImage, type ResizePreset } from "./resize"
import {
  uploadToStorage,
  buildStoragePath,
  BUCKETS,
  type BucketName,
} from "./client"

export { BUCKETS, SIGNED_URL_TTL, createSignedUrl, deleteFromStorage } from "./client"
export { computeQuotaStatus, PLAN_STORAGE_QUOTAS, PLAN_LABELS, formatBytes } from "./quota"
export type { Plan, QuotaStatus } from "./quota"
export type { ResizePreset } from "./resize"
export type { BucketName } from "./client"

export interface StorageUploadParams {
  tenantId: string
  plan: Plan
  usedStorageBytes: number     // Utilisation actuelle (depuis DB)
  file: {
    buffer: Buffer | Uint8Array
    mimeType: string
    originalFilename: string
    sizeBytes: number
  }
  category?: string            // "posts" | "logos" | "audios" | "docs" — défaut "posts"
  resizePreset?: ResizePreset  // Défaut "post" pour les images
  upsert?: boolean
}

export interface StorageUploadResult {
  success: boolean
  error?: string
  asset?: {
    path: string
    bucket: BucketName
    publicUrl: string | null
    signedUrl: string | null
    mimeType: string
    sizeBytes: number
    width?: number
    height?: number
    compressionRatio?: number
    wasResized: boolean
  }
}

/**
 * Upload principal — orchestre validation + quota + resize + stockage.
 */
export async function uploadAsset(
  params: StorageUploadParams
): Promise<StorageUploadResult> {
  const { tenantId, plan, usedStorageBytes, file, category = "posts" } = params

  // ── 1. Validation MIME ──────────────────────────────────────────────────────
  const mimeValidation = validateMimeConsistency(
    file.mimeType,
    new Uint8Array(file.buffer)
  )

  if (!mimeValidation.valid) {
    return { success: false, error: mimeValidation.error }
  }

  // ── 2. Vérification quota ───────────────────────────────────────────────────
  const quotaCheck = checkQuota(plan, usedStorageBytes, file.sizeBytes)

  if (!quotaCheck.allowed) {
    return { success: false, error: quotaCheck.error }
  }

  // ── 3. Sélection du bucket ──────────────────────────────────────────────────
  const bucket = selectBucket(file.mimeType, category)

  // ── 4. Resize si image ──────────────────────────────────────────────────────
  let uploadBuffer: Buffer
  let finalMimeType: string = file.mimeType
  let resizeInfo: { width?: number; height?: number; compressionRatio?: number } = {}
  let wasResized = false

  if (isImageMime(file.mimeType) && isResizableImage(file.mimeType)) {
    try {
      const resized = await resizeImage(
        Buffer.from(file.buffer),
        { preset: params.resizePreset ?? "post" }
      )
      uploadBuffer = resized.buffer
      finalMimeType = "image/webp"
      resizeInfo = {
        width: resized.width,
        height: resized.height,
        compressionRatio: resized.compressionRatio,
      }
      wasResized = true
    } catch {
      // Fallback : upload sans resize si sharp échoue
      uploadBuffer = Buffer.from(file.buffer)
    }
  } else {
    uploadBuffer = Buffer.from(file.buffer)
  }

  // ── 5. Construction du chemin ───────────────────────────────────────────────
  const ext = wasResized ? "webp" : file.originalFilename.split(".").pop() ?? "bin"
  const baseFilename = file.originalFilename.replace(/\.[^/.]+$/, "")
  const storagePath = buildStoragePath(tenantId, category, `${baseFilename}.${ext}`)

  // ── 6. Upload ───────────────────────────────────────────────────────────────
  const { data, error } = await uploadToStorage({
    bucket,
    path: storagePath,
    buffer: uploadBuffer,
    mimeType: finalMimeType,
    upsert: params.upsert ?? false,
  })

  if (error || !data) {
    return {
      success: false,
      error: error?.message ?? "Erreur lors de l'upload. Veuillez réessayer.",
    }
  }

  return {
    success: true,
    asset: {
      path: data.path,
      bucket: data.bucket,
      publicUrl: data.publicUrl,
      signedUrl: data.signedUrl,
      mimeType: finalMimeType,
      sizeBytes: uploadBuffer.length,
      ...resizeInfo,
      wasResized,
    },
  }
}

/**
 * Sélectionne le bucket approprié selon le type MIME et la catégorie.
 */
function selectBucket(mimeType: string, category: string): BucketName {
  if (category === "logos") return BUCKETS.logos
  if (mimeType.startsWith("audio/") || mimeType.startsWith("video/")) return BUCKETS.audios
  if (mimeType === "application/pdf") return BUCKETS.docs
  return BUCKETS.media
}
