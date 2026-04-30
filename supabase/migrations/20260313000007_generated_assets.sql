-- ============================================================
-- Migration : enrichissement visual_session_images
-- Ajoute les champs MinIO + Vision AI au Visual Engine
-- SOP-003 : stockage permanent + scoring Claude Haiku
-- ============================================================

-- Stockage MinIO permanent (remplace l'URL temporaire du provider)
ALTER TABLE visual_session_images
  ADD COLUMN IF NOT EXISTS minio_path        TEXT,
  ADD COLUMN IF NOT EXISTS public_url        TEXT,
  ADD COLUMN IF NOT EXISTS file_size_bytes   INTEGER,
  ADD COLUMN IF NOT EXISTS has_watermark     BOOLEAN NOT NULL DEFAULT FALSE;

-- Vision AI scoring (Claude Haiku)
ALTER TABLE visual_session_images
  ADD COLUMN IF NOT EXISTS vision_scored     BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dominant_color_hex TEXT,
  ADD COLUMN IF NOT EXISTS model             TEXT;

-- Index pour requêtes sur minio_path
CREATE INDEX IF NOT EXISTS idx_visual_session_images_minio
  ON visual_session_images (minio_path)
  WHERE minio_path IS NOT NULL;

COMMENT ON COLUMN visual_session_images.minio_path IS
  'Chemin objet MinIO (ex: media/tenant_id/ts-filename.webp). NULL = pas encore stocké.';

COMMENT ON COLUMN visual_session_images.public_url IS
  'URL CDN publique depuis MinIO. NULL si bucket privé (utiliser signed URL depuis image_url).';

COMMENT ON COLUMN visual_session_images.vision_scored IS
  'True si brand_dna_score calculé via Claude Haiku Vision, false si heuristique.';

COMMENT ON COLUMN visual_session_images.has_watermark IS
  'True si le watermark RAMI a été appliqué (plan FREE).';
