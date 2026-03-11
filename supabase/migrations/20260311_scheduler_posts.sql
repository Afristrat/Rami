-- ============================================================
-- Migration Supabase : Scheduler — RLS, index, triggers
-- Date      : 2026-03-11
-- Module    : J1 — Scheduler de publication
--
-- NOTE : Le DDL (CREATE TABLE) est géré par Drizzle ORM dans
--        database/migrations/0000_cuddly_power_man.sql
--        Ce fichier ajoute les politiques de sécurité et
--        optimisations que Drizzle ne génère pas.
-- ============================================================

-- ── Utilitaire RLS : tenant de l'utilisateur courant ────────

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── RLS — posts ──────────────────────────────────────────────

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement les posts de son tenant
CREATE POLICY "posts_tenant_select"
  ON posts
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

-- Création : uniquement dans son propre tenant
CREATE POLICY "posts_tenant_insert"
  ON posts
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Modification : uniquement ses propres posts
CREATE POLICY "posts_tenant_update"
  ON posts
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

-- Suppression : uniquement ses propres posts
CREATE POLICY "posts_tenant_delete"
  ON posts
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- ── RLS — tenants ────────────────────────────────────────────

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Lecture : uniquement son propre tenant
CREATE POLICY "tenants_tenant_select"
  ON tenants
  FOR SELECT
  USING (id = get_current_tenant_id());

-- Modification : uniquement son propre tenant (owner seulement)
CREATE POLICY "tenants_owner_update"
  ON tenants
  FOR UPDATE
  USING (owner_id = auth.uid());

-- ── RLS — users ──────────────────────────────────────────────

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Lecture : son profil + membres du même tenant
CREATE POLICY "users_tenant_select"
  ON users
  FOR SELECT
  USING (
    id = auth.uid()
    OR tenant_id = get_current_tenant_id()
  );

-- Modification : uniquement son propre profil
CREATE POLICY "users_self_update"
  ON users
  FOR UPDATE
  USING (id = auth.uid());

-- Insertion : service role uniquement (via Server Actions)
CREATE POLICY "users_service_insert"
  ON users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- ── Index de performance ──────────────────────────────────────

-- Posts par tenant + date planifiée (requête calendrier)
CREATE INDEX IF NOT EXISTS posts_tenant_scheduled_at_idx
  ON posts (tenant_id, scheduled_at)
  WHERE scheduled_at IS NOT NULL;

-- Posts par tenant + statut (filtrage)
CREATE INDEX IF NOT EXISTS posts_tenant_status_idx
  ON posts (tenant_id, status);

-- Posts récents par tenant (tri DESC)
CREATE INDEX IF NOT EXISTS posts_tenant_created_at_idx
  ON posts (tenant_id, created_at DESC);

-- ── Trigger updated_at ────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_updated_at ON posts;
CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS tenants_updated_at ON tenants;
CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── Commentaires ──────────────────────────────────────────────

COMMENT ON TABLE posts IS 'Posts planifiés par tenant pour publication multi-plateforme';
COMMENT ON COLUMN posts.platforms IS 'Tableau de plateformes cibles pour ce post';
COMMENT ON COLUMN posts.status IS 'Cycle de vie : draft → review → approved → scheduled → publishing → published | failed';
COMMENT ON COLUMN posts.platform_results IS 'Résultat de publication par plateforme : { "twitter": { "post_id", "url", "error" } }';
COMMENT ON COLUMN posts.brand_dna_snapshot IS 'Snapshot du Brand DNA au moment de la création (pour analytics)';
