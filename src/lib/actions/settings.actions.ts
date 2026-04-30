"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
}

export interface TeamMember {
  id: string
  email: string
  role: "admin" | "editor" | "viewer"
  status: "pending" | "accepted" | "revoked"
  invitedAt: string
  acceptedAt: string | null
  userId: string | null
}

export interface NotificationPreferences {
  emailPostPublished: boolean
  emailPostFailed: boolean
  emailQuotaWarning: boolean
  emailTeamInvite: boolean
  emailBilling: boolean
  emailWeeklyDigest: boolean
  emailBrandDnaTips: boolean
}

// ── Profil ────────────────────────────────────────────────────────────────────

export async function getProfileAction(): Promise<{
  data: UserProfile | null
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { data: null, error: "Non authentifié." }
  }

  return {
    data: {
      id: user.id,
      email: user.email ?? "",
      fullName: (user.user_metadata?.full_name as string) ?? "",
      avatarUrl: (user.user_metadata?.avatar_url as string) ?? null,
    },
  }
}

export async function updateProfileAction(formData: {
  fullName: string
  avatarUrl?: string
}): Promise<{ error?: string; success?: string }> {
  if (!formData.fullName.trim()) {
    return { error: "Le nom est requis." }
  }
  if (formData.fullName.trim().length > 100) {
    return { error: "Le nom ne peut pas dépasser 100 caractères." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: formData.fullName.trim(),
      ...(formData.avatarUrl !== undefined && {
        avatar_url: formData.avatarUrl,
      }),
    },
  })

  if (error) {
    return { error: "Impossible de mettre à jour le profil." }
  }

  revalidatePath("/dashboard/settings/profile")
  return { success: "Profil mis à jour avec succès." }
}

// ── Équipe ────────────────────────────────────────────────────────────────────

async function getTenantId(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  return resolveUserTenant(supabase, user.id)
}

export async function getTeamMembersAction(): Promise<{
  data: TeamMember[]
  error?: string
}> {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return { data: [], error: "Tenant introuvable." }

  const { data, error } = await supabase
    .from("tenant_members")
    .select("id, email, role, status, invited_at, accepted_at, user_id")
    .eq("tenant_id", tenantId)
    .neq("status", "revoked")
    .order("invited_at", { ascending: false })

  if (error) {
    // Table absente — retour vide gracieux
    if (error.code === "42P01") return { data: [] }
    return { data: [], error: "Impossible de charger les membres." }
  }

  return {
    data: (data ?? []).map((m) => ({
      id: m.id,
      email: m.email,
      role: m.role as TeamMember["role"],
      status: m.status as TeamMember["status"],
      invitedAt: m.invited_at,
      acceptedAt: m.accepted_at,
      userId: m.user_id,
    })),
  }
}

export async function inviteTeamMemberAction(formData: {
  email: string
  role: "admin" | "editor" | "viewer"
}): Promise<{ error?: string; success?: string }> {
  const emailTrimmed = formData.email.trim().toLowerCase()
  if (!emailTrimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
    return { error: "Email invalide." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const tenantId = await getTenantId(supabase)
  if (!tenantId) return { error: "Tenant introuvable." }

  // Vérifier que ce n'est pas l'owner lui-même
  if (user.email === emailTrimmed) {
    return { error: "Vous ne pouvez pas vous inviter vous-même." }
  }

  const { error } = await supabase.from("tenant_members").upsert(
    {
      tenant_id: tenantId,
      email: emailTrimmed,
      role: formData.role,
      status: "pending",
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    },
    { onConflict: "tenant_id,email" }
  )

  if (error) {
    return { error: "Impossible d'inviter ce membre." }
  }

  revalidatePath("/dashboard/settings/team")
  return { success: `Invitation envoyée à ${emailTrimmed}.` }
}

export async function updateMemberRoleAction(
  memberId: string,
  role: "admin" | "editor" | "viewer"
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return { error: "Tenant introuvable." }

  const { error } = await supabase
    .from("tenant_members")
    .update({ role })
    .eq("id", memberId)
    .eq("tenant_id", tenantId)

  if (error) return { error: "Impossible de modifier le rôle." }

  revalidatePath("/dashboard/settings/team")
  return {}
}

export async function revokeMemberAccessAction(
  memberId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const tenantId = await getTenantId(supabase)
  if (!tenantId) return { error: "Tenant introuvable." }

  const { error } = await supabase
    .from("tenant_members")
    .update({ status: "revoked" })
    .eq("id", memberId)
    .eq("tenant_id", tenantId)

  if (error) return { error: "Impossible de révoquer l'accès." }

  revalidatePath("/dashboard/settings/team")
  return {}
}

// ── Notifications ─────────────────────────────────────────────────────────────

const DEFAULT_PREFS: NotificationPreferences = {
  emailPostPublished: true,
  emailPostFailed: true,
  emailQuotaWarning: true,
  emailTeamInvite: true,
  emailBilling: true,
  emailWeeklyDigest: false,
  emailBrandDnaTips: false,
}

export async function getNotificationPreferencesAction(): Promise<{
  data: NotificationPreferences
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { data: DEFAULT_PREFS, error: "Non authentifié." }

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error) {
    // Pas encore de préférences → retourner les défauts
    return { data: DEFAULT_PREFS }
  }

  return {
    data: {
      emailPostPublished: data.email_post_published,
      emailPostFailed: data.email_post_failed,
      emailQuotaWarning: data.email_quota_warning,
      emailTeamInvite: data.email_team_invite,
      emailBilling: data.email_billing,
      emailWeeklyDigest: data.email_weekly_digest,
      emailBrandDnaTips: data.email_brand_dna_tips,
    },
  }
}

export async function updateNotificationPreferencesAction(
  prefs: NotificationPreferences
): Promise<{ error?: string; success?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        email_post_published: prefs.emailPostPublished,
        email_post_failed: prefs.emailPostFailed,
        email_quota_warning: prefs.emailQuotaWarning,
        email_team_invite: prefs.emailTeamInvite,
        email_billing: prefs.emailBilling,
        email_weekly_digest: prefs.emailWeeklyDigest,
        email_brand_dna_tips: prefs.emailBrandDnaTips,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (error) {
    return { error: "Impossible de sauvegarder les préférences." }
  }

  revalidatePath("/dashboard/settings/notifications")
  return { success: "Préférences mises à jour." }
}

// ── Zone de danger ────────────────────────────────────────────────────────────

export async function deleteTenantAction(
  confirmationText: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const tenantId = await getTenantId(supabase)
  if (!tenantId) return { error: "Tenant introuvable." }

  // Vérification du texte de confirmation
  if (confirmationText !== "SUPPRIMER MON ESPACE") {
    return { error: "Texte de confirmation incorrect." }
  }

  // Supprimer le tenant — les FK CASCADE suppriment tout le reste
  const { error } = await supabase
    .from("tenants")
    .delete()
    .eq("id", tenantId)
    .eq("owner_id", user.id)

  if (error) {
    return { error: "Impossible de supprimer l'espace de travail." }
  }

  // Déconnexion après suppression
  await supabase.auth.signOut()
  return {}
}
