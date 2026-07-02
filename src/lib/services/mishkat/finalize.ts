// ============================================================
// Mishkāt — Finalisation d'une production (statut live → persistance DB)
//
// Logique UNIQUE partagée par deux appelants :
//   1. GET /api/video/[id]  — polling navigateur (temps réel, tant qu'un onglet est ouvert)
//   2. render-watch-worker  — polling serveur (pg-boss, survit à la fermeture de l'onglet)
//
// Root cause corrigée (2026-07-02) : avant cette extraction, seul le navigateur
// écrivait `status: done` en base. Un rendu Mishkāt dépassant le budget de patience
// du client (~7-8 min observés en prod, cf. journal Mishkāt) laissait la ligne
// `video_productions` bloquée sur `rendering` pour toujours, alors que la vidéo
// existait déjà (MP4 archivé sur MinIO). Le worker de fond garantit désormais que
// la ligne converge vers `done`/`error` indépendamment de la présence d'un onglet.
// ============================================================

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getProduction } from './client'
import { archiveProductionIfNeeded, toPermanentVariants, type ArchivedVariant } from './archive'
import type { MishkatProduction } from './types'

export interface FinalizeOutcome {
  live: MishkatProduction
  variants?: ArchivedVariant[]
}

/**
 * Interroge Mishkāt pour le job de rendu `effectiveJobId` et persiste le résultat
 * dans la ligne `video_productions` identifiée par `productionRowId`.
 * `userId` n'est nécessaire que pour la copie de redondance MinIO optionnelle
 * (`MISHKAT_ARCHIVE_REDUNDANT_COPY=true`) ; absent (ex. worker de fond sans
 * session), on persiste l'URL permanente Mishkāt telle quelle.
 */
export async function pollAndPersistProduction(
  supabase: SupabaseClient,
  tenantId: string,
  productionRowId: string,
  effectiveJobId: string,
  existingVariants: ArchivedVariant[],
  opts: { userId?: string } = {},
): Promise<FinalizeOutcome> {
  const live = await getProduction(effectiveJobId)

  if (live.status === 'done') {
    const liveVariants = live.variants ?? []
    const variants =
      opts.userId && process.env.MISHKAT_ARCHIVE_REDUNDANT_COPY === 'true'
        ? await archiveProductionIfNeeded(supabase, tenantId, opts.userId, effectiveJobId, liveVariants, existingVariants)
        : toPermanentVariants(liveVariants, existingVariants)

    await supabase
      .from('video_productions')
      .update({ status: 'done', variants, updated_at: new Date().toISOString() })
      .eq('id', productionRowId)
      .eq('tenant_id', tenantId)

    return { live, variants }
  }

  await supabase
    .from('video_productions')
    .update({ status: live.status, error_message: live.error ?? null, updated_at: new Date().toISOString() })
    .eq('id', productionRowId)
    .eq('tenant_id', tenantId)

  return { live }
}
