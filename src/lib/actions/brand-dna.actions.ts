"use server"

import { createClient } from "@/lib/supabase/server"
import { brandDnaFormSchema, type BrandDnaFormData } from "@/lib/schemas/brand-dna.schema"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"
import { captureServerEvent } from "@/lib/utils/posthog-server"

export type SaveBrandDnaResult =
  | { success: true; tenantId: string }
  | { error: string }

export type GetBrandDnaResult =
  | { data: BrandDnaFormData | null }
  | { error: string }

/**
 * Sauvegarde le Brand DNA dans tenants.brand_dna (JSONB).
 * Le logo (dataUrl) est stocké tel quel pour le MVP — à migrer vers MinIO en Phase 2.
 */
export async function saveBrandDnaAction(
  formData: BrandDnaFormData
): Promise<SaveBrandDnaResult> {
  const supabase = await createClient()

  // Vérification session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Non authentifié. Veuillez vous reconnecter." }
  }

  // Validation Zod côté serveur (défense en profondeur)
  const parsed = brandDnaFormSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: "Données invalides. Vérifiez le formulaire." }
  }

  // Récupération du tenant de l'utilisateur (toutes stratégies)
  const tenantId = await resolveUserTenant(supabase, user.id)

  if (!tenantId) {
    return { error: "Tenant introuvable. Contactez le support." }
  }

  // Sauvegarde Brand DNA en JSONB (on exclut le logoDataUrl du JSON principal — trop lourd)
  const brandDnaPayload = {
    ...parsed.data,
    // Le logoDataUrl est conservé pour le MVP mais tronqué dans les logs
    savedAt: new Date().toISOString(),
    version: 1,
  }

  const { error: updateError } = await supabase
    .from("tenants")
    .update({
      brand_dna: brandDnaPayload,
      name: parsed.data.brandName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId)

  if (updateError) {
    return { error: "Impossible de sauvegarder. Veuillez réessayer." }
  }

  // Marquer l'onboarding comme complété
  await supabase
    .from("users")
    .update({ onboarding_completed: true })
    .eq("id", user.id)

  // PostHog — brand_dna_completed
  captureServerEvent({
    distinctId: user.id,
    event: "brand_dna_completed",
    properties: {
      tenant_id: tenantId,
      sector: parsed.data.sector,
      brand_name: parsed.data.brandName,
    },
  })

  return { success: true, tenantId }
}

/**
 * Récupère le Brand DNA existant pour le tenant de l'utilisateur connecté.
 */
export async function getBrandDnaAction(): Promise<GetBrandDnaResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: "Non authentifié." }
  }

  const tenantId = await resolveUserTenant(supabase, user.id)

  if (!tenantId) {
    return { data: null }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  if (tenantError || !tenant?.brand_dna) {
    return { data: null }
  }

  // Validation Zod avec schéma partiel pour résister aux migrations de schema.
  // Les champs requis peuvent manquer dans les données sauvegardées avant une
  // migration — on renvoie les données partielles plutôt que null pour éviter
  // de perdre silencieusement les données existantes.
  const lenientParsed = brandDnaFormSchema.partial().safeParse(tenant.brand_dna)
  if (!lenientParsed.success) {
    return { data: null }
  }

  // Merge avec les valeurs par défaut pour que le formulaire reçoive un objet complet
  const withDefaults: BrandDnaFormData = {
    brandName: "",
    tagline: "",
    sector: "",
    sectorCustom: "",
    positioning: "",
    logoDataUrl: "",
    logoFileName: "",
    colorPrimary: "",
    colorSecondary: "",
    colorAccent: "",
    voiceTone: "",
    objectifsCognitifs: [],
    objectifCognitif: "",
    objectifCognitifCustom: "",
    primaryCulture: "",
    audienceDescription: "",
    audienceAge: "",
    audienceLocation: "",
    audiencePainPoints: "",
    typography: {
      heading: { family: "Inter", size: 32, weight: "bold" },
      subheading: { family: "Inter", size: 20, weight: "semibold" },
      body: { family: "Inter", size: 16, weight: "normal" },
    },
    ...lenientParsed.data,
  }

  return { data: withDefaults }
}

// ── Guidelines ──────────────────────────────────────────────────────────────

export interface BrandGuidelines {
  brandStory: string
  coreValues: string
  usageRules: string
}

export type GetGuidelinesResult =
  | { data: BrandGuidelines }
  | { error: string }

export type SaveGuidelinesResult =
  | { success: true }
  | { error: string }

/**
 * Récupère les guidelines depuis brand_dna.guidelines (JSONB imbriqué).
 */
export async function getGuidelinesAction(): Promise<GetGuidelinesResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  if (tenantError) return { error: "Erreur lors du chargement." }

  const guidelines = (tenant?.brand_dna as Record<string, unknown> | null)?.guidelines as BrandGuidelines | undefined

  return {
    data: {
      brandStory: guidelines?.brandStory ?? "",
      coreValues: guidelines?.coreValues ?? "",
      usageRules: guidelines?.usageRules ?? "",
    },
  }
}

/**
 * Sauvegarde les guidelines dans brand_dna.guidelines (JSONB imbriqué).
 */
export async function saveGuidelinesAction(
  guidelines: BrandGuidelines
): Promise<SaveGuidelinesResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  // Récupérer le brand_dna existant pour merger
  const { data: tenant, error: fetchError } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", tenantId)
    .single()

  if (fetchError) return { error: "Erreur lors du chargement." }

  const existingBrandDna = (tenant?.brand_dna as Record<string, unknown>) ?? {}

  const { error: updateError } = await supabase
    .from("tenants")
    .update({
      brand_dna: {
        ...existingBrandDna,
        guidelines: {
          brandStory: guidelines.brandStory,
          coreValues: guidelines.coreValues,
          usageRules: guidelines.usageRules,
        },
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId)

  if (updateError) return { error: "Impossible de sauvegarder. Veuillez réessayer." }

  return { success: true }
}

// ── Brand Assets ────────────────────────────────────────────────────────────

export type BrandAssetCategory = "photos" | "illustrations" | "icons" | "graphics"

export interface BrandAsset {
  id: string
  filename: string
  mimeType: string
  sizeBytes: number
  publicUrl: string | null
  category: BrandAssetCategory
  createdAt: string
}

export type GetBrandAssetsResult =
  | { data: BrandAsset[] }
  | { error: string }

export type UploadBrandAssetResult =
  | { data: BrandAsset }
  | { error: string }

export type DeleteBrandAssetResult =
  | { success: true }
  | { error: string }

/**
 * Liste les brand assets du tenant filtrés par catégorie.
 * Les brand assets sont des media avec metadata.brandAssetCategory défini.
 */
export async function getBrandAssetsAction(
  category?: BrandAssetCategory
): Promise<GetBrandAssetsResult> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: "Non authentifié." }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: "Tenant introuvable." }

  let query = supabase
    .from("media")
    .select("id, filename, mime_type, size_bytes, public_url, metadata, created_at")
    .eq("tenant_id", tenantId)
    .not("metadata->brandAssetCategory", "is", null)
    .order("created_at", { ascending: false })

  if (category) {
    query = query.eq("metadata->>brandAssetCategory", category)
  }

  const { data, error } = await query

  if (error) {
    // Table absente — retourner liste vide
    if (error.code === "42P01") return { data: [] }
    return { error: "Erreur lors du chargement des assets." }
  }

  const assets: BrandAsset[] = (data ?? []).map((row) => ({
    id: row.id as string,
    filename: row.filename as string,
    mimeType: row.mime_type as string,
    sizeBytes: row.size_bytes as number,
    publicUrl: row.public_url as string | null,
    category: ((row.metadata as Record<string, unknown>)?.brandAssetCategory as BrandAssetCategory) ?? "photos",
    createdAt: row.created_at as string,
  }))

  return { data: assets }
}

/**
 * Upload un brand asset avec la catégorie en metadata.
 */
export async function uploadBrandAssetAction(
  formData: FormData
): Promise<UploadBrandAssetResult> {
  // Réutilise le même service de storage que les autres uploads
  const { uploadFileAction } = await import("@/lib/actions/storage.actions")

  const category = formData.get("category") as BrandAssetCategory | null
  if (!category || !["photos", "illustrations", "icons", "graphics"].includes(category)) {
    return { error: "Catégorie invalide." }
  }

  // Préparer le FormData pour le storage
  const storageForm = new FormData()
  const file = formData.get("file") as File | null
  if (!file) return { error: "Aucun fichier fourni." }

  // Validation MIME côté serveur
  const ALLOWED_MIMES = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]
  if (!ALLOWED_MIMES.includes(file.type)) {
    return { error: "Type de fichier non autorisé." }
  }

  storageForm.set("file", file)
  storageForm.set("category", "brand-assets")

  const result = await uploadFileAction(storageForm)

  if (!result.success || !result.asset) {
    return { error: result.error ?? "Erreur lors de l'upload." }
  }

  // Mettre à jour les metadata avec la catégorie brand asset
  const supabase = await createClient()
  const { error: updateError } = await supabase
    .from("media")
    .update({
      metadata: { brandAssetCategory: category },
    })
    .eq("id", result.asset.id)

  if (updateError) {
    return { error: "Erreur lors de l'enregistrement de la catégorie." }
  }

  return {
    data: {
      id: result.asset.id,
      filename: file.name,
      mimeType: result.asset.mimeType,
      sizeBytes: result.asset.sizeBytes,
      publicUrl: result.asset.publicUrl,
      category,
      createdAt: new Date().toISOString(),
    },
  }
}

/**
 * Supprime un brand asset.
 */
export async function deleteBrandAssetAction(
  assetId: string
): Promise<DeleteBrandAssetResult> {
  const { deleteFileAction } = await import("@/lib/actions/storage.actions")

  const result = await deleteFileAction(assetId)

  if (!result.success) {
    return { error: result.error ?? "Erreur lors de la suppression." }
  }

  return { success: true }
}
