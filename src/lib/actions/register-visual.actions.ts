'use server'

// ============================================================
// Register Visual Actions — référence des visuels générés dans la bibliothèque
// SANS DUPLICATION DE STOCKAGE. Les visuels sont déjà stockés sur MinIO
// (s3-rami) par generateVisualsAction ; on insère seulement une ligne
// media_assets pointant vers l'URL existante (public_url = URL MinIO).
// Évite le re-download + re-upload Supabase (gaspillage + échec en prod).
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { log } from '@/lib/utils/logger'

export interface RegisterVisualItem {
  url: string
  directionId: number
  directionName: string
  brandDnaScore: number
}

export type RegisterVisualsResult =
  | { assetIds: string[]; failed: number }
  | { error: string }

function mimeFromName(name: string): string {
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.svg')) return 'image/svg+xml'
  return 'image/webp'
}

export async function registerVisualsToLibraryAction(
  items: RegisterVisualItem[],
): Promise<RegisterVisualsResult> {
  if (items.length === 0) return { assetIds: [], failed: 0 }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { error: 'Tenant introuvable.' }

  const rows = items.map((it) => {
    let pathname = it.url
    try {
      pathname = new URL(it.url).pathname.replace(/^\//, '')
    } catch {
      // URL non standard → on garde la valeur brute
    }
    const filename = pathname.split('/').pop() ?? `visual-d${it.directionId}.webp`
    return {
      tenant_id: tenantId,
      user_id: user.id,
      filename,
      original_filename: filename,
      file_type: 'image',
      mime_type: mimeFromName(filename),
      file_size_bytes: 0, // référence externe (MinIO) — taille non re-mesurée
      storage_path: pathname,
      public_url: it.url,
      metadata: {
        source: 'visual_engine',
        external_storage: 'minio',
        direction_id: it.directionId,
        direction_name: it.directionName,
        brand_dna_score: it.brandDnaScore,
      },
    }
  })

  const { data, error } = await supabase.from('media_assets').insert(rows).select('id')
  if (error) {
    log({ level: 'error', module: 'register_visual', action: 'insert_failed', tenant_id: tenantId, metadata: { error: error.message } })
    return { error: error.message }
  }

  const assetIds = (data ?? []).map((r) => r.id as string)
  return { assetIds, failed: items.length - assetIds.length }
}
