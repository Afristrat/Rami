"use server"

import { createClient } from "@/lib/supabase/server"

// ── Types ─────────────────────────────────────────────────────────────────────

export type UserTenant = {
  id: string
  name: string
  plan: "free" | "solo" | "pro" | "agency" | "agency_plus" | "enterprise"
  slug: string
}

export type UserTenantsResult =
  | { tenants: UserTenant[]; currentTenantId: string | null }
  | { error: string }

// ── Action ────────────────────────────────────────────────────────────────────

/**
 * Charge tous les tenants accessibles à l'utilisateur courant.
 *
 * Stratégie (identique à resolveUserTenant mais retourne une liste) :
 * 1. Tenants dont l'utilisateur est owner (tenants.owner_id = user.id)
 * 2. Tenants dont l'utilisateur est membre accepté (tenant_members)
 *
 * Le tenant courant est résolu via la même logique que resolveUserTenant
 * (propriétaire > membre accepté > users.tenant_id).
 * La liste est dédupliquée par id.
 */
export async function getUserTenantsAction(): Promise<UserTenantsResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: "Non authentifié" }
  }

  // ── 1. Tenants dont l'utilisateur est owner ────────────────────────────────
  const { data: ownedRows, error: ownedError } = await supabase
    .from("tenants")
    .select("id, name, slug, plan")
    .eq("owner_id", user.id)
    .eq("is_active", true)

  if (ownedError) {
    return { error: "Impossible de charger les tenants : " + ownedError.message }
  }

  // ── 2. Tenants via tenant_members ──────────────────────────────────────────
  const { data: memberRows } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", user.id)
    .eq("status", "accepted")

  const memberTenantIds = (memberRows ?? []).map((r) => r.tenant_id as string)

  // Exclure ceux déjà récupérés via owned
  const ownedIds = new Set((ownedRows ?? []).map((r) => r.id as string))
  const additionalIds = memberTenantIds.filter((id) => !ownedIds.has(id))

  let memberTenants: UserTenant[] = []
  if (additionalIds.length > 0) {
    const { data: memberTenantRows } = await supabase
      .from("tenants")
      .select("id, name, slug, plan")
      .in("id", additionalIds)
      .eq("is_active", true)

    memberTenants = (memberTenantRows ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
      plan: (r.plan as UserTenant["plan"]) ?? "free",
    }))
  }

  const ownedTenants: UserTenant[] = (ownedRows ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    plan: (r.plan as UserTenant["plan"]) ?? "free",
  }))

  const allTenants = [...ownedTenants, ...memberTenants]

  // ── Résoudre le tenant courant (même logique que resolveUserTenant) ─────────
  let currentTenantId: string | null = null

  // Stratégie 1 : owner
  if (ownedTenants.length > 0) {
    currentTenantId = ownedTenants[0].id
  } else if (memberTenants.length > 0) {
    // Stratégie 2 : premier tenant membre
    currentTenantId = memberTenants[0].id
  } else {
    // Stratégie 3 : fallback users.tenant_id
    const { data: userRow } = await supabase
      .from("users")
      .select("tenant_id")
      .eq("id", user.id)
      .maybeSingle()
    currentTenantId = (userRow?.tenant_id as string | null) ?? null
  }

  return { tenants: allTenants, currentTenantId }
}
