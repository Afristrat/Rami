-- ============================================================
-- RAMI — US-011 : Consentement opt-in benchmarks collectifs (RGPD/CNDP)
-- Le tenant choisit de contribuer aux benchmarks anonymisés en échange de
-- l'accès collectif. Refus (défaut) = aucune contribution ET aucun accès.
-- ============================================================

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS collective_optin BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tenants.collective_optin IS
  'Consentement explicite (RGPD) à contribuer/accéder aux benchmarks collectifs anonymisés. Défaut false (opt-in).';

-- Helper : le tenant courant a-t-il consenti ?
CREATE OR REPLACE FUNCTION public.current_tenant_is_collective_optin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT t.collective_optin
     FROM public.users u
     JOIN public.tenants t ON t.id = u.tenant_id
     WHERE u.id = auth.uid()
     LIMIT 1),
    false
  );
$$;

-- Refus = pas d'accès : la lecture exige opt-in EN PLUS du même secteur.
DROP POLICY IF EXISTS "collective_benchmarks_sector_select" ON public.collective_benchmarks;
CREATE POLICY "collective_benchmarks_sector_select"
  ON public.collective_benchmarks
  FOR SELECT
  USING (
    sector = public.get_current_tenant_sector()
    AND public.current_tenant_is_collective_optin()
  );
