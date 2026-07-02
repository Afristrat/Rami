// ============================================================
// POST /api/video/create — Proxy serveur vers le studio Mishkāt
// Construit brief + BrandTokens (inline) depuis le Brand DNA + les images
// de la bibliothèque, lance la production, persiste le job. La clé
// MISHKAT_API_KEY ne transite jamais côté client.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { getBrandDnaAction } from '@/lib/actions/brand-dna.actions'
import { resolveBrandIdentity } from '@/lib/services/brand-dna/resolver'
import { MishkatVideoInputSchema, toMishkatBrief } from '@/lib/schemas/mishkat-video.schema'
import { buildBrandTokens } from '@/lib/services/mishkat/brand-tokens'
import { resolveBackgroundUrls, resolveAutoBackgroundUrls, resolveLogoUrl } from '@/lib/services/mishkat/backgrounds'
import { createProduction, createStoryboard, MishkatConfigError } from '@/lib/services/mishkat/client'
import { enqueueSceneVideo, enqueueRenderWatch } from '@/lib/queue/pgboss'
import { log } from '@/lib/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable.' }, { status: 404 })

  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 })
  }

  const parsed = MishkatVideoInputSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Paramètres invalides.', details: parsed.error.issues }, { status: 400 })
  }

  // brand_id Mishkāt = slug du tenant (fallback id) ; brand_dna brut pour le resolver
  const { data: tenantRow } = await supabase.from('tenants').select('slug, brand_dna').eq('id', tenantId).single()
  const brandId = tenantRow?.slug ?? tenantId

  const dnaResult = await getBrandDnaAction()
  const dna = 'data' in dnaResult ? dnaResult.data : null

  // Identité visuelle résolue (accent, contraste WCAG, forme Gestalt, objectif
  // cognitif…) = base du spec psychologique calibré envoyé au studio.
  const identity = resolveBrandIdentity(tenantRow?.brand_dna ?? null, { tenantName: dna?.brandName ?? null })

  // Fonds : sélection explicite de l'utilisateur en priorité ; à défaut, repli
  // « impact » sur les visuels Causse générés de la bibliothèque (pas de mesh vide).
  let backgrounds = await resolveBackgroundUrls(supabase, tenantId, parsed.data.assetIds)
  if (backgrounds.length === 0) {
    backgrounds = await resolveAutoBackgroundUrls(supabase, tenantId, 3)
  }
  const logoUrl = await resolveLogoUrl(supabase, tenantId, dna)

  const brief = toMishkatBrief(brandId, parsed.data)
  const brand = buildBrandTokens(
    brandId,
    identity,
    { objective: parsed.data.objective, tone: parsed.data.tone },
    { backgrounds, logoUrl },
  )

  try {
    // ── Flux v2 « par scène » : storyboard d'abord, puis le worker génère une
    // image par scène et lance le rendu. Le client suit par l'id du storyboard. ──
    if (parsed.data.mode === 'v2_scene') {
      const { id: storyboardId } = await createStoryboard({ brief, brand })

      const { data: inserted, error: insErr } = await supabase
        .from('video_productions')
        .insert({
          tenant_id: tenantId,
          mishkat_job_id: storyboardId,
          mode: 'v2_scene',
          status: 'generating',
          brief,
          brand_snapshot: brand,
        })
        .select('id')
        .single<{ id: string }>()

      if (insErr || !inserted) {
        log({ level: 'error', module: 'mishkat', action: 'production_persist_failed', tenant_id: tenantId, metadata: { jobId: storyboardId, error: insErr?.message } })
        return NextResponse.json({ error: 'Échec de l\'enregistrement de la production.' }, { status: 500 })
      }

      await enqueueSceneVideo({ productionRowId: inserted.id, tenantId })
      log({ level: 'info', module: 'mishkat', action: 'scene_video_enqueued', tenant_id: tenantId, metadata: { jobId: storyboardId, rowId: inserted.id } })
      return NextResponse.json({ id: storyboardId, status: 'generating' }, { status: 202 })
    }

    // ── Flux v1 « pool » : rendu direct depuis le pool d'images. ──
    const { id, status } = await createProduction({ brief, brand })

    const { data: inserted, error: insErr } = await supabase
      .from('video_productions')
      .insert({
        tenant_id: tenantId,
        mishkat_job_id: id,
        mode: 'v1_pool',
        status,
        brief,
        brand_snapshot: brand,
      })
      .select('id')
      .single<{ id: string }>()
    if (insErr || !inserted) {
      log({ level: 'error', module: 'mishkat', action: 'production_persist_failed', tenant_id: tenantId, metadata: { jobId: id, error: insErr?.message } })
    } else {
      // Suivi de fond indépendant du navigateur (cf. render-watch-worker) : garantit
      // que la ligne converge vers done/error même si l'onglet est fermé ou que le
      // polling client abandonne avant la fin réelle du rendu.
      await enqueueRenderWatch({ productionRowId: inserted.id, tenantId, mishkatJobId: id })
    }

    log({ level: 'info', module: 'mishkat', action: 'production_created', tenant_id: tenantId, metadata: { jobId: id, backgrounds: backgrounds.length } })
    return NextResponse.json({ id, status }, { status: 202 })
  } catch (err) {
    if (err instanceof MishkatConfigError) {
      log({ level: 'critical', module: 'mishkat', action: 'config_missing', tenant_id: tenantId })
      return NextResponse.json({ error: 'Studio vidéo indisponible (configuration manquante).' }, { status: 503 })
    }
    const message = err instanceof Error ? err.message : 'Erreur Mishkāt'
    log({ level: 'error', module: 'mishkat', action: 'production_create_failed', tenant_id: tenantId, metadata: { error: message } })
    return NextResponse.json({ error: 'Échec du lancement de la production vidéo.' }, { status: 502 })
  }
}
