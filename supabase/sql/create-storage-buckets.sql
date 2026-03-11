-- ============================================================
-- RAMI — Création des buckets Supabase Storage
-- Exécuter via le dashboard Supabase > SQL Editor
-- ou : supabase db execute --file supabase/sql/create-storage-buckets.sql
-- ============================================================
-- NOTE : Contrairement aux migrations Drizzle, la création des buckets
-- Supabase Storage se fait via l'API storage (table storage.buckets).
-- Ce fichier doit être exécuté avec le rôle service_role (postgres).
-- ============================================================

-- ── Bucket "logos" — logos tenant (PUBLIC) ───────────────────────────────────
-- Accès public en lecture (pas d'auth requis pour afficher un logo)
-- Taille max : 2 Mo | Types : images uniquement

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'logos',
  'logos',
  TRUE,
  2097152,  -- 2 Mo
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
  public             = TRUE,
  file_size_limit    = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

-- ── Bucket "media" — images/vidéos posts (PRIVÉ par tenant) ──────────────────
-- Privé : lecture uniquement via URL signée ou authentifié
-- Taille max : 10 Mo | Types : images + vidéos courtes

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  FALSE,
  10485760,  -- 10 Mo
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = FALSE,
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
    'video/mp4', 'video/webm'
  ];

-- ── Bucket "audios" — fichiers audio pour transcription (PRIVÉ) ───────────────
-- Privé : accès authentifié uniquement, URL signée pour téléchargement
-- Taille max : 500 Mo | Types : audio + vidéo (Whisper accepte les deux)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audios',
  'audios',
  FALSE,
  524288000,  -- 500 Mo
  ARRAY[
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm',
    'video/mp4', 'video/webm', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public             = FALSE,
  file_size_limit    = 524288000,
  allowed_mime_types = ARRAY[
    'audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg', 'audio/webm',
    'video/mp4', 'video/webm', 'video/quicktime'
  ];

-- ── Bucket "docs" — documents PDF (PRIVÉ) ────────────────────────────────────
-- Privé : offres commerciales, rapports clients, PDFs générés
-- Taille max : 50 Mo | Types : PDF uniquement

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'docs',
  'docs',
  FALSE,
  52428800,  -- 50 Mo
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public             = FALSE,
  file_size_limit    = 52428800,
  allowed_mime_types = ARRAY['application/pdf'];

-- ── RLS Policies — Bucket "logos" (public en lecture) ────────────────────────

-- Lecture publique (anon + authenticated)
DO $$ BEGIN
  CREATE POLICY "logos_public_read" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'logos');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Upload : authenticated, dans son propre dossier {tenant_id}/
DO $$ BEGIN
  CREATE POLICY "logos_tenant_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'logos' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Suppression : authenticated, ses propres fichiers
DO $$ BEGIN
  CREATE POLICY "logos_tenant_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'logos' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RLS Policies — Bucket "media" (privé par tenant) ─────────────────────────

DO $$ BEGIN
  CREATE POLICY "media_tenant_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'media' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_tenant_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'media' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "media_tenant_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'media' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RLS Policies — Bucket "audios" (privé par tenant) ────────────────────────

DO $$ BEGIN
  CREATE POLICY "audios_tenant_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'audios' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "audios_tenant_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'audios' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "audios_tenant_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'audios' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RLS Policies — Bucket "docs" (privé par tenant) ──────────────────────────

DO $$ BEGIN
  CREATE POLICY "docs_tenant_insert" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'docs' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "docs_tenant_select" ON storage.objects
    FOR SELECT TO authenticated
    USING (
      bucket_id = 'docs' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "docs_tenant_delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'docs' AND
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM tenants WHERE owner_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
