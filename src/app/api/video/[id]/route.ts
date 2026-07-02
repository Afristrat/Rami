// ============================================================
// GET /api/video/:id — Relais du polling Mishkāt
// Renvoie le statut live ; quand `done`, persiste les variants[].url (URLs MinIO
// publiques permanentes que Mishkāt archive lui-même — plus de re-download).
// Copie de redondance souveraine optionnelle via MISHKAT_ARCHIVE_REDUNDANT_COPY.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { MishkatConfigError } from '@/lib/services/mishkat/client'
import { pollAndPersistProduction } from '@/lib/services/mishkat/finalize'
import type { ArchivedVariant } from '@/lib/services/mishkat/archive'
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
    .select('id, status, variants, mode, storyboard, render_job_id, error_message')
    .eq('mishkat_job_id', id)
    .eq('tenant_id', tenantId)
    .single<{ id: string; status: string; variants: unknown; mode: string; storyboard: unknown; render_job_id: string | null; error_message: string | null }>()
  if (!prod) return NextResponse.json({ error: 'Production introuvable.' }, { status: 404 })

  const kind = (prod.mode as string) ?? 'v1_pool'
  const renderJobId = (prod.render_job_id as string | null) ?? null

  // v2 « par scène » en phase storyboard/génération d'images : le worker travaille
  // (pas encore de job de rendu). On renvoie le statut de la ligne — surtout PAS le
  // statut du job storyboard, dont le « done » signifierait à tort « vidéo prête ».
  if (kind === 'v2_scene' && !renderJobId) {
    return NextResponse.json({
      status: (prod.status as string) ?? 'generating',
      kind,
      storyboard: prod.storyboard ?? null,
      error: (prod.error_message as string | null) ?? undefined,
    })
  }

  // Job à suivre : le rendu (render_job_id) en v2, sinon le job unique (v1).
  const effectiveJobId = renderJobId ?? id

  const existing = Array.isArray(prod.variants) ? (prod.variants as ArchivedVariant[]) : []

  let outcome
  try {
    outcome = await pollAndPersistProduction(supabase, tenantId, prod.id, effectiveJobId, existing, { userId: user.id })
  } catch (err) {
    if (err instanceof MishkatConfigError) {
      return NextResponse.json({ error: 'Studio vidéo indisponible.' }, { status: 503 })
    }
    const message = err instanceof Error ? err.message : 'Erreur Mishkāt'
    log({ level: 'error', module: 'mishkat', action: 'poll_failed', tenant_id: tenantId, metadata: { jobId: id, error: message } })
    return NextResponse.json({ error: 'Erreur de suivi de la production.' }, { status: 502 })
  }

  const { live, variants } = outcome
  if (live.status === 'done') {
    return NextResponse.json({ status: 'done', kind, storyboard: live.storyboard ?? prod.storyboard ?? null, variants })
  }

  return NextResponse.json({ status: live.status, kind, storyboard: live.storyboard ?? prod.storyboard ?? null, error: live.error })
}
