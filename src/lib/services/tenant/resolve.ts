import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Résout la MARQUE ACTIVE (tenant_id) de l'utilisateur.
 *
 * Multi-marques : la marque active est `users.tenant_id` — la MÊME source que la
 * RLS (`get_current_tenant_id()`), donc app et RLS restent cohérentes quand on
 * change de marque (cf. switchBrandAction). On ne fait confiance à cette valeur
 * que si l'utilisateur y a réellement accès (propriétaire OU membre accepté) —
 * défense en profondeur. Sinon on retombe sur la 1ʳᵉ marque possédée, puis la
 * 1ʳᵉ adhésion acceptée.
 */
export async function resolveUserTenant(
  supabase: SupabaseClient,
  userId: string
): Promise<string | null> {
  // ── 1. Marque ACTIVE = users.tenant_id, si accessible ──────────────────────
  const { data: userRow } = await supabase
    .from("users")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle()
  const active = (userRow?.tenant_id as string | null) ?? null

  if (active) {
    // Propriétaire de la marque active ? (cas le plus courant → court-circuit)
    const { data: owned } = await supabase
      .from("tenants")
      .select("id")
      .eq("id", active)
      .eq("owner_id", userId)
      .maybeSingle()
    if (owned?.id) return active

    // Sinon, membre accepté de la marque active ?
    const { data: member } = await supabase
      .from("tenant_members")
      .select("id")
      .eq("user_id", userId)
      .eq("tenant_id", active)
      .eq("status", "accepted")
      .maybeSingle()
    if (member?.id) return active
  }

  // ── 2. Fallback — 1ʳᵉ marque possédée ──────────────────────────────────────
  const { data: ownerRow } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()
  if (ownerRow?.id) return ownerRow.id as string

  // ── 3. Fallback — 1ʳᵉ adhésion acceptée ────────────────────────────────────
  const { data: memberRow } = await supabase
    .from("tenant_members")
    .select("tenant_id")
    .eq("user_id", userId)
    .eq("status", "accepted")
    .limit(1)
    .maybeSingle()

  return (memberRow?.tenant_id as string | null) ?? null
}
