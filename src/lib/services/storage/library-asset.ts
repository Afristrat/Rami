// ============================================================
// Enregistrement d'un visuel généré comme asset RÉUTILISABLE (media_assets)
// ============================================================
// Le visuel est déjà stocké sur MinIO (storeVisual) ; on n'ajoute qu'une ligne
// `media_assets` pour qu'il apparaisse dans la bibliothèque et soit réutilisable
// (fin du gaspillage : chaque image générée est conservée, pas seulement la
// sélectionnée). Best-effort : ne lève jamais — le visuel reste exploitable même
// si l'enregistrement bibliothèque échoue.

import type { SupabaseClient } from "@supabase/supabase-js"
import type { StoreVisualResult } from "./visual-storage"

export interface RegisterLibraryAssetParams {
  tenantId: string
  userId: string
  stored: StoreVisualResult
  brandDnaScore: number // 0-1
  provider: string
  /** Origine (ex. "workflow", "visual_engine") — tracé dans metadata. */
  source: string
}

export async function registerLibraryAsset(
  supabase: SupabaseClient,
  params: RegisterLibraryAssetParams
): Promise<void> {
  const { tenantId, userId, stored, brandDnaScore, provider, source } = params
  const filename = stored.minio_path.split("/").pop() ?? `rami-visual-${Date.now()}.webp`

  await supabase.from("media_assets").insert({
    tenant_id: tenantId,
    user_id: userId,
    filename,
    original_filename: filename,
    file_type: "image",
    mime_type: "image/webp",
    file_size_bytes: stored.file_size_bytes,
    storage_path: stored.minio_path,
    public_url: stored.public_url,
    metadata: {
      source,
      provider,
      brand_dna_score: Math.round(Math.min(1, Math.max(0, brandDnaScore)) * 100),
      width: stored.width,
      height: stored.height,
    },
  })
}
