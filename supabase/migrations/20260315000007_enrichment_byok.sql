-- ============================================================
-- BYOK enrichissement de leads — catégorie 'enrichment' + providers
-- Réutilise ai_provider_keys (clé globale plateforme, chiffrée, fallback env).
-- ============================================================

-- Étendre la catégorie autorisée
ALTER TABLE ai_provider_keys DROP CONSTRAINT IF EXISTS ai_provider_keys_category_check;
ALTER TABLE ai_provider_keys ADD CONSTRAINT ai_provider_keys_category_check
  CHECK (category IN ('text', 'image', 'video', 'audio', 'infographic', 'enrichment'));

-- Providers d'enrichissement (clé chiffrée optionnelle ; null = fallback variable d'environnement)
INSERT INTO ai_provider_keys (provider, display_name, is_active, category, notes) VALUES
  ('hunter', 'Hunter.io', true, 'enrichment',
   'Email Finder — api.hunter.io/v2. Tier gratuit API. Env fallback: HUNTER_API_KEY'),
  ('apollo', 'Apollo.io', true, 'enrichment',
   'People Match — header X-Api-Key. API = plan payant (free => 403). Env fallback: APOLLO_API_KEY')
ON CONFLICT (provider) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category     = EXCLUDED.category,
  notes        = EXCLUDED.notes;
