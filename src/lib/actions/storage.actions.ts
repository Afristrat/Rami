"use server"

import { createClient } from "@/lib/supabase/server"
import { uploadAsset, deleteFromStorage, createSignedUrl, computeQuotaStatus, SIGNED_URL_TTL } from "@/lib/services/storage"
import { getTenantStorageUsage } from "@/lib/services/storage/client"
import { UploadFileSchema, DeleteFileSchema, GetSignedUrlSchema } from "@/lib/schemas/storage.schema"
import type { Plan } from "@/lib/services/storage"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getCurrentTenant(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { tenant: null, error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { tenant: null, error: "Tenant introuvable." }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, plan")
    .eq("id", tenantId)
    .single()

  if (tenantError || !tenant) {
    return { tenant: null, error: "Tenant introuvable." }
  }

  return { tenant: tenant as { id: string; plan: Plan }, error: null }
}

// ── Upload ────────────────────────────────────────────────────────────────────

export interface UploadActionResult {
  success: boolean
  error?: string
  asset?: {
    id: string
    publicUrl: string | null
    signedUrl: string | null
    mimeType: string
    sizeBytes: number
    width?: number | null
    height?: number | null
    wasResized: boolean
  }
}

/**
 * Server Action principale : upload d'un fichier.
 * Reçoit un FormData avec le champ "file" + métadonnées optionnelles.
 */
export async function uploadFileAction(
  formData: FormData
): Promise<UploadActionResult> {
  const supabase = await createClient()
  const { tenant, error: tenantError } = await getCurrentTenant(supabase)
  if (!tenant) return { success: false, error: tenantError ?? "Erreur d'authentification." }

  // Extraction du fichier
  const rawFile = formData.get("file")
  if (!(rawFile instanceof File)) {
    return { success: false, error: "Aucun fichier fourni." }
  }

  const category = (formData.get("category") as string) || "posts"
  const altText = (formData.get("altText") as string) || null
  const resizePreset = (formData.get("resizePreset") as string) || undefined

  // Validation schéma Zod
  const parsed = UploadFileSchema.safeParse({
    filename: rawFile.name,
    mimeType: rawFile.type,
    sizeBytes: rawFile.size,
    category,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." }
  }

  // Lecture du buffer
  const arrayBuffer = await rawFile.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Quota actuel
  const { usedBytes } = await getTenantStorageUsage(tenant.id)

  // Upload via service
  const result = await uploadAsset({
    tenantId: tenant.id,
    plan: tenant.plan,
    usedStorageBytes: usedBytes,
    file: {
      buffer,
      mimeType: rawFile.type,
      originalFilename: rawFile.name,
      sizeBytes: rawFile.size,
    },
    category: parsed.data.category,
    resizePreset: resizePreset as Parameters<typeof uploadAsset>[0]["resizePreset"],
  })

  if (!result.success || !result.asset) {
    return { success: false, error: result.error }
  }

  // Enregistrement en DB
  const { data: dbAsset, error: dbError } = await supabase
    .from("media")
    .insert({
      tenant_id: tenant.id,
      filename: rawFile.name,
      mime_type: result.asset.mimeType,
      size_bytes: result.asset.sizeBytes,
      storage_path: result.asset.path,
      bucket: result.asset.bucket,
      public_url: result.asset.publicUrl,
      alt_text: altText,
      width: result.asset.width ?? null,
      height: result.asset.height ?? null,
      was_resized: result.asset.wasResized,
      compression_ratio: result.asset.compressionRatio ?? null,
    })
    .select("id")
    .single()

  if (dbError) {
    // Asset stocké mais non référencé → tenter nettoyage
    await deleteFromStorage(result.asset.bucket, result.asset.path)
    return { success: false, error: "Erreur lors de l'enregistrement. Veuillez réessayer." }
  }

  return {
    success: true,
    asset: {
      id: dbAsset.id as string,
      publicUrl: result.asset.publicUrl,
      signedUrl: result.asset.signedUrl,
      mimeType: result.asset.mimeType,
      sizeBytes: result.asset.sizeBytes,
      width: result.asset.width ?? null,
      height: result.asset.height ?? null,
      wasResized: result.asset.wasResized,
    },
  }
}

// ── Suppression ───────────────────────────────────────────────────────────────

export async function deleteFileAction(
  assetId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { tenant, error: tenantError } = await getCurrentTenant(supabase)
  if (!tenant) return { success: false, error: tenantError ?? "Erreur d'authentification." }

  const parsed = DeleteFileSchema.safeParse({ assetId })
  if (!parsed.success) return { success: false, error: "ID d'asset invalide." }

  // Récupération des infos de l'asset (RLS garantit que c'est bien du tenant)
  const { data: asset, error: fetchError } = await supabase
    .from("media")
    .select("storage_path, bucket")
    .eq("id", assetId)
    .eq("tenant_id", tenant.id)
    .single()

  if (fetchError || !asset) {
    return { success: false, error: "Asset introuvable ou accès refusé." }
  }

  // Suppression du storage
  const { error: storageError } = await deleteFromStorage(
    asset.bucket as Parameters<typeof deleteFromStorage>[0],
    asset.storage_path as string
  )

  if (storageError) {
    return { success: false, error: `Erreur de suppression : ${storageError.message}` }
  }

  // Suppression en DB
  await supabase.from("media").delete().eq("id", assetId)

  return { success: true }
}

// ── URL signée ────────────────────────────────────────────────────────────────

export async function getSignedUrlAction(
  assetId: string,
  ttl: "short" | "medium" | "long" = "medium"
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()
  const { tenant, error: tenantError } = await getCurrentTenant(supabase)
  if (!tenant) return { url: null, error: tenantError ?? "Erreur d'authentification." }

  const parsed = GetSignedUrlSchema.safeParse({ assetId, ttl })
  if (!parsed.success) return { url: null, error: "Paramètres invalides." }

  const { data: asset, error: fetchError } = await supabase
    .from("media")
    .select("storage_path, bucket, public_url")
    .eq("id", assetId)
    .eq("tenant_id", tenant.id)
    .single()

  if (fetchError || !asset) {
    return { url: null, error: "Asset introuvable ou accès refusé." }
  }

  // Si l'asset est public, retourner directement l'URL publique
  if (asset.public_url) {
    return { url: asset.public_url as string }
  }

  const ttlSeconds = SIGNED_URL_TTL[ttl]
  const { url, error } = await createSignedUrl(
    asset.bucket as Parameters<typeof createSignedUrl>[0],
    asset.storage_path as string,
    ttlSeconds
  )

  if (error) {
    return { url: null, error: error.message }
  }

  return { url }
}

// ── Quota ─────────────────────────────────────────────────────────────────────

export async function getStorageQuotaAction(): Promise<{
  success: boolean
  error?: string
  quota?: ReturnType<typeof computeQuotaStatus>
}> {
  const supabase = await createClient()
  const { tenant, error: tenantError } = await getCurrentTenant(supabase)
  if (!tenant) return { success: false, error: tenantError ?? "Erreur d'authentification." }

  const { usedBytes, error } = await getTenantStorageUsage(tenant.id)

  if (error) {
    return { success: false, error: error.message }
  }

  const quota = computeQuotaStatus(tenant.plan, usedBytes)

  return { success: true, quota }
}

// ── Liste des assets ──────────────────────────────────────────────────────────

export async function listAssetsAction(params?: {
  category?: string
  limit?: number
  offset?: number
}): Promise<{
  success: boolean
  error?: string
  assets?: Array<{
    id: string
    filename: string
    mimeType: string
    sizeBytes: number
    publicUrl: string | null
    width: number | null
    height: number | null
    createdAt: string
  }>
  total?: number
}> {
  const supabase = await createClient()
  const { tenant, error: tenantError } = await getCurrentTenant(supabase)
  if (!tenant) return { success: false, error: tenantError ?? "Erreur d'authentification." }

  const limit = params?.limit ?? 50
  const offset = params?.offset ?? 0

  let query = supabase
    .from("media")
    .select("id, filename, mime_type, size_bytes, public_url, width, height, created_at", { count: "exact" })
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (params?.category) {
    query = query.like("storage_path", `%/${params.category}/%`)
  }

  const { data, error, count } = await query

  if (error) {
    return { success: false, error: "Impossible de charger les assets." }
  }

  return {
    success: true,
    assets: (data ?? []).map((row) => ({
      id: row.id as string,
      filename: row.filename as string,
      mimeType: row.mime_type as string,
      sizeBytes: row.size_bytes as number,
      publicUrl: row.public_url as string | null,
      width: row.width as number | null,
      height: row.height as number | null,
      createdAt: row.created_at as string,
    })),
    total: count ?? 0,
  }
}
