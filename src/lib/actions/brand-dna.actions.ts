"use server"

import { createClient } from "@/lib/supabase/server"
import { brandDnaFormSchema, type BrandDnaFormData } from "@/lib/schemas/brand-dna.schema"

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

  // Récupération du tenant de l'utilisateur
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.tenant_id) {
    return { error: "Tenant introuvable. Contactez le support." }
  }

  const tenantId = userData.tenant_id

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

  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.tenant_id) {
    return { data: null }
  }

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("brand_dna")
    .eq("id", userData.tenant_id)
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
    positioning: "",
    logoDataUrl: "",
    logoFileName: "",
    colorPrimary: "",
    colorSecondary: "",
    colorAccent: "",
    voiceTone: "",
    objectifCognitif: "",
    primaryCulture: "",
    audienceDescription: "",
    audienceAge: "",
    audienceLocation: "",
    audiencePainPoints: "",
    ...lenientParsed.data,
  }

  return { data: withDefaults }
}
