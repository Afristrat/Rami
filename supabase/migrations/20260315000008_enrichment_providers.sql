-- ============================================================
-- Enrichissement de leads — providers BYOK additionnels
-- PDL + Dropcontact + Enrich.so (en plus d'Apollo + Hunter).
-- Réutilise ai_provider_keys (clé globale plateforme chiffrée, category='enrichment',
-- fallback variable d'environnement). Clé chiffrée optionnelle (null = fallback env).
-- ============================================================

INSERT INTO ai_provider_keys (provider, display_name, is_active, category, notes) VALUES
  ('pdl', 'People Data Labs', true, 'enrichment',
   'Person Enrichment — GET /v5/person/enrich, header X-Api-Key. Tier gratuit (crédits). Env fallback: PDL_API_KEY'),
  ('dropcontact', 'Dropcontact', true, 'enrichment',
   'Enrichissement RGPD (FR, asynchrone) — POST /v1/enrich/all puis poll, header X-Access-Token. Env fallback: DROPCONTACT_API_KEY'),
  ('enrich', 'Enrich.so', true, 'enrichment',
   'Person Enrichment — GET /v1/api/person, header Authorization Bearer. 100 crédits gratuits. Env fallback: ENRICH_API_KEY')
ON CONFLICT (provider) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  category     = EXCLUDED.category,
  notes        = EXCLUDED.notes;
