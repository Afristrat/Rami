-- ============================================================
-- Migration : oauth_connections
-- Stockage des connexions OAuth par tenant (chiffrées AES-256)
-- ============================================================

-- Enum des plateformes supportées
DO $$ BEGIN
  CREATE TYPE social_platform AS ENUM (
    'twitter',
    'linkedin',
    'instagram',
    'facebook',
    'pinterest',
    'mastodon',
    'youtube',
    'tiktok'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Table principale
CREATE TABLE IF NOT EXISTS public.oauth_connections (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id                UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform                 social_platform NOT NULL,
  account_id               TEXT NOT NULL,
  account_name             TEXT NOT NULL,
  account_avatar           TEXT,
  -- Tokens chiffrés AES-256-GCM (format: iv:authTag:ciphertext)
  access_token_encrypted   TEXT NOT NULL,
  refresh_token_encrypted  TEXT,
  expires_at               TIMESTAMPTZ,
  scope                    TEXT[] DEFAULT '{}',
  is_active                BOOLEAN DEFAULT TRUE,
  metadata                 JSONB DEFAULT '{}',
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW(),

  -- Un seul compte actif par tenant × plateforme
  CONSTRAINT uq_tenant_platform UNIQUE (tenant_id, platform)
);

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_oauth_connections_tenant
  ON public.oauth_connections (tenant_id);

CREATE INDEX IF NOT EXISTS idx_oauth_connections_platform
  ON public.oauth_connections (platform);

CREATE INDEX IF NOT EXISTS idx_oauth_connections_active
  ON public.oauth_connections (tenant_id, is_active)
  WHERE is_active = TRUE;

-- Trigger updated_at automatique
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_oauth_connections_updated_at ON public.oauth_connections;
CREATE TRIGGER trg_oauth_connections_updated_at
  BEFORE UPDATE ON public.oauth_connections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── Row Level Security ────────────────────────────────────────────────────

ALTER TABLE public.oauth_connections ENABLE ROW LEVEL SECURITY;

-- Un tenant ne voit que ses propres connexions
CREATE POLICY "tenant_select_own_connections"
  ON public.oauth_connections
  FOR SELECT
  USING (tenant_id = auth.uid());

-- Un tenant ne peut insérer que pour lui-même
CREATE POLICY "tenant_insert_own_connections"
  ON public.oauth_connections
  FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Un tenant ne peut modifier que ses propres connexions
CREATE POLICY "tenant_update_own_connections"
  ON public.oauth_connections
  FOR UPDATE
  USING (tenant_id = auth.uid())
  WITH CHECK (tenant_id = auth.uid());

-- Un tenant ne peut supprimer que ses propres connexions
CREATE POLICY "tenant_delete_own_connections"
  ON public.oauth_connections
  FOR DELETE
  USING (tenant_id = auth.uid());

-- Pas de lecture par les Edge Functions sans service role
-- (les Edge Functions doivent utiliser supabase.auth.getUser() pour valider le tenant)

-- ─── Audit Log pour les connexions OAuth ──────────────────────────────────

-- Extension de la table audit_logs si elle existe
-- (sinon ignorée — sera créée lors de la migration audit globale)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
    -- Les connexions/déconnexions seront loggées via trigger applicatif
    -- (pas de trigger DB pour éviter la capture de tokens en clair)
    RAISE NOTICE 'audit_logs existe — logging OAuth via Server Actions';
  END IF;
END $$;

-- ─── Commentaires de documentation ────────────────────────────────────────

COMMENT ON TABLE public.oauth_connections IS
  'Connexions OAuth par tenant. Tokens chiffrés AES-256-GCM côté applicatif avant insertion.';

COMMENT ON COLUMN public.oauth_connections.access_token_encrypted IS
  'Token chiffré au format iv:authTag:ciphertext (AES-256-GCM). Déchiffrement via OAUTH_TOKEN_ENCRYPTION_KEY.';

COMMENT ON COLUMN public.oauth_connections.refresh_token_encrypted IS
  'Refresh token chiffré. NULL si la plateforme ne fournit pas de refresh token.';

COMMENT ON COLUMN public.oauth_connections.tenant_id IS
  'Référence auth.users(id). Pour MVP : user_id = tenant_id. Phase 2 : table tenants séparée.';
