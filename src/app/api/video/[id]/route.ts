// ============================================================
// GET /api/video/:id — Relais du polling Mishkāt
// Renvoie le statut live ; quand `done`, persiste les variants[].url (URLs MinIO
// publiques permanentes que Mishkāt archive lui-même — plus de re-download).
// Copie de redondance souveraine optionnelle via MISHKAT_ARCHIVE_REDUNDANT_COPY.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { getProduction, MishkatConfigError } from '@/lib/services/mishkat/client'
import { archiveProductionIfNeeded, toPermanentVariants, type ArchivedVariant } from '@/lib/services/mishkat/archive'
import { log } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable.' }, { status: 404 })

  // Garde-fou : la production doit appartenir au tenant (défense en profondeur + RLS).
  const { data: prod } = await supabase
    .from('video_productions')
    .select('id, status, variants, mode, storyboard')
    .eq('mishkat_job_id', id)
    .eq('tenant_id', tenantId)
    .single()
  if (!prod) return NextResponse.json({ error: 'Production introuvable.' }, { status: 404 })

  const kind = (prod.mode as string) ?? 'v1_pool'

  let live
  try {
    live = await getProduction(id)
  } catch (err) {
    if (err instanceof MishkatConfigError) {
      return NextResponse.json({ error: 'Studio vidéo indisponible.' }, { status: 503 })
    }
    const message = err instanceof Error ? err.message : 'Erreur Mishkāt'
    log({ level: 'error', module: 'mishkat', action: 'poll_failed', tenant_id: tenantId, metadata: { jobId: id, error: message } })
    return NextResponse.json({ error: 'Erreur de suivi de la production.' }, { status: 502 })
  }

  if (live.status === 'done') {
    const existing = Array.isArray(prod.variants) ? (prod.variants as ArchivedVariant[]) : []
    const liveVariants = live.variants ?? []
    // Par défaut : on persiste l'URL MinIO permanente fournie par Mishkāt (pas de
    // re-download). Copie de redondance souveraine seulement si explicitement activée.
    const variants =
      process.env.MISHKAT_ARCHIVE_REDUNDANT_COPY === 'true'
        ? await archiveProductionIfNeeded(supabase, tenantId, user.id, id, liveVariants, existing)
        : toPermanentVariants(liveVariants, existing)

    await supabase
      .from('video_productions')
      .update({ status: 'done', variants, updated_at: new Date().toISOString() })
      .eq('mishkat_job_id', id)
      .eq('tenant_id', tenantId)

    return NextResponse.json({ status: 'done', kind, storyboard: live.storyboard ?? prod.storyboard ?? null, variants })
  }

  await supabase
    .from('video_productions')
    .update({ status: live.status, error_message: live.error ?? null, updated_at: new Date().toISOString() })
    .eq('mishkat_job_id', id)
    .eq('tenant_id', tenantId)

  return NextResponse.json({ status: live.status, kind, storyboard: live.storyboard ?? prod.storyboard ?? null, error: live.error })
}
