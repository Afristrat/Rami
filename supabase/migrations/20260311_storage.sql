-- ============================================================
-- RAMI — Storage Layer Migration
-- Buckets Supabase Storage + table media étendue + RLS
-- ============================================================

-- ── Extension de la table media existante ────────────────────────────────────
-- Ajout des colonnes nécessaires au service storage

ALTER TABLE media
  ADD COLUMN IF NOT EXISTS bucket        TEXT NOT NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS width         INTEGER,
  ADD COLUMN IF NOT EXISTS height        INTEGER,
  ADD COLUMN IF NOT EXISTS was_resized   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS compression_ratio INTEGER;

-- Index pour les recherches par tenant + catégorie
CREATE INDEX IF NOT EXISTS idx_media_tenant_id ON media (tenant_id);
CREATE INDEX IF NOT EXISTS idx_media_tenant_created ON media (tenant_id, created_at DESC);

-- ── RLS sur la table media ────────────────────────────────────────────────────
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Lecture : tenant voit uniquement ses propres assets
CREATE POLICY "tenant_select_own_media" ON media
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Insertion : tenant peut insérer dans son propre espace
CREATE POLICY "tenant_insert_own_media" ON media
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Suppression : tenant peut supprimer ses propres assets
CREATE POLICY "tenant_delete_own_media" ON media
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- ── Buckets Supabase Storage ──────────────────────────────────────────────────
-- Note : la création des buckets se fait via l'API Supabase Storage
-- ou via le dashboard. Ce SQL documente leur configuration.

-- Bucket "media" — images/vidéos des posts (PUBLIC)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'media', 'media', TRUE, 10485760,
--   ARRAY['image/jpeg','image/png','image/webp','image/gif','image/svg+xml','video/mp4','video/webm']
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   public = TRUE,
--   file_size_limit = 10485760;

-- Bucket "logos" — logos tenant (PUBLIC)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'logos', 'logos', TRUE, 2097152,
--   ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   public = TRUE,
--   file_size_limit = 2097152;

-- Bucket "audios" — transcriptions (PRIVÉ, URL signée)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'audios', 'audios', FALSE, 524288000,
--   ARRAY['audio/mpeg','audio/mp4','audio/wav','audio/ogg','audio/webm','video/mp4','video/webm']
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   public = FALSE,
--   file_size_limit = 524288000;

-- Bucket "docs" — documents PDF (PRIVÉ, URL signée)
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'docs', 'docs', FALSE, 52428800,
--   ARRAY['application/pdf']
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   public = FALSE,
--   file_size_limit = 52428800;

-- ── Storage RLS policies ──────────────────────────────────────────────────────
-- Chaque tenant ne peut lire/écrire que dans son propre dossier {tenant_id}/

-- Bucket "media"
CREATE POLICY "tenant_upload_own_media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "tenant_read_own_media" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "public_read_media" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'media');

CREATE POLICY "tenant_delete_own_media_storage" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Bucket "logos"
CREATE POLICY "tenant_upload_own_logo" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "public_read_logos" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'logos');

CREATE POLICY "tenant_delete_own_logo" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Bucket "audios" (privé)
CREATE POLICY "tenant_upload_own_audio" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audios' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "tenant_read_own_audio" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'audios' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "tenant_delete_own_audio" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'audios' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Bucket "docs" (privé)
CREATE POLICY "tenant_upload_own_doc" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'docs' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "tenant_read_own_doc" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'docs' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "tenant_delete_own_doc" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'docs' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );
