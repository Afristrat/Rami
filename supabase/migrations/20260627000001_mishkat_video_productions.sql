-- ============================================================
-- Mishkāt — Productions vidéo (studio externe par API)
-- Une production = un job Mishkāt → jusqu'à 4 variantes (lang × format).
-- Les MP4 finaux sont archivés dans media_assets (bibliothèque tenant).
-- ============================================================

CREATE TABLE IF NOT EXISTS video_productions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mishkat_job_id  TEXT NOT NULL,
  mode            VARCHAR(16) NOT NULL DEFAULT 'v1_pool',   -- v1_pool | v2_scene
  status          VARCHAR(16) NOT NULL DEFAULT 'queued',    -- queued|generating|rendering|done|error
  brief           JSONB NOT NULL,
  brand_snapshot  JSONB,
  storyboard      JSONB,
  variants        JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{lang,format,gatePassed,url,media_id,public_url}]
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_productions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_video_productions" ON video_productions;
CREATE POLICY "tenant_isolation_video_productions" ON video_productions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT t.id FROM tenants t
      INNER JOIN tenant_members tm ON tm.tenant_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_video_productions_tenant ON video_productions (tenant_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_video_productions_job ON video_productions (mishkat_job_id);
