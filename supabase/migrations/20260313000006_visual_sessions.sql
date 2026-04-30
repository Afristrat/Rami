-- ============================================================
-- RAMI — Visual Engine : persistance des sessions visuelles
-- Migration : visual_sessions + visual_session_images
-- ============================================================

-- ── Table visual_sessions ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS visual_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES auth.users(id),

  brief           TEXT        NOT NULL,
  platform        TEXT        NOT NULL,
  session_seed    INTEGER,
  image_count     INTEGER     NOT NULL DEFAULT 0,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE visual_sessions IS
  'Sessions de génération du Visual Engine — une session = un brief + N images générées.';

-- ── Table visual_session_images ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS visual_session_images (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID        NOT NULL REFERENCES visual_sessions(id) ON DELETE CASCADE,
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  direction_id      SMALLINT    NOT NULL,
  direction_name    TEXT        NOT NULL,
  direction_style   TEXT,
  direction_emotion TEXT,

  image_url         TEXT        NOT NULL,
  provider          TEXT        NOT NULL,
  brand_dna_score   REAL        NOT NULL DEFAULT 0,
  prompt_used       TEXT,
  seed              BIGINT,
  width             INTEGER,
  height            INTEGER,

  -- Liaison bibliothèque (NULL = pas encore enregistré)
  saved_to_library  BOOLEAN     NOT NULL DEFAULT false,
  library_asset_id  UUID        REFERENCES media_assets(id) ON DELETE SET NULL,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE visual_session_images IS
  'Images individuelles par session Visual Engine. Reference media_assets quand enregistree dans la bibliotheque.';

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_visual_sessions_tenant
  ON visual_sessions (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visual_session_images_session
  ON visual_session_images (session_id);

CREATE INDEX IF NOT EXISTS idx_visual_session_images_tenant
  ON visual_session_images (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_visual_session_images_library
  ON visual_session_images (library_asset_id)
  WHERE library_asset_id IS NOT NULL;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE visual_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE visual_session_images ENABLE ROW LEVEL SECURITY;

-- visual_sessions
DROP POLICY IF EXISTS "tenant_isolation_visual_sessions" ON visual_sessions;
CREATE POLICY "tenant_isolation_visual_sessions" ON visual_sessions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT t.id FROM tenants t
      INNER JOIN tenant_members tm ON tm.tenant_id = t.id
      WHERE tm.user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT t.id FROM tenants t
      INNER JOIN tenant_members tm ON tm.tenant_id = t.id
      WHERE tm.user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- visual_session_images
DROP POLICY IF EXISTS "tenant_isolation_visual_session_images" ON visual_session_images;
CREATE POLICY "tenant_isolation_visual_session_images" ON visual_session_images
  FOR ALL
  USING (
    tenant_id IN (
      SELECT t.id FROM tenants t
      INNER JOIN tenant_members tm ON tm.tenant_id = t.id
      WHERE tm.user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT t.id FROM tenants t
      INNER JOIN tenant_members tm ON tm.tenant_id = t.id
      WHERE tm.user_id = auth.uid()
      UNION
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );
