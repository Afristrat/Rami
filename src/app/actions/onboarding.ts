"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { z } from "zod"
import { redirect } from "next/navigation"
import { log } from "@/lib/utils/logger"

const OnboardingSchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères")
    .trim(),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(63, "Le slug ne peut pas dépasser 63 caractères")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Le slug ne peut contenir que des lettres minuscules, chiffres et tirets"
    ),
  plan: z.enum(["free", "solo", "pro", "agency", "agency_plus"]),
  logoUrl: z.string().url().optional().nullable(),
})

export type OnboardingData = z.infer<typeof OnboardingSchema>

export type OnboardingState = {
  success: boolean
  error?: string
  fieldErrors?: Partial<Record<keyof OnboardingData, string[]>>
}

export async function createTenantOnboarding(
  data: OnboardingData
): Promise<OnboardingState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Non authentifié" }
  }

  const parsed = OnboardingSchema.safeParse(data)
  if (!parsed.success) {
    return {
      success: false,
      error: "Données invalides",
      fieldErrors: parsed.error.flatten().fieldErrors as Partial<
        Record<keyof OnboardingData, string[]>
      >,
    }
  }

  const { name, slug, plan, logoUrl } = parsed.data
  const service = createServiceClient()

  try {
    // Vérifier que le slug n'est pas déjà pris
    const { data: existing } = await service
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle()

    if (existing) {
      return {
        success: false,
        error: "Ce slug est déjà utilisé",
        fieldErrors: { slug: ["Ce slug est déjà pris, choisissez-en un autre"] },
      }
    }

    // Créer le tenant
    const { data: newTenant, error: tenantError } = await service
      .from("tenants")
      .insert({ name, slug, owner_id: user.id, plan, logo_url: logoUrl ?? null })
      .select("id")
      .single()

    if (tenantError || !newTenant) {
      log({ level: "error", module: "onboarding", action: "tenant_creation_failed", metadata: { error: tenantError?.message } })
      return { success: false, error: "Impossible de créer le tenant : " + tenantError?.message }
    }

    // Upsert utilisateur
    const { error: userError } = await service
      .from("users")
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: "agency_owner",
        tenant_id: newTenant.id,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })

    if (userError) {
      log({ level: "error", module: "onboarding", action: "user_upsert_failed", metadata: { error: userError.message } })
      return { success: false, error: "Impossible de lier l'utilisateur : " + userError.message }
    }

    // Marquer onboarding dans Supabase Auth metadata
    await supabase.auth.updateUser({ data: { onboarding_completed: true } })

  } catch (error) {
    log({ level: "error", module: "onboarding", action: "unexpected_error", metadata: { error: error instanceof Error ? error.message : String(error) } })
    return { success: false, error: "Une erreur est survenue. Veuillez réessayer." }
  }

  redirect("/dashboard?welcome=1")
}

export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean }> {
  if (!slug || slug.length < 2) return { available: false }

  const service = createServiceClient()
  const { data } = await service
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  return { available: !data }
}

export async function uploadLogoToSupabase(
  formData: FormData
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { url: null, error: "Non authentifié" }

  const file = formData.get("logo") as File | null
  if (!file) return { url: null, error: "Aucun fichier fourni" }

  const allowedMimes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]
  if (!allowedMimes.includes(file.type)) {
    return { url: null, error: "Format non supporté. Utilisez PNG, JPEG, SVG ou WebP." }
  }

  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: "Le fichier ne doit pas dépasser 10 MB." }
  }

  try {
    const { uploadToStorage, buildStoragePath, STORAGE_PREFIXES } = await import(
      "@/lib/services/storage/client"
    )
    const ext = file.name.split(".").pop() ?? "png"
    const objectPath = buildStoragePath(user.id, `logo.${ext}`)
    const buffer = Buffer.from(await file.arrayBuffer())

    const { data, error } = await uploadToStorage({
      prefix: STORAGE_PREFIXES.logos,
      path: objectPath,
      buffer,
      mimeType: file.type,
    })

    if (error || !data) {
      return { url: null, error: "Échec de l'upload : " + (error?.message ?? "erreur inconnue") }
    }

    return { url: data.publicUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur upload"
    return { url: null, error: "Échec de l'upload : " + message }
  }
}
