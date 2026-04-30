-- ============================================================
-- RAMI — v1.1 Admin IA v2
-- 1. Colonnes user_message_template + output_format dans ai_prompts_config
-- 2. Nouvelle table ai_provider_chains (Chaînes de Fallback)
-- ============================================================

-- ── 1. Nouvelles colonnes ai_prompts_config ───────────────────────────────────

ALTER TABLE ai_prompts_config
  ADD COLUMN IF NOT EXISTS user_message_template TEXT,
  ADD COLUMN IF NOT EXISTS output_format TEXT;

COMMENT ON COLUMN ai_prompts_config.user_message_template IS
  'Template du message utilisateur avec variables entre accolades (ex: {brand_name}, {sector}). Null = le code utilise son propre template en dur.';

COMMENT ON COLUMN ai_prompts_config.output_format IS
  'Schéma JSON attendu ou description texte du format de sortie. Ex: { "colors": string[], "emotion": string }';

-- Mise à jour des configs existantes avec les output_format attendus
UPDATE ai_prompts_config SET
  user_message_template = 'Analyse ce visuel de marque et extrais le Brand DNA visuel.

Marque : {brand_name}
Secteur : {sector}
Culture primaire cible : {primary_culture}
Instructions complémentaires : {additional_instructions}

[Image attachée via vision API]',
  output_format = '{
  "dominant_colors": ["#HEX1", "#HEX2", "#HEX3"],
  "color_emotion": "string",
  "gestalt_shapes": ["cercle|carré|triangle|..."],
  "visual_style": "string",
  "causse_alignment_score": 0.0,
  "recommendations": ["string"]
}'
WHERE field_key = 'brand_dna_analysis';

UPDATE ai_prompts_config SET
  user_message_template = 'Génère {count} captions pour {platform} en {language}.

Marque : {brand_name}
Secteur : {sector}
Brief : {brief}
Objectif cognitif : {cognitive_objective}
Ton de voix : {voice_tone}',
  output_format = '{
  "captions": [
    {
      "text": "string",
      "hashtags": ["string"],
      "hook": "string",
      "char_count": 0
    }
  ]
}'
WHERE field_key = 'caption_generation';

UPDATE ai_prompts_config SET
  user_message_template = 'Génère 3 exemples de messages représentatifs du ton "{voice_tone}" pour la marque {brand_name} dans le secteur {sector}.

Plateforme cible : {platform}
Culture audience : {primary_culture}',
  output_format = '{
  "examples": [
    {
      "platform": "linkedin|instagram|x",
      "text": "string",
      "tone_score": 0.0
    }
  ]
}'
WHERE field_key = 'tone_examples';

UPDATE ai_prompts_config SET
  user_message_template = 'Génère une stratégie hashtags pour {platform}.

Secteur : {sector}
Culture cible : {primary_culture}
Objectif : {objective}
Langue : {language}',
  output_format = '{
  "primary_hashtags": ["string"],
  "secondary_hashtags": ["string"],
  "niche_hashtags": ["string"],
  "trending": ["string"],
  "strategy_note": "string"
}'
WHERE field_key = 'hashtag_strategy';

UPDATE ai_prompts_config SET
  user_message_template = 'Génère 4 directions artistiques distinctes pour ce brief.

Marque : {brand_name}
Secteur : {sector}
Brief : {brief}
Couleur principale : {color_primary} ({color_hex})
Objectif cognitif : {cognitive_objective}
Plateformes : {platforms}',
  output_format = '{
  "directions": [
    {
      "id": 1,
      "title": "string",
      "positive_prompt": "string",
      "negative_prompt": "string",
      "style": "string",
      "emotion_target": "string",
      "guidance_scale": 9,
      "steps": 35
    }
  ]
}'
WHERE field_key = 'visual_direction';

UPDATE ai_prompts_config SET
  user_message_template = 'Analyse les tendances actuelles du secteur "{sector}" pour une audience {primary_culture} sur les réseaux sociaux (2025-2026).

Réponds avec exactement ces 5 clés JSON (valeurs en français, 2-3 phrases chacune).',
  output_format = '{
  "tendancesVisuelles": "string",
  "tendancesCouleurs": "string",
  "formatContenu": "string",
  "tonEditorial": "string",
  "strategieHashtags": "string"
}'
WHERE field_key = 'perplexity_sector_benchmark';

-- ── 2. Table ai_provider_chains (Chaînes de Fallback) ────────────────────────

CREATE TABLE IF NOT EXISTS ai_provider_chains (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Catégorie fonctionnelle : image_gen | llm_text | llm_vision | search_research | transcription | video_gen
  category     VARCHAR(50)  NOT NULL,

  -- Priorité dans la chaîne : 1 = principal, 2 = fallback 1, 3 = fallback 2
  priority     INTEGER      NOT NULL DEFAULT 1,

  -- Provider : fal_ai | replicate | together_ai | anthropic | openai | openrouter | perplexity | openai_whisper | moonshot | mistral
  provider     VARCHAR(50)  NOT NULL,

  -- Modèle complet (ex: fal-ai/flux/dev, claude-haiku-4-5-20251001)
  model        VARCHAR(200) NOT NULL,

  -- Actif dans la chaîne (false = désactivé, skipped au runtime)
  is_active    BOOLEAN      NOT NULL DEFAULT true,

  -- Clé API BYOK chiffrée AES-256-GCM — null = variable d'env
  api_key_encrypted TEXT,

  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Une seule entrée par (category, priority)
  UNIQUE (category, priority)
);

COMMENT ON TABLE ai_provider_chains IS
  'Chaînes de fallback par catégorie fonctionnelle. Chaque ligne = un provider dans la chaîne, ordonné par priorité.';

COMMENT ON COLUMN ai_provider_chains.category IS
  'Catégorie fonctionnelle : image_gen, llm_text, llm_vision, search_research, transcription, video_gen';

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_provider_chains_category
  ON ai_provider_chains (category, priority);

CREATE INDEX IF NOT EXISTS idx_ai_provider_chains_active
  ON ai_provider_chains (category, is_active)
  WHERE is_active = true;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE ai_provider_chains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_provider_chains_super_admin"
  ON ai_provider_chains FOR ALL
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- ── Trigger updated_at ────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS ai_provider_chains_updated_at ON ai_provider_chains;
CREATE TRIGGER ai_provider_chains_updated_at
  BEFORE UPDATE ON ai_provider_chains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Données initiales ─────────────────────────────────────────────────────────

INSERT INTO ai_provider_chains (category, priority, provider, model, is_active)
VALUES
  -- image_gen — Visual Engine FLUX
  ('image_gen',        1, 'fal_ai',      'fal-ai/flux/dev',                     true),
  ('image_gen',        2, 'replicate',   'black-forest-labs/flux-dev',           true),
  ('image_gen',        3, 'together_ai', 'black-forest-labs/FLUX.1-schnell',    true),

  -- llm_text — Captions, Brand DNA, ton éditorial
  ('llm_text',         1, 'anthropic',   'claude-haiku-4-5-20251001',           true),
  ('llm_text',         2, 'openrouter',  'anthropic/claude-haiku',              false),
  ('llm_text',         3, 'openai',      'gpt-4o-mini',                         false),

  -- llm_vision — Analyse logo Brand DNA, scoring visuel
  ('llm_vision',       1, 'anthropic',   'claude-haiku-4-5-20251001',           true),

  -- search_research — Perplexity benchmark sectoriel
  ('search_research',  1, 'perplexity',  'sonar',                               true),
  ('search_research',  2, 'perplexity',  'sonar-pro',                           false),

  -- transcription — Whisper réunions et notes
  ('transcription',    1, 'openai',      'whisper-1',                           true),

  -- video_gen — Visual Engine Vidéo (TikTok, Reels, YouTube Shorts)
  ('video_gen',        1, 'fal_ai',      'fal-ai/kling-video/v1.6/standard/image-to-video', true),
  ('video_gen',        2, 'replicate',   'minimax/video-01',                    false)

ON CONFLICT (category, priority) DO NOTHING;
