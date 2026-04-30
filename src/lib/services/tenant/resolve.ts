import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Résout le tenant_id d'un utilisateur en essayant 3 stratégies dans l'ordre :
 * 1. tenants.owner_id  — utilisateurs créés via onboarding normal
 * 2. tenant_members    — utilisateurs ajoutés via l'admin (provisionClientAction / addUserToTenantAction)
 * 3. users.tenant_id   — ancienne table legacy (fallback)
 *
 * Cette fonction centralise la résolution pour éviter le bug "Tenant introuvable"
 * lorsqu'un utilisateur est provisionné par l'admin et n'existe pas dans la table `users`.
 */
export async function resolveUserTenant(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  // Stratégie 1 — propriétaire direct du tenant
  const { data: ownerRow } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle()

  if (ownerRow?.id) return ownerRow.id

  // Stratégie 2 — membre ajouté via l'admin
  const { data: memberRow } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle()

  if (memberRow?.tenant_id) return memberRow.tenant_id

  // Stratégie 3 — table users (onboarding legacy)
  const { data: userRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle()

  return userRow?.tenant_id ?? null
}
