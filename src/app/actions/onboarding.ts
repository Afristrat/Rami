"use server"

import { createClient } from "@/lib/supabase/server"
import { db } from "@/lib/db"
import { tenants, users } from "@/lib/db/schema"
import { z } from "zod"
import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"
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

  // Validation Zod
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

  try {
    // Vérifier que le slug n'est pas déjà pris
    const existing = await db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    })

    if (existing) {
      return {
        success: false,
        error: "Ce slug est déjà utilisé",
        fieldErrors: {
          slug: ["Ce slug est déjà pris, choisissez-en un autre"],
        },
      }
    }

    // Créer le tenant
    const [newTenant] = await db
      .insert(tenants)
      .values({
        name,
        slug,
        owner_id: user.id,
        plan,
        logo_url: logoUrl ?? null,
      })
      .returning()

    // Mettre à jour l'utilisateur : lier au tenant + marquer onboarding complété
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name ?? null,
        avatar_url: user.user_metadata?.avatar_url ?? null,
        role: "agency_owner",
        tenant_id: newTenant.id,
        onboarding_completed: true,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          tenant_id: newTenant.id,
          onboarding_completed: true,
          updated_at: new Date(),
        },
      })

    // Stocker onboarding_completed dans les métadonnées Supabase Auth
    // Permet au middleware de vérifier sans requête DB
    await supabase.auth.updateUser({
      data: { onboarding_completed: true },
    })
  } catch (error) {
    log({ level: "error", module: "onboarding", action: "create_tenant_error", metadata: { error: error instanceof Error ? error.message : String(error) } })
    return {
      success: false,
      error: "Une erreur est survenue. Veuillez réessayer.",
    }
  }

  redirect("/dashboard?welcome=1")
}

export async function checkSlugAvailability(
  slug: string
): Promise<{ available: boolean }> {
  if (!slug || slug.length < 2) return { available: false }

  const existing = await db.query.tenants.findFirst({
    where: eq(tenants.slug, slug),
  })

  return { available: !existing }
}

export async function uploadLogoToSupabase(
  formData: FormData
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { url: null, error: "Non authentifié" }

  const file = formData.get("logo") as File | null
  if (!file) return { url: null, error: "Aucun fichier fourni" }

  // Validation MIME type
  const allowedMimes = ["image/png", "image/jpeg", "image/svg+xml", "image/webp"]
  if (!allowedMimes.includes(file.type)) {
    return {
      url: null,
      error: "Format non supporté. Utilisez PNG, JPEG, SVG ou WebP.",
    }
  }

  // Validation taille (10 MB max)
  if (file.size > 10 * 1024 * 1024) {
    return { url: null, error: "Le fichier ne doit pas dépasser 10 MB." }
  }

  const ext = file.name.split(".").pop() ?? "png"
  const path = `logos/${user.id}-${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from("rami-assets")
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) {
    return { url: null, error: "Échec de l'upload : " + error.message }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("rami-assets").getPublicUrl(path)

  return { url: publicUrl }
}
