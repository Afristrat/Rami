-- ============================================================
-- RAMI — Migration consolidée : Kimi K2.5 comme provider par défaut
-- À appliquer UNE SEULE FOIS dans le SQL Editor Supabase
--
-- Ce script fait 4 choses :
-- 1. Ajoute la colonne `category` sur ai_provider_keys
-- 2. Insère/met à jour le provider Moonshot AI
-- 3. Migre TOUS les prompts vers moonshot / kimi-k2.5
-- 4. Met à jour les fallback chains LLM texte et vision vers Moonshot
-- ============================================================


-- ── 1. Colonne category (idempotente) ─────────────────────────────────────────

ALTER TABLE ai_provider_keys
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'text'
  CHECK (category IN ('text', 'image', 'video', 'audio', 'infographic'));

COMMENT ON COLUMN ai_provider_keys.category IS
  'Type de génération : text | image | video | audio | infographic';


-- ── 2. Provider Moonshot AI ───────────────────────────────────────────────────

INSERT INTO ai_provider_keys (provider, display_name, is_active, category, notes)
VALUES (
  'moonshot',
  'Moonshot AI (Kimi)',
  true,
  'text',
  'API OpenAI-compatible — api.moonshot.ai/v1. Modèles : kimi-k2.5 (flagship) | kimi-k2-thinking | kimi-k2-turbo-preview | moonshot-v1-128k/32k/8k'
)
ON CONFLICT (provider) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category     = EXCLUDED.category,
  notes        = EXCLUDED.notes;


-- ── 3. Catégories des providers existants ────────────────────────────────────

-- Texte (LLM)
UPDATE ai_provider_keys SET category = 'text' WHERE provider IN (
  'anthropic', 'openai', 'openrouter', 'perplexity', 'moonshot'
);

-- Image
UPDATE ai_provider_keys SET category = 'image' WHERE provider IN (
  'fal_ai', 'replicate', 'together_ai', 'nano_banana'
);

-- Vidéo
UPDATE ai_provider_keys SET category = 'video' WHERE provider IN (
  'veo', 'sora', 'runway', 'kling', 'luma_ray', 'wan', 'ltx_video', 'minimax_video', 'hailuo'
);


-- ── 4. Migration prompts → moonshot / kimi-k2.5 ──────────────────────────────
-- Tous les prompts qui utilisaient Anthropic Haiku passent sur Kimi K2.5.
-- La direction artistique (visual_direction) garde Claude Sonnet — vision complexe.

UPDATE ai_prompts_config
SET
  provider   = 'moonshot',
  model      = 'kimi-k2.5',
  updated_at = NOW()
WHERE provider = 'anthropic'
  AND model IN ('claude-haiku-4-5-20251001', 'claude-haiku-4-5', 'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k');

-- La direction artistique utilise Kimi K2.5 aussi (raisonnement + JSON complexe)
UPDATE ai_prompts_config
SET
  provider   = 'moonshot',
  model      = 'kimi-k2.5',
  updated_at = NOW()
WHERE field_key = 'visual_direction'
  AND provider = 'anthropic';


-- ── 5. Fallback chain llm_text → Moonshot K2.5 comme primaire ────────────────

UPDATE ai_fallback_chains
SET
  providers = '[
    {"provider":"moonshot",   "model":"kimi-k2.5",               "priority":1, "enabled":true},
    {"provider":"anthropic",  "model":"claude-haiku-4-5-20251001","priority":2, "enabled":false},
    {"provider":"openrouter", "model":"moonshotai/kimi-k2.5",     "priority":3, "enabled":false},
    {"provider":"openai",     "model":"gpt-4o-mini",              "priority":4, "enabled":false}
  ]'::jsonb,
  updated_at = NOW()
WHERE chain_key = 'llm_text';


-- ── 6. Fallback chain llm_vision → Moonshot K2.5 ─────────────────────────────
-- Kimi K2.5 supporte la vision. Garder Anthropic en fallback (vision robuste).

UPDATE ai_fallback_chains
SET
  providers = '[
    {"provider":"moonshot",  "model":"kimi-k2.5",               "priority":1, "enabled":true},
    {"provider":"anthropic", "model":"claude-haiku-4-5-20251001","priority":2, "enabled":false}
  ]'::jsonb,
  updated_at = NOW()
WHERE chain_key = 'llm_vision';


-- ── Vérification finale ───────────────────────────────────────────────────────

SELECT
  'ai_provider_keys' AS table_name,
  category,
  count(*) AS nb_providers
FROM ai_provider_keys
GROUP BY category
ORDER BY category;

SELECT
  'ai_prompts_config' AS table_name,
  provider,
  model,
  count(*) AS nb_prompts
FROM ai_prompts_config
GROUP BY provider, model
ORDER BY provider, model;

SELECT
  chain_key,
  jsonb_array_elements(providers) -> 'provider' AS provider,
  jsonb_array_elements(providers) -> 'model'    AS model,
  jsonb_array_elements(providers) -> 'enabled'  AS enabled
FROM ai_fallback_chains
WHERE chain_key IN ('llm_text', 'llm_vision');
