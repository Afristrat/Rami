-- ============================================================
-- RAMI — Migration Profiles
-- Table publique liée à auth.users avec rôle global
-- ============================================================

-- ── Enum rôle global ──────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE global_role AS ENUM ('user', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table profiles ────────────────────────────────────────────────────────────
-- Miroir public de auth.users avec rôle global et métadonnées additionnelles.
-- Créée automatiquement via trigger à chaque inscription.

CREATE TABLE IF NOT EXISTS profiles (
  id           UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT,
  display_name TEXT,
  avatar_url   TEXT,
  global_role  global_role  NOT NULL DEFAULT 'user',
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Ajout de la colonne global_role si la table existe déjà sans elle
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN global_role global_role NOT NULL DEFAULT 'user';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ── Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_global_role
  ON profiles (global_role)
  WHERE global_role = 'super_admin';

-- ── RLS sur profiles ──────────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Lecture : chaque utilisateur voit son propre profil
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Lecture : super_admin peut voir tous les profils
DROP POLICY IF EXISTS "profiles_select_super_admin" ON profiles;
CREATE POLICY "profiles_select_super_admin" ON profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );

-- Mise à jour : utilisateur met à jour son propre profil (sauf global_role)
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- L'utilisateur ne peut pas modifier son propre global_role
    AND global_role = (SELECT global_role FROM profiles WHERE id = auth.uid())
  );

-- Mise à jour : super_admin peut tout modifier
DROP POLICY IF EXISTS "profiles_update_super_admin" ON profiles;
CREATE POLICY "profiles_update_super_admin" ON profiles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND global_role = 'super_admin'
    )
  );

-- ── Trigger : création automatique du profil à l'inscription ─────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email        = EXCLUDED.email,
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    updated_at   = NOW();

  RETURN NEW;
END;
$$;

-- Recréer le trigger proprement
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ── Trigger : mise à jour de updated_at ──────────────────────────────────────
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();
