"use server"

import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { encryptToken, decryptToken } from "@/lib/services/oauth/state"
import { resolveEnvApiKey } from "@/lib/utils/resolve-env-api-key"
import { z } from "zod"
import { log } from "@/lib/utils/logger"

// ── Types ─────────────────────────────────────────────────────────────────────

export type AiProviderKeyCategory = "text" | "image" | "video" | "audio" | "infographic"

export type AiProviderKey = {
  id: string
  provider: string
  display_name: string
  category: AiProviderKeyCategory
  has_byok_key: boolean
  is_active: boolean
  last_tested_at: string | null
  last_test_success: boolean | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type FallbackProvider = {
  provider: string
  model: string
  priority: number
  enabled: boolean
}

export type AiFallbackChain = {
  id: string
  chain_key: string
  display_name: string
  description: string | null
  providers: FallbackProvider[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export type AdminStats = {
  total_tenants: number
  active_users: number
  mrr_estimate: number
  generations_this_month: number
  plan_breakdown: Record<string, number>
  recent_tenants: RecentTenant[]
}

export type RecentTenant = {
  id: string
  name: string
  slug: string
  plan: string
  owner_email: string | null
  created_at: string
}

export type AdminTenant = {
  id: string
  name: string
  slug: string
  plan: string
  owner_email: string | null
  subscription_status: string | null
  generation_count: number
  created_at: string
}

export type AdminUser = {
  id: string
  email: string
  display_name: string | null
  role: string
  tenant_name: string | null
  created_at: string
}

export type ProvisionClientResult =
  | { success: true; tenantId: string; userId: string }
  | { error: string }

// ── Résultats génériques ──────────────────────────────────────────────────────

export type ActionResult<T> = { data: T } | { error: string }
export type MutationResult = { success: true } | { error: string }
export type TestResult = { success: true; message: string; latency_ms: number } | { error: string }

// ── Helper : vérification super_admin ────────────────────────────────────────

/**
 * Vérifie que l'utilisateur connecté est super_admin.
 * Vérifie dans l'ordre : JWT app_metadata → profiles.global_role → users.role.
 * Retourne null si l'accès est autorisé, ou un message d'erreur sinon.
 */
async function assertSuperAdmin(): Promise<string | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return "Non authentifié"

  // 1. Vérifier JWT app_metadata (le plus rapide, pas de requête DB)
  if (user.app_metadata?.role === "super_admin") return null

  // 2. Vérifier profiles.global_role
  const { data: profile } = await supabase
    .from("profiles")
    .select("global_role")
    .eq("id", user.id)
    .single()

  if (profile?.global_role === "super_admin") return null

  // 3. Fallback : vérifier users.role (table Drizzle)
  const { data: dbUser } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (dbUser?.role === "super_admin") return null

  return "Accès refusé — rôle super_admin requis"
}

// ── Provider Keys ──────────────────────────────────────────────────────────────

/**
 * Récupère toutes les clés providers.
 * La clé chiffrée n'est jamais retournée — uniquement le flag has_byok_key.
 */
export async function getProviderKeys(): Promise<ActionResult<AiProviderKey[]>> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("ai_provider_keys")
    .select("id, provider, display_name, category, api_key_encrypted, is_active, last_tested_at, last_test_success, notes, created_at, updated_at")
    .order("category")
    .order("provider")

  if (error) return { error: "Impossible de charger les clés : " + error.message }

  const keys: AiProviderKey[] = (data ?? []).map((row) => ({
    id: row.id as string,
    provider: row.provider as string,
    display_name: row.display_name as string,
    category: ((row.category as string) || "text") as AiProviderKey["category"],
    has_byok_key: !!(row.api_key_encrypted as string | null),
    is_active: row.is_active as boolean,
    last_tested_at: row.last_tested_at as string | null,
    last_test_success: row.last_test_success as boolean | null,
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))

  return { data: keys }
}

const upsertProviderKeySchema = z.object({
  provider: z.string().min(1).max(50),
  api_key: z.string().min(10).max(500),
  notes: z.string().max(500).optional(),
})

/**
 * Configure une clé BYOK pour un provider.
 * La clé est chiffrée AES-256-GCM avant stockage.
 */
export async function upsertProviderKey(
  provider: string,
  apiKey: string,
  notes?: string
): Promise<MutationResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const parsed = upsertProviderKeySchema.safeParse({ provider, api_key: apiKey, notes })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  let api_key_encrypted: string
  try {
    api_key_encrypted = encryptToken(parsed.data.api_key)
  } catch {
    return { error: "Erreur lors du chiffrement de la clé API" }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from("ai_provider_keys")
    .update({
      api_key_encrypted,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("provider", provider)

  if (error) return { error: "Erreur lors de la sauvegarde : " + error.message }

  return { success: true }
}

/**
 * Supprime la clé BYOK d'un provider (repasse sur la variable d'environnement).
 */
export async function deleteProviderKey(provider: string): Promise<MutationResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from("ai_provider_keys")
    .update({
      api_key_encrypted: null,
      updated_at: new Date().toISOString(),
    })
    .eq("provider", provider)

  if (error) return { error: "Erreur lors de la suppression : " + error.message }

  return { success: true }
}

/**
 * Teste une clé provider en envoyant un ping à l'API correspondante.
 */
export async function testProviderKey(provider: string): Promise<TestResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const supabase = createServiceClient()

  // Récupérer la clé chiffrée si disponible
  const { data: row, error: fetchError } = await supabase
    .from("ai_provider_keys")
    .select("api_key_encrypted")
    .eq("provider", provider)
    .single()

  if (fetchError) return { error: "Provider introuvable" }

  // Résoudre la clé : BYOK > env
  let apiKey: string | undefined

  if (row.api_key_encrypted as string | null) {
    try {
      apiKey = decryptToken(row.api_key_encrypted as string)
    } catch {
      return { error: "Impossible de déchiffrer la clé BYOK" }
    }
  } else {
    apiKey = resolveEnvApiKey(provider)
  }

  if (!apiKey) {
    return { error: `Aucune clé configurée pour "${provider}". Configurez BYOK ou la variable d'environnement.` }
  }

  const start = Date.now()

  try {
    await pingProvider(provider, apiKey)
    const latency = Date.now() - start

    // Mettre à jour le résultat du test
    await supabase
      .from("ai_provider_keys")
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_success: true,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider)

    return { success: true, message: "Connexion réussie", latency_ms: latency }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue"

    await supabase
      .from("ai_provider_keys")
      .update({
        last_tested_at: new Date().toISOString(),
        last_test_success: false,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", provider)

    return { error: `Test échoué : ${message}` }
  }
}

// ── Fallback Chains ────────────────────────────────────────────────────────────

/**
 * Récupère toutes les chaînes de fallback.
 */
export async function getFallbackChains(): Promise<ActionResult<AiFallbackChain[]>> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from("ai_fallback_chains")
    .select("id, chain_key, display_name, description, providers, is_active, created_at, updated_at")
    .order("chain_key")

  if (error) return { error: "Impossible de charger les chaînes : " + error.message }

  const chains: AiFallbackChain[] = (data ?? []).map((row) => ({
    id: row.id as string,
    chain_key: row.chain_key as string,
    display_name: row.display_name as string,
    description: row.description as string | null,
    providers: (row.providers as FallbackProvider[]) ?? [],
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  }))

  return { data: chains }
}

const fallbackProviderSchema = z.object({
  provider: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  priority: z.number().int().min(1),
  enabled: z.boolean(),
})

const updateFallbackChainSchema = z.object({
  providers: z.array(fallbackProviderSchema).min(1),
})

/**
 * Met à jour l'ordre et l'état d'activation des providers d'une chaîne.
 */
export async function updateFallbackChain(
  chainKey: string,
  providers: FallbackProvider[]
): Promise<MutationResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const parsed = updateFallbackChainSchema.safeParse({ providers })
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Données invalides" }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from("ai_fallback_chains")
    .update({
      providers: parsed.data.providers,
      updated_at: new Date().toISOString(),
    })
    .eq("chain_key", chainKey)

  if (error) return { error: "Erreur lors de la mise à jour : " + error.message }

  return { success: true }
}

// ── Admin Stats ────────────────────────────────────────────────────────────────

const PLAN_MRR: Record<string, number> = {
  free: 0,
  solo: 59,
  pro: 149,
  agency: 399,
  agency_plus: 699,
  enterprise: 999,
}

/**
 * Statistiques globales du dashboard admin.
 */
export async function getAdminStats(): Promise<ActionResult<AdminStats>> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const supabase = createServiceClient()

  // Tenants
  const { data: tenants, error: tenantsError } = await supabase
    .from("tenants")
    .select("id, name, slug, plan, generation_count, created_at")
    .order("created_at", { ascending: false })

  if (tenantsError) return { error: "Erreur tenants : " + tenantsError.message }

  // Profils (users)
  const { count: userCount, error: usersError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })

  if (usersError) return { error: "Erreur users : " + usersError.message }

  const allTenants = tenants ?? []

  // Calculs agrégés
  const planBreakdown: Record<string, number> = {}
  let mrrEstimate = 0
  let generationsThisMonth = 0

  for (const t of allTenants) {
    const plan = (t.plan as string) ?? "free"
    planBreakdown[plan] = (planBreakdown[plan] ?? 0) + 1
    mrrEstimate += PLAN_MRR[plan] ?? 0
    generationsThisMonth += (t.generation_count as number) ?? 0
  }

  // 10 derniers tenants avec owner email
  const recentTenantIds = allTenants.slice(0, 10).map((t) => t.id as string)

  const ownerEmailMap: Record<string, string> = {}

  if (recentTenantIds.length > 0) {
    const { data: memberships } = await supabase
      .from("tenant_members")
      .select("tenant_id, user_id, role")
      .in("tenant_id", recentTenantIds)
      .eq("role", "owner")

    if (memberships && memberships.length > 0) {
      const userIds = memberships.map((m) => m.user_id as string)

      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds)

      const profileMap: Record<string, string> = {}
      for (const p of profileRows ?? []) {
        profileMap[p.id as string] = p.email as string
      }

      for (const m of memberships) {
        ownerEmailMap[m.tenant_id as string] = profileMap[m.user_id as string] ?? ""
      }
    }
  }

  const recentTenants: RecentTenant[] = allTenants.slice(0, 10).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    slug: t.slug as string,
    plan: (t.plan as string) ?? "free",
    owner_email: ownerEmailMap[t.id as string] ?? null,
    created_at: t.created_at as string,
  }))

  return {
    data: {
      total_tenants: allTenants.length,
      active_users: userCount ?? 0,
      mrr_estimate: mrrEstimate,
      generations_this_month: generationsThisMonth,
      plan_breakdown: planBreakdown,
      recent_tenants: recentTenants,
    },
  }
}

// ── Admin Tenants ──────────────────────────────────────────────────────────────

/**
 * Liste paginée des tenants avec recherche.
 */
export async function getAdminTenants(
  page: number = 1,
  search: string = ""
): Promise<ActionResult<{ tenants: AdminTenant[]; total: number }>> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const PAGE_SIZE = 20
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE

  const supabase = createServiceClient()

  let query = supabase
    .from("tenants")
    .select("id, name, slug, plan, subscription_status, generation_count, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (search.trim()) {
    query = query.or(`name.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%`)
  }

  const { data: rows, count, error } = await query

  if (error) return { error: "Erreur lors du chargement des tenants : " + error.message }

  // Charger les emails owners
  const tenantIds = (rows ?? []).map((r) => r.id as string)
  const ownerEmailMap: Record<string, string> = {}

  if (tenantIds.length > 0) {
    const { data: memberships } = await supabase
      .from("tenant_members")
      .select("tenant_id, user_id, role")
      .in("tenant_id", tenantIds)
      .eq("role", "owner")

    if (memberships && memberships.length > 0) {
      const userIds = memberships.map((m) => m.user_id as string)
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, email")
        .in("id", userIds)

      const profileMap: Record<string, string> = {}
      for (const p of profileRows ?? []) {
        profileMap[p.id as string] = (p.email as string) ?? ""
      }
      for (const m of memberships) {
        ownerEmailMap[m.tenant_id as string] = profileMap[m.user_id as string] ?? ""
      }
    }
  }

  const tenants: AdminTenant[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    plan: (r.plan as string) ?? "free",
    owner_email: ownerEmailMap[r.id as string] ?? null,
    subscription_status: r.subscription_status as string | null,
    generation_count: (r.generation_count as number) ?? 0,
    created_at: r.created_at as string,
  }))

  return { data: { tenants, total: count ?? 0 } }
}

/**
 * Provisionne un compte client en une seule opération :
 * 1. Crée l'utilisateur Supabase Auth (invitation par email)
 * 2. Crée le tenant
 * 3. Lie l'utilisateur au tenant (profiles + tenant_members)
 */
export async function provisionClientAction(
  email: string,
  displayName: string,
  tenantName: string,
  tenantSlug: string,
  plan: string
): Promise<ProvisionClientResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  // Validation
  const emailClean = email.trim().toLowerCase()
  const slugClean = tenantSlug.trim().toLowerCase()

  if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
    return { error: "Adresse email invalide" }
  }
  if (!tenantName.trim() || tenantName.trim().length < 2) {
    return { error: "Nom du tenant trop court (minimum 2 caractères)" }
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugClean)) {
    return { error: "Slug invalide — uniquement lettres minuscules, chiffres et tirets" }
  }
  const validPlans = ["free", "solo", "pro", "agency", "agency_plus", "enterprise"]
  if (!validPlans.includes(plan)) {
    return { error: "Plan invalide" }
  }

  const supabase = createServiceClient()

  // Vérifier que le slug n'est pas déjà pris
  const { data: existingSlug } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slugClean)
    .maybeSingle()

  if (existingSlug) {
    return { error: `Le slug "${slugClean}" est déjà utilisé` }
  }

  // Étape 1 : inviter l'utilisateur via Supabase Auth Admin
  // inviteUserByEmail crée le compte et envoie un email avec un lien de définition de mot de passe
  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    emailClean,
    {
      data: {
        display_name: displayName.trim() || null,
        onboarding_completed: true,
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }
  )

  if (inviteError || !inviteData?.user) {
    return { error: "Impossible de créer l'utilisateur : " + (inviteError?.message ?? "erreur inconnue") }
  }

  const userId = inviteData.user.id

  // Étape 2 : créer le tenant
  const { data: newTenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      name: tenantName.trim(),
      slug: slugClean,
      plan,
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single()

  if (tenantError || !newTenant) {
    // Rollback : supprimer l'utilisateur Auth créé
    await supabase.auth.admin.deleteUser(userId)
    return { error: "Impossible de créer le tenant : " + (tenantError?.message ?? "erreur inconnue") }
  }

  const tenantId = (newTenant as { id: string }).id

  // Étape 3a : créer ou mettre à jour le profil utilisateur
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: userId,
      email: emailClean,
      display_name: displayName.trim() || null,
      global_role: "user",
      updated_at: new Date().toISOString(),
    })

  if (profileError) {
    // Non-bloquant — l'utilisateur peut compléter son profil plus tard
    log({ level: "error", module: "admin", action: "provision_profile_upsert_failed", metadata: { error: profileError.message, userId } })
  }

  // Étape 3b : lier l'utilisateur au tenant dans tenant_members
  // Note : "owner" est tracké via tenants.owner_id — dans tenant_members le rôle max est "admin"
  const { error: memberError } = await supabase
    .from("tenant_members")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      email: emailClean,
      role: "admin",
      status: "accepted",
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString(),
    })

  if (memberError) {
    log({ level: "error", module: "admin", action: "provision_tenant_members_failed", metadata: { error: memberError.message, tenantId, userId } })
    // Non-bloquant — peut être rectifié manuellement
  }

  return { success: true, tenantId, userId }
}

export type AddUserResult =
  | { success: true; userId: string }
  | { error: string }

/**
 * Ajoute un utilisateur à un tenant existant.
 *
 * Stratégie :
 * 1. Chercher d'abord dans `profiles` par email (tout user inscrit y est via trigger).
 * 2. Si trouvé → rattacher directement à tenant_members, sans invitation.
 * 3. Si absent → inviter via Auth Admin (crée le compte + envoie l'email).
 *
 * Un utilisateur peut appartenir à plusieurs tenants simultanément.
 */
export async function addUserToTenantAction(
  email: string,
  displayName: string,
  tenantId: string,
  role: string
): Promise<AddUserResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const emailClean = email.trim().toLowerCase()
  if (!emailClean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) {
    return { error: "Adresse email invalide" }
  }
  const validRoles = ["admin", "editor", "viewer"]
  if (!validRoles.includes(role)) {
    return { error: "Rôle invalide" }
  }
  if (!tenantId) return { error: "Tenant requis" }

  const supabase = createServiceClient()

  // Vérifier que le tenant existe
  const { data: tenant, error: tenantCheckError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .single()

  if (tenantCheckError || !tenant) {
    return { error: "Tenant introuvable" }
  }

  // Vérifier que l'email n'est pas déjà membre de ce tenant (contrainte UNIQUE tenant_id, email)
  const { data: existingMember } = await supabase
    .from("tenant_members")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("email", emailClean)
    .maybeSingle()

  if (existingMember) {
    const statusLabel = (existingMember.status as string) === "pending" ? " (invitation en attente)" : ""
    return { error: `${emailClean} est déjà membre de ce tenant${statusLabel}` }
  }

  // ── Étape 1 : l'utilisateur existe-t-il déjà ? ────────────────────────────
  // Chercher dans profiles — le trigger handle_new_user() l'y insère automatiquement
  // à chaque inscription (register normal, invitation, OAuth).
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", emailClean)
    .maybeSingle()

  let userId: string

  if (existingProfile) {
    // ── Cas A : utilisateur déjà enregistré ───────────────────────────────────
    // Pas d'invitation à envoyer. On rattache directement avec status "accepted".
    userId = existingProfile.id as string
  } else {
    // ── Cas B : nouvel utilisateur — envoyer l'invitation ─────────────────────
    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      emailClean,
      {
        data: {
          display_name: displayName.trim() || null,
          onboarding_completed: true,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      }
    )

    if (inviteError || !inviteData?.user) {
      return {
        error: "Impossible d'inviter l'utilisateur : " + (inviteError?.message ?? "erreur inconnue"),
      }
    }

    userId = inviteData.user.id

    // Le trigger crée le profil automatiquement, mais on s'assure du display_name
    if (displayName.trim()) {
      await supabase
        .from("profiles")
        .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
        .eq("id", userId)
    }
  }

  // ── Étape 2 : insérer dans tenant_members ────────────────────────────────────
  const isExistingUser = !!existingProfile
  const { error: memberError } = await supabase
    .from("tenant_members")
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      email: emailClean,
      role,
      // Utilisateur existant = accès immédiat ; nouvel invité = en attente de clic sur le lien
      status: isExistingUser ? "accepted" : "pending",
      invited_at: new Date().toISOString(),
      accepted_at: isExistingUser ? new Date().toISOString() : null,
    })

  if (memberError) {
    if (!isExistingUser) {
      // Rollback : supprimer l'utilisateur Auth si l'insertion tenant_members a échoué
      await supabase.auth.admin.deleteUser(userId)
    }
    return { error: "Erreur lors du rattachement au tenant : " + memberError.message }
  }

  return { success: true, userId }
}

/**
 * Retourne la liste des tenants (id + name) pour le select du dialog d'ajout utilisateur.
 */
export async function getTenantsListAction(): Promise<
  ActionResult<{ id: string; name: string; slug: string }[]>
> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("tenants")
    .select("id, name, slug")
    .order("name")

  if (error) return { error: error.message }
  return {
    data: (data ?? []).map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
    })),
  }
}

/**
 * Change le plan d'un tenant.
 */
export async function updateTenantPlan(
  tenantId: string,
  plan: string
): Promise<MutationResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const validPlans = ["free", "solo", "pro", "agency", "agency_plus", "enterprise"]
  if (!validPlans.includes(plan)) {
    return { error: "Plan invalide" }
  }

  const supabase = createServiceClient()

  const { error } = await supabase
    .from("tenants")
    .update({ plan, updated_at: new Date().toISOString() })
    .eq("id", tenantId)

  if (error) return { error: "Erreur lors de la mise à jour du plan : " + error.message }

  return { success: true }
}

// ── Admin Users ────────────────────────────────────────────────────────────────

/**
 * Liste paginée des utilisateurs avec recherche.
 */
export async function getAdminUsers(
  page: number = 1,
  search: string = ""
): Promise<ActionResult<{ users: AdminUser[]; total: number }>> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  const PAGE_SIZE = 20
  const offset = (Math.max(1, page) - 1) * PAGE_SIZE

  const supabase = createServiceClient()

  let query = supabase
    .from("profiles")
    .select("id, email, display_name, global_role, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (search.trim()) {
    query = query.or(`email.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`)
  }

  const { data: rows, count, error } = await query

  if (error) return { error: "Erreur lors du chargement des utilisateurs : " + error.message }

  // Charger les tenants associés (via tenant_members)
  const userIds = (rows ?? []).map((r) => r.id as string)
  const tenantNameMap: Record<string, string> = {}

  if (userIds.length > 0) {
    const { data: memberships } = await supabase
      .from("tenant_members")
      .select("user_id, tenant_id")
      .in("user_id", userIds)

    if (memberships && memberships.length > 0) {
      const tenantIds = memberships.map((m) => m.tenant_id as string)
      const { data: tenantRows } = await supabase
        .from("tenants")
        .select("id, name")
        .in("id", tenantIds)

      const tenantMap: Record<string, string> = {}
      for (const t of tenantRows ?? []) {
        tenantMap[t.id as string] = t.name as string
      }
      for (const m of memberships) {
        tenantNameMap[m.user_id as string] = tenantMap[m.tenant_id as string] ?? ""
      }
    }
  }

  const users: AdminUser[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    email: (r.email as string) ?? "",
    display_name: r.display_name as string | null,
    role: (r.global_role as string) ?? "user",
    tenant_name: tenantNameMap[r.id as string] ?? null,
    created_at: r.created_at as string,
  }))

  return { data: { users, total: count ?? 0 } }
}

// ── Edit User ─────────────────────────────────────────────────────────────────

/**
 * Met à jour le profil d'un utilisateur (display_name, email, global_role).
 */
export async function updateUserAction(
  userId: string,
  fields: { display_name?: string; email?: string; global_role?: string }
): Promise<MutationResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  if (!userId) return { error: "userId requis" }

  const supabase = createServiceClient()

  // Mise à jour dans profiles
  const profileUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (fields.display_name !== undefined) profileUpdate.display_name = fields.display_name.trim() || null
  if (fields.global_role !== undefined) {
    if (!["user", "super_admin"].includes(fields.global_role)) return { error: "Rôle invalide" }
    profileUpdate.global_role = fields.global_role
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", userId)

  if (profileError) return { error: "Erreur mise à jour profil : " + profileError.message }

  // Mise à jour email dans auth.users (si fourni)
  if (fields.email) {
    const emailClean = fields.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailClean)) return { error: "Email invalide" }

    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      email: emailClean,
    })
    if (authError) return { error: "Erreur mise à jour email : " + authError.message }

    // Synchroniser l'email dans profiles
    await supabase.from("profiles").update({ email: emailClean }).eq("id", userId)
  }

  return { success: true }
}

/**
 * Change le mot de passe d'un utilisateur directement (sans email de réinitialisation).
 * Utilise l'API Admin Supabase — ne requiert pas l'ancien mot de passe.
 */
export async function resetUserPasswordAction(
  userId: string,
  newPassword: string
): Promise<MutationResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  if (!userId) return { error: "userId requis" }
  if (!newPassword || newPassword.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères" }
  }

  const supabase = createServiceClient()

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  })

  if (error) return { error: "Erreur changement mot de passe : " + error.message }

  return { success: true }
}

// ── Edit Tenant ────────────────────────────────────────────────────────────────

/**
 * Met à jour les informations d'un tenant (nom, slug, plan).
 */
export async function updateTenantAction(
  tenantId: string,
  fields: { name?: string; slug?: string; plan?: string }
): Promise<MutationResult> {
  const err = await assertSuperAdmin()
  if (err) return { error: err }

  if (!tenantId) return { error: "tenantId requis" }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (fields.name !== undefined) {
    const name = fields.name.trim()
    if (name.length < 2) return { error: "Nom trop court (minimum 2 caractères)" }
    update.name = name
  }

  if (fields.slug !== undefined) {
    const slug = fields.slug.trim().toLowerCase()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      return { error: "Slug invalide — uniquement minuscules, chiffres et tirets" }
    }
    const supabase = createServiceClient()
    // Vérifier unicité du slug (sauf pour ce tenant)
    const { data: existing } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .neq("id", tenantId)
      .maybeSingle()
    if (existing) return { error: `Le slug "${slug}" est déjà pris` }
    update.slug = slug
  }

  if (fields.plan !== undefined) {
    const validPlans = ["free", "solo", "pro", "agency", "agency_plus", "enterprise"]
    if (!validPlans.includes(fields.plan)) return { error: "Plan invalide" }
    update.plan = fields.plan
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from("tenants").update(update).eq("id", tenantId)

  if (error) return { error: "Erreur mise à jour tenant : " + error.message }

  return { success: true }
}

// ── Helpers privés ────────────────────────────────────────────────────────────

async function pingProvider(provider: string, apiKey: string): Promise<void> {
  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 10,
        messages: [{ role: "user", content: "ping" }],
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "openrouter") {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "perplexity") {
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "fal_ai") {
    const res = await fetch("https://fal.run/fal-ai/flux/dev", {
      method: "POST",
      headers: {
        Authorization: `Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt: "test", num_images: 1, num_inference_steps: 1 }),
      signal: AbortSignal.timeout(15_000),
    })
    // 422 = payload valide mais mauvais params → clé OK
    if (!res.ok && res.status !== 422) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "replicate") {
    const res = await fetch("https://api.replicate.com/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "together_ai") {
    const res = await fetch("https://api.together.xyz/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "moonshot") {
    const res = await fetch("https://api.moonshot.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "google") {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  if (provider === "mistral") {
    const res = await fetch("https://api.mistral.ai/v1/models", {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return
  }

  throw new Error(`Provider "${provider}" non supporté pour le test`)
}
