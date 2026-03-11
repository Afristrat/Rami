-- ============================================================
-- RAMI — Création des buckets Supabase Storage
-- À exécuter via le dashboard Supabase SQL Editor
-- ou : psql $SUPABASE_DB_URL -f supabase/sql/create-storage-buckets.sql
--
-- Buckets :
--   logos  — logos tenant            PUBLIC  (2 MB max)
--   media  — images/vidéos des posts PUBLIC  (10 MB max)
--   audios — fichiers audio          PRIVÉ   (500 MB max, URL signées)
--   docs   — documents PDF           PRIVÉ   (50 MB max, URL signées)
-- ============================================================

-- ── Création des buckets ──────────────────────────────────────────────────────

-- Bucket "logos" — PUBLIC
-- Accessible directement sans authentification (URL publique CDN)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  TRUE,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public            = TRUE,
  file_size_limit   = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- Bucket "media" — PUBLIC
-- Images et vidéos des posts sociaux, CDN public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  TRUE,
  10485760,  -- 10 MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public            = TRUE,
  file_size_limit   = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm'
  ];

-- Bucket "audios" — PRIVÉ
-- Fichiers audio pour transcription (URL signées, accès tenant uniquement)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audios',
  'audios',
  FALSE,
  524288000,  -- 500 MB
  ARRAY[
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
    'audio/webm', 'video/mp4', 'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public            = FALSE,
  file_size_limit   = 524288000,
  allowed_mime_types = ARRAY[
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg',
    'audio/webm', 'video/mp4', 'video/webm'
  ];

-- Bucket "docs" — PRIVÉ
-- Documents PDF (rapports clients, offres commerciales)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'docs',
  'docs',
  FALSE,
  52428800,  -- 50 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public            = FALSE,
  file_size_limit   = 52428800,
  allowed_mime_types = ARRAY['application/pdf'];

-- ── Politiques RLS — Bucket "logos" (PUBLIC) ─────────────────────────────────
-- Lecture publique (CDN)
DO $$ BEGIN
  DROP POLICY IF EXISTS "logos_public_read" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "logos_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'logos');

-- Upload : tenant uniquement dans son propre dossier {tenant_id}/
DO $$ BEGIN
  DROP POLICY IF EXISTS "logos_tenant_upload" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "logos_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Suppression : tenant uniquement dans son propre dossier
DO $$ BEGIN
  DROP POLICY IF EXISTS "logos_tenant_delete" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "logos_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'logos'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- ── Politiques RLS — Bucket "media" (PUBLIC) ─────────────────────────────────
-- Lecture publique (CDN)
DO $$ BEGIN
  DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'media');

-- Upload : tenant uniquement dans son propre dossier
DO $$ BEGIN
  DROP POLICY IF EXISTS "media_tenant_upload" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "media_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Suppression : tenant uniquement dans son propre dossier
DO $$ BEGIN
  DROP POLICY IF EXISTS "media_tenant_delete" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "media_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- ── Politiques RLS — Bucket "audios" (PRIVÉ par tenant) ──────────────────────
-- Lecture : tenant uniquement (via URL signée)
DO $$ BEGIN
  DROP POLICY IF EXISTS "audios_tenant_read" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "audios_tenant_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'audios'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Upload
DO $$ BEGIN
  DROP POLICY IF EXISTS "audios_tenant_upload" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "audios_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'audios'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Suppression
DO $$ BEGIN
  DROP POLICY IF EXISTS "audios_tenant_delete" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "audios_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'audios'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- ── Politiques RLS — Bucket "docs" (PRIVÉ par tenant) ────────────────────────
-- Lecture : tenant uniquement (via URL signée)
DO $$ BEGIN
  DROP POLICY IF EXISTS "docs_tenant_read" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "docs_tenant_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'docs'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Upload
DO $$ BEGIN
  DROP POLICY IF EXISTS "docs_tenant_upload" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "docs_tenant_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'docs'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Suppression
DO $$ BEGIN
  DROP POLICY IF EXISTS "docs_tenant_delete" ON storage.objects;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "docs_tenant_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'docs'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM tenants WHERE owner_id = auth.uid()
    )
  );
