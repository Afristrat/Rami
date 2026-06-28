'use server'

// ============================================================
// Video Productions Actions — historique des productions Mishkāt
// Les MP4 sont servis directement depuis l'URL MinIO publique permanente
// renvoyée par Mishkāt (variants[].public_url), persistée dans video_productions.
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import type { ArchivedVariant } from '@/lib/services/mishkat/archive'

export interface VideoProductionSummary {
  jobId: string
  status: string
  createdAt: string
  intent: string
  variants: ArchivedVariant[]
}

export type GetVideoProductionsResult =
  | { data: VideoProductionSummary[] }
  | { error: string }

export async function getVideoProductionsAction(limit = 12): Promise<GetVideoProductionsResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: 'Tenant introuvable.' }

  const { data, error } = await supabase
    .from('video_productions')
    .select('mishkat_job_id, status, variants, brief, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    // Table absente (pas encore migrée) — historique vide plutôt qu'erreur.
    if (error.code === '42P01') return { data: [] }
    return { error: 'Erreur lors du chargement des productions.' }
  }

  const data2: VideoProductionSummary[] = (data ?? []).map((row) => {
    const brief = (row.brief as { intent?: string } | null) ?? {}
    const variants = Array.isArray(row.variants) ? (row.variants as ArchivedVariant[]) : []
    return {
      jobId: row.mishkat_job_id as string,
      status: (row.status as string) ?? 'unknown',
      createdAt: row.created_at as string,
      intent: brief.intent ?? '',
      variants,
    }
  })

  return { data: data2 }
}
