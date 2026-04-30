-- ============================================================
-- RAMI — Ajout colonne user_message_template à ai_prompts_config
-- Stocke le template du message utilisateur avec placeholders {{variable}}
-- ============================================================

ALTER TABLE ai_prompts_config
  ADD COLUMN IF NOT EXISTS user_message_template TEXT;

COMMENT ON COLUMN ai_prompts_config.user_message_template IS
  'Template du message utilisateur avec placeholders {{variable_name}}. '
  'Le code injecte les valeurs contextuelles (Brand DNA, brief, etc.) avant l''appel LLM. '
  'Null = le code construit le message utilisateur lui-même.';
