-- ============================================================
-- API publique v1 — table api_keys (US-051 LOT 0)
-- Authentification par clé Bearer pour agents externes (Hermès).
-- La clé en clair n'est JAMAIS stockée : on conserve son hash SHA-256
-- (key_hash, unique) + un prefix affichable (key_prefix). La validation
-- des requêtes /api/v1/* passe par le client service-role (bypass RLS) :
-- lookup exclusif par key_hash unique — la clé longue EST l'authentification.
-- La gestion (créer / lister / révoquer) se fait via la session dashboard,
-- d'où la RLS tenant ci-dessous.
-- ============================================================

CREATE TABLE public.api_keys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text NOT NULL,
  key_prefix   varchar(16) NOT NULL,           -- ex. "rami_sk_a1b2" (affichable)
  key_hash     text NOT NULL UNIQUE,           -- SHA-256 hex de la clé complète
  scopes       text[] NOT NULL DEFAULT '{}',   -- {posts:write, content:write, presentations:write, analytics:read}
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_by   uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_api_keys_tenant
  ON public.api_keys (tenant_id, created_at DESC);

-- ── RLS : isolation tenant stricte ─────────────────────────────────────────
-- La validation des requêtes API (route /api/v1/*) passe par le client
-- service-role (bypass RLS volontaire) : lookup exclusivement par key_hash.
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys_select_own" ON public.api_keys
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "api_keys_insert_own" ON public.api_keys
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "api_keys_update_own" ON public.api_keys
  FOR UPDATE USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "api_keys_delete_own" ON public.api_keys
  FOR DELETE USING (tenant_id = get_current_tenant_id());
