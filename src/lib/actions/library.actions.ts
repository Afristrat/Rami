"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import {
  uploadToStorage,
  deleteFromStorage,
  buildStoragePath,
  BUCKETS,
} from "@/lib/services/storage/client"

export type MediaFileType = "image" | "video" | "document"

export interface MediaAsset {
  id: string
  filename: string
  originalFilename: string
  fileType: MediaFileType
  mimeType: string
  fileSizeBytes: number
  storagePath: string
  publicUrl: string | null
  thumbnailUrl: string | null
  metadata: Record<string, unknown>
  createdAt: string
  /** Score Brand DNA Vision AI (0-100) — présent uniquement pour les visuels générés par RAMI.
   * Null si l'asset n'a pas été évalué (upload manuel, pas de scoring Vision AI). */
  brandDnaScore: number | null
}

export type GetMediaResult =
  | { data: MediaAsset[]; total: number }
  | { error: string }

export type UploadMediaResult =
  | { data: MediaAsset }
  | { error: string }

export type DeleteMediaResult =
  | { success: true }
  | { error: string }

const ALLOWED_MIME_TYPES: Record<MediaFileType, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
  ],
}

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MB

function detectFileType(mimeType: string): MediaFileType | null {
  for (const [type, mimes] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (mimes.includes(mimeType)) return type as MediaFileType
  }
  return null
}


/**
 * Liste les assets média du tenant avec filtres optionnels.
 */
export async function getMediaAssetsAction(options?: {
  fileType?: MediaFileType | "all"
  search?: string
  limit?: number
  offset?: number
}): Promise<GetMediaResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)

  if (!tenantId) return { error: "Tenant introuvable." }

  const limit = options?.limit ?? 100
  const offset = options?.offset ?? 0

  let query = supabase
    .from("media_assets")
    .select("*", { count: "exact" })
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.fileType && options.fileType !== "all") {
    query = query.eq("file_type", options.fileType)
  }

  if (options?.search?.trim()) {
    query = query.ilike("original_filename", `%${options.search.trim()}%`)
  }

  const { data, error, count } = await query

  if (error) {
    // Table absente (pas encore migrée) — retourner liste vide
    if (error.code === "42P01") return { data: [], total: 0 }
    return { error: "Erreur lors du chargement des médias." }
  }

  const assets: MediaAsset[] = (data ?? []).map((row) => {
    const meta = (row.metadata as Record<string, unknown>) ?? {}
    // brand_dna_score est stocké dans metadata.brand_dna_score par
    // registerVisualsToLibraryAction / registerLibraryAsset (0-100, scoring Vision AI)
    const rawScore = meta.brand_dna_score
    const brandDnaScore: number | null =
      typeof rawScore === "number" && isFinite(rawScore)
        ? Math.round(rawScore)
        : null
    return {
      id: row.id,
      filename: row.filename,
      originalFilename: row.original_filename,
      fileType: row.file_type as MediaFileType,
      mimeType: row.mime_type,
      fileSizeBytes: row.file_size_bytes,
      storagePath: row.storage_path,
      publicUrl: row.public_url,
      thumbnailUrl: row.thumbnail_url,
      metadata: meta,
      createdAt: row.created_at,
      brandDnaScore,
    }
  })

  return { data: assets, total: count ?? 0 }
}

/**
 * Upload un fichier dans Supabase Storage et enregistre en DB.
 * Reçoit un FormData avec le champ "file".
 */
export async function uploadMediaAssetAction(
  formData: FormData
): Promise<UploadMediaResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)

  if (!tenantId) return { error: "Tenant introuvable." }

  const file = formData.get("file") as File | null
  if (!file) return { error: "Aucun fichier fourni." }

  // Validation taille
  if (file.size > MAX_FILE_SIZE) {
    return { error: `Fichier trop volumineux. Limite : ${MAX_FILE_SIZE / 1024 / 1024} MB.` }
  }

  // Validation type MIME
  const fileType = detectFileType(file.type)
  if (!fileType) {
    return { error: `Type de fichier non supporté : ${file.type}.` }
  }

  // Upload vers MinIO (bucket public `media`)
  const buffer = Buffer.from(await file.arrayBuffer())
  const { data: uploaded, error: uploadError } = await uploadToStorage({
    bucket: BUCKETS.media,
    path: buildStoragePath(tenantId, file.name),
    buffer,
    mimeType: file.type,
  })

  if (uploadError || !uploaded) {
    return { error: `Erreur d'upload : ${uploadError?.message ?? "MinIO indisponible"}` }
  }

  // `uploaded.path` = objectPath complet MinIO (ex. `media/<tenant>/...`)
  const storagePath = uploaded.path
  const publicUrl = uploaded.publicUrl

  // Insertion en DB
  const { data: inserted, error: insertError } = await supabase
    .from("media_assets")
    .insert({
      tenant_id: tenantId,
      user_id: user.id,
      filename: storagePath.split("/").pop() ?? file.name,
      original_filename: file.name,
      file_type: fileType,
      mime_type: file.type,
      file_size_bytes: file.size,
      storage_path: storagePath,
      public_url: publicUrl,
      metadata: { external_storage: "minio" },
    })
    .select()
    .single()

  if (insertError) {
    // Nettoyage storage si la DB échoue
    await deleteFromStorage(storagePath)
    return { error: "Erreur lors de l'enregistrement du fichier." }
  }

  revalidatePath("/dashboard/library")

  return {
    data: {
      id: inserted.id,
      filename: inserted.filename,
      originalFilename: inserted.original_filename,
      fileType: inserted.file_type as MediaFileType,
      mimeType: inserted.mime_type,
      fileSizeBytes: inserted.file_size_bytes,
      storagePath: inserted.storage_path,
      publicUrl: inserted.public_url,
      thumbnailUrl: inserted.thumbnail_url,
      metadata: (inserted.metadata as Record<string, unknown>) ?? {},
      createdAt: inserted.created_at,
      // Les uploads manuels n'ont pas de scoring Vision AI
      brandDnaScore: null,
    },
  }
}

/**
 * Supprime un asset média (DB + Storage).
 */
export async function deleteMediaAssetAction(id: string): Promise<DeleteMediaResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  // Récupérer le storage_path avant suppression
  const { data: asset, error: fetchError } = await supabase
    .from("media_assets")
    .select("id, storage_path, tenant_id")
    .eq("id", id)
    .single()

  if (fetchError || !asset) return { error: "Fichier introuvable." }

  // Suppression Storage MinIO (best-effort : on continue si l'objet est absent).
  // `storage_path` = objectPath complet MinIO (ex. `media/<tenant>/...`).
  await deleteFromStorage(asset.storage_path)

  // Suppression DB (RLS vérifie l'ownership)
  const { error: dbError } = await supabase
    .from("media_assets")
    .delete()
    .eq("id", id)

  if (dbError) return { error: "Erreur lors de la suppression." }

  revalidatePath("/dashboard/library")

  return { success: true }
}
