-- ============================================================
-- Migration : media_assets
-- Médiathèque par tenant — images, vidéos, documents
-- ============================================================

CREATE TABLE IF NOT EXISTS media_assets (
  id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES auth.users(id),
  filename          TEXT        NOT NULL,
  original_filename TEXT        NOT NULL,
  file_type         TEXT        NOT NULL CHECK (file_type IN ('image', 'video', 'document')),
  mime_type         TEXT        NOT NULL,
  file_size_bytes   BIGINT      NOT NULL DEFAULT 0,
  storage_path      TEXT        NOT NULL,
  public_url        TEXT,
  thumbnail_url     TEXT,
  metadata          JSONB       DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les filtres courants
CREATE INDEX IF NOT EXISTS media_assets_tenant_id_idx    ON media_assets (tenant_id);
CREATE INDEX IF NOT EXISTS media_assets_file_type_idx    ON media_assets (tenant_id, file_type);
CREATE INDEX IF NOT EXISTS media_assets_filename_idx     ON media_assets USING gin (to_tsvector('simple', original_filename));
CREATE INDEX IF NOT EXISTS media_assets_created_at_idx   ON media_assets (tenant_id, created_at DESC);

-- RLS
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Lecture : tenant uniquement
CREATE POLICY "media_tenant_select" ON media_assets
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Insertion : tenant uniquement
CREATE POLICY "media_tenant_insert" ON media_assets
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Suppression : tenant uniquement
CREATE POLICY "media_tenant_delete" ON media_assets
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_media_assets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_media_assets_updated_at();
