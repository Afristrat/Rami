/**
 * Guards côté serveur pour les feature flags.
 * À utiliser dans les Server Components et Route Handlers uniquement.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasFeatureAccess, isGenerationQuotaExceeded } from './plans'
import type { Feature, Plan } from './plans'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'

interface TenantPlanData {
  plan: Plan
  generation_count: number
}

/**
 * Récupère le plan du tenant courant.
 * Retourne null si non authentifié ou tenant absent.
 */
export async function getCurrentTenantPlan(): Promise<TenantPlanData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return null

  const { data: tenant } = await supabase
    .from('tenants')
    .select('plan, generation_count')
    .eq('id', tenantId)
    .single<{ plan: string; generation_count: number }>()

  if (!tenant) return null

  return {
    plan: tenant.plan as Plan,
    generation_count: tenant.generation_count ?? 0,
  }
}

/**
 * Vérifie l'accès à une feature côté serveur.
 * Redirige vers /pricing si non autorisé.
 *
 * @example
 * // Dans un Server Component
 * await requireFeature('billing_module')
 */
export async function requireFeature(feature: Feature): Promise<TenantPlanData> {
  const data = await getCurrentTenantPlan()

  if (!data) {
    redirect('/login')
  }

  if (!hasFeatureAccess(data.plan, feature)) {
    redirect(`/pricing?upgrade=1&feature=${feature}`)
  }

  return data
}

/**
 * Vérifie que le quota de génération n'est pas dépassé.
 * Retourne true si ok, false si quota épuisé.
 */
export async function checkGenerationQuota(): Promise<{
  allowed: boolean
  plan: Plan
  count: number
}> {
  const data = await getCurrentTenantPlan()

  if (!data) {
    return { allowed: false, plan: 'free', count: 0 }
  }

  const exceeded = isGenerationQuotaExceeded(data.plan, data.generation_count)

  return {
    allowed: !exceeded,
    plan: data.plan,
    count: data.generation_count,
  }
}
