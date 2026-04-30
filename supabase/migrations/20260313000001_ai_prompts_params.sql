-- ============================================================
-- RAMI — Ajout colonnes temperature + max_tokens à ai_prompts_config
-- ============================================================

ALTER TABLE ai_prompts_config
  ADD COLUMN IF NOT EXISTS temperature  DECIMAL(3,2) DEFAULT 0.30
    CHECK (temperature >= 0.0 AND temperature <= 2.0),
  ADD COLUMN IF NOT EXISTS max_tokens   INTEGER      DEFAULT 512
    CHECK (max_tokens >= 64 AND max_tokens <= 16384);

COMMENT ON COLUMN ai_prompts_config.temperature IS
  'Température du modèle LLM. 0.0 = déterministe (outputs structurés). 1.0 = créatif. 2.0 = très aléatoire. '
  'Défaut : 0.30 recommandé pour JSON strict. Augmenter pour captions créatives.';

COMMENT ON COLUMN ai_prompts_config.max_tokens IS
  'Nombre maximum de tokens en réponse. 256 = réponses courtes. 512 = standard. '
  '1024-4096 = réponses longues (captions, directions artistiques, benchmarks).';

-- Mettre à jour les prompts existants avec des valeurs optimales par usage
UPDATE ai_prompts_config SET temperature = 0.20, max_tokens = 128
  WHERE field_key IN ('brand_dna_generate_tagline', 'brand_dna_improve_tagline');

UPDATE ai_prompts_config SET temperature = 0.25, max_tokens = 256
  WHERE field_key IN ('brand_dna_generate_positioning', 'brand_dna_improve_positioning');

UPDATE ai_prompts_config SET temperature = 0.20, max_tokens = 256
  WHERE field_key IN ('brand_dna_prefill_identite', 'brand_dna_prefill_audience', 'brand_dna_prefill_style');

UPDATE ai_prompts_config SET temperature = 0.30, max_tokens = 2048
  WHERE field_key IN ('workflow_caption_generation', 'caption_generation');

UPDATE ai_prompts_config SET temperature = 0.50, max_tokens = 1024
  WHERE field_key IN ('visual_direction');

UPDATE ai_prompts_config SET temperature = 0.20, max_tokens = 512
  WHERE field_key IN ('visual_prompt_compiler', 'visual_brand_dna_scoring', 'brand_dna_analysis');

UPDATE ai_prompts_config SET temperature = 0.10, max_tokens = 512
  WHERE field_key IN ('tone_examples', 'hashtag_strategy');

UPDATE ai_prompts_config SET temperature = 0.10, max_tokens = 1024
  WHERE field_key IN ('perplexity_sector_benchmark');
