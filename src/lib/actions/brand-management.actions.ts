"use server"

// ============================================================
// Gestion multi-marques (multi-tenant) — création + changement de marque active
// ============================================================
// Modèle : une « marque » = un `tenant`. La MARQUE ACTIVE d'un utilisateur =
// `users.tenant_id` — c'est aussi ce que lit la RLS (`get_current_tenant_id()`),
// donc app et RLS restent TOUJOURS cohérentes. Changer de marque = mettre à jour
// `users.tenant_id`, UNIQUEMENT vers une marque à laquelle l'utilisateur a accès
// (propriétaire ou membre accepté) — validé côté serveur (service-role).
//
// Création gated par RÔLE GLOBAL (`users.role`) : seuls super_admin / agency_owner
// / brand_manager peuvent ajouter des marques.

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { randomBytes } from "node:crypto"
import { revalidatePath } from "next/cache"

/** Rôles globaux autorisés à créer/ajouter des marques. */
const ROLES_CAN_CREATE_BRANDS = new Set(["super_admin", "agency_owner", "brand_manager"])

export type CreateBrandResult = { id: string } | { error: string }
export type SwitchBrandResult = { success: true } | { error: string }

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)
  const suffix = randomBytes(3).toString("hex")
  return `${base || "marque"}-${suffix}`
}

/** Rôle global de l'utilisateur courant (lecture users.role). */
async function getCurrentUserRole(userId: string): Promise<string | null> {
  const svc = createServiceClient()
  const { data } = await svc.from("users").select("role").eq("id", userId).maybeSingle<{ role: string }>()
  return data?.role ?? null
}

/** Vrai si l'utilisateur courant peut créer des marques (pour gater l'UI). */
export async function canCreateBrandsAction(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const role = await getCurrentUserRole(user.id)
  return role !== null && ROLES_CAN_CREATE_BRANDS.has(role)
}

/** Vrai si l'utilisateur a accès au tenant (propriétaire OU membre accepté). */
async function userHasAccess(svc: ReturnType<typeof createServiceClient>, userId: string, tenantId: string): Promise<boolean> {
  const [{ data: owned }, { data: member }] = await Promise.all([
    svc.from("tenants").select("id").eq("id", tenantId).eq("owner_id", userId).maybeSingle(),
    svc
      .from("tenant_members")
      .select("id")
      .eq("user_id", userId)
      .eq("tenant_id", tenantId)
      .eq("status", "accepted")
      .maybeSingle(),
  ])
  return Boolean(owned?.id || member?.id)
}

/**
 * Crée une nouvelle marque (tenant) possédée par l'utilisateur courant, gated
 * par rôle. Crée aussi sa ligne `tenant_members` (admin, accepted). NE bascule
 * PAS automatiquement — le client peut enchaîner avec switchBrandAction.
 */
export async function createBrandAction(input: { name: string }): Promise<CreateBrandResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  const name = (input?.name ?? "").trim()
  if (name.length < 2 || name.length > 80) return { error: "Le nom de la marque doit faire 2 à 80 caractères." }

  const role = await getCurrentUserRole(user.id)
  if (!role || !ROLES_CAN_CREATE_BRANDS.has(role)) {
    return { error: "Votre rôle ne permet pas de créer des marques." }
  }

  const svc = createServiceClient()

  // Création du tenant (service-role : opération contrôlée, validée ci-dessus).
  const { data: tenant, error: tErr } = await svc
    .from("tenants")
    .insert({ name, slug: slugify(name), owner_id: user.id, plan: "free", is_active: true })
    .select("id")
    .single<{ id: string }>()
  if (tErr || !tenant) {
    return { error: "Échec de la création de la marque." }
  }

  // Membre propriétaire (admin, accepté) — best-effort, n'invalide pas la création.
  await svc
    .from("tenant_members")
    .insert({
      tenant_id: tenant.id,
      user_id: user.id,
      email: user.email ?? "",
      role: "admin",
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .then(undefined, () => {})

  revalidatePath("/", "layout")
  return { id: tenant.id }
}

/**
 * Bascule la marque ACTIVE de l'utilisateur vers `tenantId`. Valide d'abord que
 * l'utilisateur y a accès (propriétaire ou membre accepté) — un utilisateur ne
 * peut JAMAIS basculer vers une marque qui n'est pas la sienne. Met à jour
 * `users.tenant_id` (lu par l'app ET la RLS → cohérence garantie).
 */
export async function switchBrandAction(tenantId: string): Promise<SwitchBrandResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Non authentifié." }

  if (typeof tenantId !== "string" || tenantId.length < 10) return { error: "Marque invalide." }

  const svc = createServiceClient()
  const allowed = await userHasAccess(svc, user.id, tenantId)
  if (!allowed) return { error: "Accès refusé à cette marque." }

  // S'assure que la ligne users existe puis pointe la marque active.
  const { error } = await svc
    .from("users")
    .upsert(
      { id: user.id, email: user.email ?? "", tenant_id: tenantId, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    )
  if (error) return { error: "Impossible de changer de marque." }

  revalidatePath("/", "layout")
  return { success: true }
}
