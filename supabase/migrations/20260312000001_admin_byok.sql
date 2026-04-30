-- ============================================================
-- RAMI — Admin BYOK : tables ai_provider_keys + ai_fallback_chains
-- Migration : gestion centralisée des clés API providers et chaînes de fallback
-- ============================================================

-- ── Fonction update_updated_at_column (idempotente) ───────────────────────────
-- Définie ici en cas de migration appliquée hors ordre.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ── Table ai_provider_keys ────────────────────────────────────────────────────
-- Clés API BYOK par provider (une clé par provider, globale à la plateforme).
-- api_key_encrypted : chiffré AES-256-GCM — null = utilise la variable d'environnement.

CREATE TABLE IF NOT EXISTS ai_provider_keys (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            VARCHAR(50)  NOT NULL UNIQUE,
  display_name        VARCHAR(100) NOT NULL,
  api_key_encrypted   TEXT,        -- null = utilise la variable d'environnement
  is_active           BOOLEAN      NOT NULL DEFAULT true,
  last_tested_at      TIMESTAMPTZ,
  last_test_success   BOOLEAN,
  notes               TEXT,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_provider_keys IS
  'Clés API BYOK globales par provider. Chiffrées AES-256-GCM. Null = utilise la variable d''environnement.';

COMMENT ON COLUMN ai_provider_keys.api_key_encrypted IS
  'Clé API chiffrée AES-256-GCM. Format : iv:authTag:ciphertext (hex). Null = utilise .env';

-- ── Table ai_fallback_chains ──────────────────────────────────────────────────
-- Chaînes de fallback par usage fonctionnel (texte, image, transcription...).
-- providers : [{provider, model, priority, enabled}]

CREATE TABLE IF NOT EXISTS ai_fallback_chains (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_key     VARCHAR(50)  NOT NULL UNIQUE,
  display_name  VARCHAR(100) NOT NULL,
  description   TEXT,
  providers     JSONB        NOT NULL DEFAULT '[]',
  is_active     BOOLEAN      NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE ai_fallback_chains IS
  'Chaînes de fallback par usage IA. providers = [{provider, model, priority, enabled}]';

COMMENT ON COLUMN ai_fallback_chains.providers IS
  'Array JSON : [{provider: "anthropic", model: "claude-haiku-4-5-20251001", priority: 1, enabled: true}]';

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_provider
  ON ai_provider_keys (provider);

CREATE INDEX IF NOT EXISTS idx_ai_provider_keys_is_active
  ON ai_provider_keys (is_active)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_ai_fallback_chains_chain_key
  ON ai_fallback_chains (chain_key);

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Service role bypass (utilisé par les Server Actions super_admin).
-- Les policies USING(true) permettent l'accès via service role uniquement
-- (les actions vérifient app_metadata?.role === "super_admin" côté Next.js).

ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_fallback_chains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "provider_keys_super_admin" ON ai_provider_keys;
CREATE POLICY "provider_keys_super_admin" ON ai_provider_keys
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "fallback_chains_super_admin" ON ai_fallback_chains;
CREATE POLICY "fallback_chains_super_admin" ON ai_fallback_chains
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── Triggers updated_at ───────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS ai_provider_keys_updated_at ON ai_provider_keys;
CREATE TRIGGER ai_provider_keys_updated_at
  BEFORE UPDATE ON ai_provider_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS ai_fallback_chains_updated_at ON ai_fallback_chains;
CREATE TRIGGER ai_fallback_chains_updated_at
  BEFORE UPDATE ON ai_fallback_chains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Données initiales — providers ─────────────────────────────────────────────

INSERT INTO ai_provider_keys (provider, display_name, is_active) VALUES
  ('anthropic',    'Anthropic (Claude)',                    true),
  ('openai',       'OpenAI (GPT + Whisper)',                true),
  ('perplexity',   'Perplexity (Sonar)',                    true),
  ('nano_banana',  'Nano Banana v2 (Gemini 2.5 Flash Image)',  true),
  ('fal_ai',       'Fal.ai (FLUX)',                         true),
  ('replicate',    'Replicate (FLUX fallback)',             true),
  ('together_ai',  'Together AI (FLUX fallback)',           true),
  ('openrouter',   'OpenRouter (LLM fallback)',             true)
ON CONFLICT (provider) DO NOTHING;

-- ── Données initiales — fallback chains ───────────────────────────────────────

INSERT INTO ai_fallback_chains (chain_key, display_name, description, providers) VALUES
  (
    'llm_text',
    'LLM — Génération texte',
    'Captions, Brand DNA, ton éditorial',
    '[{"provider":"anthropic","model":"claude-haiku-4-5-20251001","priority":1,"enabled":true},{"provider":"openrouter","model":"anthropic/claude-haiku","priority":2,"enabled":false},{"provider":"openai","model":"gpt-4o-mini","priority":3,"enabled":false}]'
  ),
  (
    'llm_vision',
    'LLM — Vision / Analyse logo',
    'Analyse logo Brand DNA, scoring visuel',
    '[{"provider":"anthropic","model":"claude-haiku-4-5-20251001","priority":1,"enabled":true}]'
  ),
  (
    'image_gen',
    'Génération d''images',
    'Visual Engine — Nano Banana → Fal.ai → Replicate → Together AI',
    '[{"provider":"nano_banana","model":"gemini-2.5-flash-image","priority":1,"enabled":true},{"provider":"fal_ai","model":"fal-ai/flux/dev","priority":2,"enabled":true},{"provider":"replicate","model":"black-forest-labs/flux-dev","priority":3,"enabled":true},{"provider":"together_ai","model":"black-forest-labs/FLUX.1-schnell","priority":4,"enabled":true}]'
  ),
  (
    'transcription',
    'Transcription audio',
    'Whisper — réunions et notes',
    '[{"provider":"openai","model":"whisper-1","priority":1,"enabled":true}]'
  ),
  (
    'search_research',
    'Recherche et Benchmark',
    'Perplexity — benchmark sectoriel',
    '[{"provider":"perplexity","model":"sonar","priority":1,"enabled":true}]'
  )
ON CONFLICT (chain_key) DO NOTHING;
