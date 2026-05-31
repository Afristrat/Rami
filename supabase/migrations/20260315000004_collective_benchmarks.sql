-- ============================================================
-- RAMI — US-009 : Intelligence collective anonymisée (MOAT-1)
-- Benchmarks de performance agrégés CROSS-TENANT, par secteur × culture ×
-- plateforme × metric. AUCUN tenant_id : ce sont des moyennes collectives.
-- Garde-fous : RLS lecture filtrée par secteur, écriture service-role only,
-- k-anonymity ≥ 5 garantie par CHECK (aucune ligne ne peut exister sous 5).
-- ============================================================

-- ── Helper : secteur du tenant courant ─────────────────────────────────────────
-- Le secteur vit dans tenants.brand_dna (shape PLAT : brand_dna->>'sector').
CREATE OR REPLACE FUNCTION public.get_current_tenant_sector()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT t.brand_dna->>'sector'
  FROM public.users u
  JOIN public.tenants t ON t.id = u.tenant_id
  WHERE u.id = auth.uid()
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_current_tenant_sector() IS
  'Secteur du tenant courant (brand_dna->>''sector''). Utilisé par la RLS de collective_benchmarks pour ne révéler que les benchmarks du même secteur.';

-- ── Table collective_benchmarks ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.collective_benchmarks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector       TEXT NOT NULL,
  culture      TEXT NOT NULL,
  platform     platform NOT NULL,
  metric       TEXT NOT NULL,         -- avg_engagement | avg_impressions | avg_likes | ...
  value        REAL NOT NULL DEFAULT 0,
  sample_size  INTEGER NOT NULL,      -- nb de tenants distincts agrégés (k-anonymity)
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- k-anonymity : une ligne ne peut PHYSIQUEMENT exister que si ≥ 5 tenants.
  CONSTRAINT collective_benchmarks_k_anonymity CHECK (sample_size >= 5)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_collective_benchmarks_dims
  ON public.collective_benchmarks (sector, culture, platform, metric);

-- ── RLS — atypique : pas de tenant_id ──────────────────────────────────────────
-- SELECT : un tenant ne lit QUE les benchmarks de son propre secteur.
-- INSERT/UPDATE/DELETE : aucune policy → refusé pour authenticated/anon.
-- Le service-role (job d'agrégation US-010) contourne la RLS (bypassrls).
ALTER TABLE public.collective_benchmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collective_benchmarks_sector_select"
  ON public.collective_benchmarks
  FOR SELECT
  USING (sector = public.get_current_tenant_sector());
