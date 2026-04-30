-- ============================================================
-- RAMI — Video Generation : tables + providers + fallback chain
-- Migration : infrastructure pour la génération vidéo H2
-- Plateformes cibles : TikTok, Instagram Reels, YouTube Shorts
-- ============================================================

-- ── Enum platform : ajout des plateformes vidéo si l'enum existe déjà ────────
-- Idempotent : ne tente l'ALTER que si le type 'platform' est présent.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'platform') THEN
    ALTER TYPE platform ADD VALUE IF NOT EXISTS 'tiktok';
    ALTER TYPE platform ADD VALUE IF NOT EXISTS 'youtube_shorts';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ── Table generated_videos ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS generated_videos (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID          NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  session_id          UUID,                                  -- référence future vers content_sessions

  -- Métadonnées vidéo
  filename            VARCHAR(255)  NOT NULL,
  minio_key           TEXT,                          -- clé MinIO (asset privé)
  r2_url              TEXT,                          -- URL CDN R2 (asset public)
  format              VARCHAR(10)   NOT NULL DEFAULT 'mp4',
  width               SMALLINT,
  height              SMALLINT,
  duration_seconds    SMALLINT,
  file_size_bytes     INTEGER,

  -- Contexte de génération
  platform            VARCHAR(30),                   -- tiktok | instagram_reels | youtube_shorts
  prompt_used         TEXT,
  provider_used       VARCHAR(50),                   -- veo | sora | runway | kling | luma | wan | ltx | minimax | hailuo
  model_used          VARCHAR(100),
  brand_dna_score     REAL          CHECK (brand_dna_score BETWEEN 0 AND 1),
  has_audio           BOOLEAN       NOT NULL DEFAULT false,
  has_watermark       BOOLEAN       NOT NULL DEFAULT false,

  -- Statut
  status              VARCHAR(20)   NOT NULL DEFAULT 'generating',
  -- generating | ready | failed
  error_message       TEXT,
  generation_cost_usd NUMERIC(8, 5),

  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE generated_videos IS
  'Vidéos générées par le Visual Engine vidéo. Providers : Veo 3.1, Sora 2, Runway Gen-4.5, Kling, Luma Ray3, Wan2.2, LTX-2, MiniMax, Hailuo.';

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_generated_videos_tenant
  ON generated_videos (tenant_id);

CREATE INDEX IF NOT EXISTS idx_generated_videos_session
  ON generated_videos (session_id)
  WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_generated_videos_status
  ON generated_videos (status, tenant_id);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_isolation_generated_videos" ON generated_videos;
CREATE POLICY "tenant_isolation_generated_videos" ON generated_videos
  FOR ALL
  USING (
    tenant_id IN (
      SELECT t.id FROM tenants t
      INNER JOIN tenant_members tm ON tm.tenant_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  );

-- ── Trigger updated_at ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS generated_videos_updated_at ON generated_videos;
CREATE TRIGGER generated_videos_updated_at
  BEFORE UPDATE ON generated_videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Providers vidéo dans ai_provider_keys ────────────────────────────────────

INSERT INTO ai_provider_keys (provider, display_name, is_active, notes) VALUES
  (
    'veo',
    'Google Veo 3.1 (Vertex AI / Gemini API)',
    true,
    '4K natif, audio natif — API Vertex AI ou Gemini API. Classement #1 mars 2026.'
  ),
  (
    'sora',
    'OpenAI Sora 2',
    false,
    'Cinématique longue durée — waitlist API. Désactivé par défaut.'
  ),
  (
    'runway',
    'Runway Gen-4.5',
    true,
    'Contrôle caméra avancé — api.runwayml.com'
  ),
  (
    'kling',
    'Kling 2.6 (Kuaishou)',
    true,
    'Multiformat, 10M+ vidéos — API Kling'
  ),
  (
    'luma_ray',
    'Luma Ray3',
    true,
    'Vitesse + web API simple — lumalabs.ai/api'
  ),
  (
    'wan',
    'Wan2.2 (open source)',
    true,
    'Open source 14B, 720P — via Fal.ai ou Replicate'
  ),
  (
    'ltx_video',
    'LTX-2 (Lightricks)',
    true,
    '4K@50fps, audio synchronisé — Apache 2.0 open source'
  ),
  (
    'minimax_video',
    'MiniMax Video',
    true,
    '1080p, prix compétitif — minimaxi.com/api'
  ),
  (
    'hailuo',
    'Hailuo AI',
    true,
    'Haut volume, rapide — hailuoai.com/api'
  )
ON CONFLICT (provider) DO NOTHING;

-- ── Fallback chain vidéo ───────────────────────────────────────────────────────

INSERT INTO ai_fallback_chains (chain_key, display_name, description, providers) VALUES
  (
    'video_gen',
    'Génération vidéo',
    'Visual Engine Vidéo — TikTok, Reels, YouTube Shorts',
    '[
      {"provider":"veo",          "model":"veo-3.1",       "priority":1,"enabled":true},
      {"provider":"runway",       "model":"gen4-5",        "priority":2,"enabled":true},
      {"provider":"kling",        "model":"kling-2.6",     "priority":3,"enabled":true},
      {"provider":"luma_ray",     "model":"ray3",          "priority":4,"enabled":true},
      {"provider":"wan",          "model":"wan2.2-14b",    "priority":5,"enabled":true},
      {"provider":"ltx_video",    "model":"ltx-2",         "priority":6,"enabled":false},
      {"provider":"minimax_video","model":"video-01",      "priority":7,"enabled":false},
      {"provider":"hailuo",       "model":"hailuo-01",     "priority":8,"enabled":false},
      {"provider":"sora",         "model":"sora-2",        "priority":9,"enabled":false}
    ]'::jsonb
  )
ON CONFLICT (chain_key) DO NOTHING;
