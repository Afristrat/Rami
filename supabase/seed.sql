-- ============================================================
-- RAMI — Seed data pour développement local
-- Exécuter après : supabase start && supabase db push
-- ============================================================

-- Utilisateur de test (créé via Supabase Auth local)
-- Email : dev@rami.local | Password : DevPassword123!
-- UUID fixe pour reproductibilité des tests

DO $$ DECLARE
  dev_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN

-- ─── Connexions OAuth de démonstration ───────────────────────────────────────
-- Les tokens sont fictifs (chiffrés avec OAUTH_TOKEN_ENCRYPTION_KEY=000...0)
-- Format iv:authTag:ciphertext — valeur placeholder non déchiffrable en prod

-- LinkedIn connecté (token valide 60 jours)
INSERT INTO public.oauth_connections (
  tenant_id, platform, account_id, account_name, account_avatar,
  access_token_encrypted, refresh_token_encrypted,
  expires_at, scope, is_active
) VALUES (
  dev_user_id,
  'linkedin',
  'urn:li:person:DEMO123',
  'Amine S.',
  NULL,
  'DEMO_ENCRYPTED_TOKEN_PLACEHOLDER',
  NULL,
  NOW() + INTERVAL '60 days',
  ARRAY['openid', 'profile', 'w_member_social'],
  TRUE
) ON CONFLICT (tenant_id, platform) DO NOTHING;

-- Twitter avec token expiré (pour tester l'état "Token expiré")
INSERT INTO public.oauth_connections (
  tenant_id, platform, account_id, account_name, account_avatar,
  access_token_encrypted, refresh_token_encrypted,
  expires_at, scope, is_active
) VALUES (
  dev_user_id,
  'twitter',
  '1234567890',
  '@rami_demo',
  NULL,
  'DEMO_ENCRYPTED_TOKEN_PLACEHOLDER',
  'DEMO_ENCRYPTED_REFRESH_PLACEHOLDER',
  NOW() - INTERVAL '1 hour',  -- Expiré → affiche badge "Token expiré"
  ARRAY['tweet.read', 'tweet.write', 'users.read'],
  TRUE
) ON CONFLICT (tenant_id, platform) DO NOTHING;

-- Facebook connecté (token long-lived 60 jours)
INSERT INTO public.oauth_connections (
  tenant_id, platform, account_id, account_name, account_avatar,
  access_token_encrypted, refresh_token_encrypted,
  expires_at, scope, is_active
) VALUES (
  dev_user_id,
  'facebook',
  '9876543210',
  'Amine Sbai',
  NULL,
  'DEMO_ENCRYPTED_TOKEN_PLACEHOLDER',
  NULL,
  NOW() + INTERVAL '60 days',
  ARRAY['pages_show_list', 'pages_manage_posts'],
  TRUE
) ON CONFLICT (tenant_id, platform) DO NOTHING;

-- Instagram non connecté (pas de ligne = absent de la DB)
-- Pinterest non connecté (idem)

END $$;
