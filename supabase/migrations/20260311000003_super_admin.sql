-- ============================================================
-- RAMI — Fonction is_super_admin()
-- Dépend de : 20260311000002_profiles.sql (colonne global_role)
-- ============================================================

-- Fonction helper utilisée dans les RLS policies des tables admin-only
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND global_role = 'super_admin'
  );
$$;
