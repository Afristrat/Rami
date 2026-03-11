-- ============================================================
-- RAMI — Table profiles + rôle super_admin
-- Migration : ajout du système de rôles applicatifs
-- ============================================================

-- ── Enum rôle applicatif ──────────────────────────────────────────────────────
-- Séparé du member_role (admin/editor/viewer) qui est un rôle DANS un tenant.
-- app_role est le rôle GLOBAL dans la plateforme RAMI.

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('user', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Table profiles ────────────────────────────────────────────────────────────
-- Étend auth.users avec des métadonnées applicatives.
-- Synchronisé via trigger sur auth.users (insert).

CREATE TABLE IF NOT EXISTS profiles (
  user_id     UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        app_role    NOT NULL DEFAULT 'user',
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Index ────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles (role)
  WHERE role = 'super_admin';  -- Index partiel : requêtes super_admin fréquentes

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : chaque utilisateur lit son propre profil
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (user_id = auth.uid());

-- Mise à jour : chaque utilisateur met à jour son propre profil
-- (sauf role — modifiable uniquement via service role / script admin)
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid() AND
    -- Interdit de se promouvoir soi-même en super_admin via l'UI
    role = (SELECT role FROM profiles WHERE user_id = auth.uid())
  );

-- ── Trigger : créer un profil automatiquement à l'inscription ─────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (user_id, role, full_name, avatar_url)
  VALUES (
    NEW.id,
    'user',
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── Trigger : updated_at automatique ─────────────────────────────────────────

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Fonction helper : vérifier si l'utilisateur courant est super_admin ───────
-- Utilisée dans d'autres RLS policies pour les tables admin-only.

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;
