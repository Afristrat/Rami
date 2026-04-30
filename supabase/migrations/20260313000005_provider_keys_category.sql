-- RAMI — Migration : catégories BYOK + ajout Moonshot AI
-- Ajoute la colonne `category` à ai_provider_keys et catégorise tous les providers

-- ── 1. Colonne category ────────────────────────────────────────────────────────

ALTER TABLE ai_provider_keys
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'text'
  CHECK (category IN ('text', 'image', 'video', 'audio', 'infographic'));

COMMENT ON COLUMN ai_provider_keys.category IS
  'Type de génération : text | image | video | audio | infographic';

-- ── 2. Moonshot AI (Kimi) ─────────────────────────────────────────────────────

INSERT INTO ai_provider_keys (provider, display_name, is_active, category, notes)
VALUES (
  'moonshot',
  'Moonshot AI (Kimi)',
  true,
  'text',
  'API OpenAI-compatible — api.moonshot.cn/v1. Modèles : moonshot-v1-8k / 32k / 128k'
)
ON CONFLICT (provider) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category     = EXCLUDED.category,
  notes        = EXCLUDED.notes;

-- ── 3. Mise à jour des catégories existantes ──────────────────────────────────

-- Texte (LLM)
UPDATE ai_provider_keys SET category = 'text' WHERE provider IN (
  'anthropic', 'openai', 'openrouter', 'perplexity'
);

-- Image
UPDATE ai_provider_keys SET category = 'image' WHERE provider IN (
  'fal_ai', 'replicate', 'together_ai', 'nano_banana'
);

-- Vidéo
UPDATE ai_provider_keys SET category = 'video' WHERE provider IN (
  'veo', 'sora', 'runway', 'kling', 'luma_ray', 'wan', 'ltx_video', 'minimax_video', 'hailuo'
);

-- Audio (pour le futur)
-- UPDATE ai_provider_keys SET category = 'audio' WHERE provider IN ('elevenlabs', 'openai_tts');
