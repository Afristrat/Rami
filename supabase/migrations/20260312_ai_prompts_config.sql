-- ============================================================
-- RAMI — Table ai_prompts_config
-- Feature 8 : page admin de gestion des prompts IA
-- Accessible uniquement aux super_admin via RLS + is_super_admin()
-- ============================================================

-- ── Table ai_prompts_config ───────────────────────────────────────────────────
-- Stocke les configurations des prompts IA éditables par les super_admin.
-- api_key_encrypted : clé API BYOK chiffrée AES-256-GCM (null = utilise .env)

CREATE TABLE IF NOT EXISTS ai_prompts_config (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identifiant fonctionnel unique (ex: "brand_dna_analysis", "caption_linkedin")
  field_key       VARCHAR(100) NOT NULL UNIQUE,

  -- Description humaine de l'usage de ce prompt
  description     TEXT,

  -- Le system prompt envoyé au modèle LLM
  system_prompt   TEXT        NOT NULL,

  -- Provider LLM : anthropic | openai | openrouter | perplexity
  provider        VARCHAR(50)  NOT NULL DEFAULT 'anthropic',

  -- Identifiant du modèle LLM (ex: claude-haiku-4-5-20251001)
  model           VARCHAR(100) NOT NULL,

  -- Clé API BYOK chiffrée AES-256-GCM — null = utilise la variable d'environnement
  -- Format : iv:authTag:ciphertext (hex)
  api_key_encrypted TEXT,

  -- Actif ou désactivé
  is_active       BOOLEAN      NOT NULL DEFAULT true,

  -- Métadonnées
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Commentaires ──────────────────────────────────────────────────────────────

COMMENT ON TABLE ai_prompts_config IS
  'Configuration des prompts IA éditables par les super_admin. Chaque entrée correspond à un usage fonctionnel (brand_dna, captions, etc.)';

COMMENT ON COLUMN ai_prompts_config.field_key IS
  'Clé fonctionnelle unique — utilisée dans le code pour charger le bon prompt (ex: "brand_dna_analysis")';

COMMENT ON COLUMN ai_prompts_config.api_key_encrypted IS
  'Clé API BYOK chiffrée AES-256-GCM. Format : iv:authTag:ciphertext (hex). Null = utilise la variable d''environnement correspondante.';

-- ── Index ─────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_prompts_config_field_key
  ON ai_prompts_config (field_key);

CREATE INDEX IF NOT EXISTS idx_ai_prompts_config_is_active
  ON ai_prompts_config (is_active)
  WHERE is_active = true;

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Seuls les super_admin peuvent lire et modifier cette table.
-- is_super_admin() est défini dans la migration 20260311_super_admin.sql

ALTER TABLE ai_prompts_config ENABLE ROW LEVEL SECURITY;

-- Lecture : super_admin uniquement
CREATE POLICY "ai_prompts_config_select_super_admin"
  ON ai_prompts_config FOR SELECT
  USING (is_super_admin());

-- Insertion : super_admin uniquement
CREATE POLICY "ai_prompts_config_insert_super_admin"
  ON ai_prompts_config FOR INSERT
  WITH CHECK (is_super_admin());

-- Mise à jour : super_admin uniquement
CREATE POLICY "ai_prompts_config_update_super_admin"
  ON ai_prompts_config FOR UPDATE
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- Suppression : super_admin uniquement
CREATE POLICY "ai_prompts_config_delete_super_admin"
  ON ai_prompts_config FOR DELETE
  USING (is_super_admin());

-- ── Trigger : updated_at automatique ─────────────────────────────────────────

DROP TRIGGER IF EXISTS ai_prompts_config_updated_at ON ai_prompts_config;
CREATE TRIGGER ai_prompts_config_updated_at
  BEFORE UPDATE ON ai_prompts_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Données initiales — configs par défaut (désactivables) ────────────────────
-- Ces configs correspondent aux usages LLM existants dans RAMI.
-- system_prompt est intentionnellement minimal — à personnaliser via l'UI.

INSERT INTO ai_prompts_config (field_key, description, system_prompt, provider, model, is_active)
VALUES
  (
    'brand_dna_analysis',
    'Analyse du logo et extraction des couleurs/formes dominantes (Vision AI)',
    'Tu es un expert en design et neuropsychologie des couleurs (méthode Causse). Analyse les visuels de marque et extrais les informations structurées demandées. Réponds uniquement en JSON valide.',
    'anthropic',
    'claude-haiku-4-5-20251001',
    true
  ),
  (
    'caption_generation',
    'Génération de captions adaptées par plateforme sociale',
    'Tu es un expert en copywriting et stratégie de contenu social media. Génère des captions percutantes, adaptées au format et au ton de chaque plateforme. Respecte scrupuleusement le Brand DNA fourni.',
    'anthropic',
    'claude-haiku-4-5-20251001',
    true
  ),
  (
    'tone_examples',
    'Génération d''exemples de ton éditorial pour validation Brand DNA',
    'Tu es un directeur éditorial expert en branding. Génère des exemples de messages représentatifs du ton de voix sélectionné pour différentes plateformes sociales.',
    'anthropic',
    'claude-haiku-4-5-20251001',
    true
  ),
  (
    'hashtag_strategy',
    'Génération de stratégie hashtags optimisée par secteur et culture',
    'Tu es un expert SEO social media. Génère une stratégie hashtags optimisée pour maximiser la portée organique sur les réseaux sociaux. Adapte la stratégie au secteur, à la culture cible et à la plateforme.',
    'anthropic',
    'claude-haiku-4-5-20251001',
    true
  ),
  (
    'visual_direction',
    'Génération des directions artistiques et prompts image (Visual Engine)',
    'Tu es un directeur artistique expert en design psychologique. Génère des directions visuelles précises basées sur la neuropsychologie des couleurs et la psychologie des formes (Gestalt). Produis des prompts d''image optimisés pour Fal.ai FLUX.',
    'anthropic',
    'claude-haiku-4-5-20251001',
    true
  ),
  (
    'perplexity_sector_benchmark',
    'Benchmark sectoriel — tendances visuelles et éditoriales (Feature 7)',
    'Tu es un expert senior en marketing digital et tendances sectorielles. Analyse les données les plus récentes disponibles. Réponds uniquement en JSON valide, sans markdown. Sois concis, factuel, orienté résultats opérationnels.',
    'perplexity',
    'sonar',
    true
  )
ON CONFLICT (field_key) DO NOTHING;
