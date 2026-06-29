-- ============================================================
-- US-052 — Table `visuals` (API publique v1 de génération visuelle)
-- Une ligne = un artefact (image OU carrousel) généré via clé d'API, avec son
-- manifeste, le résultat des gates QA déterministes et les slides MinIO.
-- Distincte de `visual_sessions` (parcours UI 4 directions).
-- RLS : isolation tenant stricte via get_current_tenant_id() (= users.tenant_id),
-- pattern identique à api_keys / content_sessions (PAS le JOIN tenant_members).
-- L'API v1 écrit/lit via le client service-role (bypass RLS) en filtrant
-- explicitement par tenant_id ; la RLS protège les accès par session utilisateur.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.visuals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  type               varchar(32) NOT NULL,                       -- carousel | image (extensible)
  format             varchar(16) NOT NULL,                       -- 1:1 | 4:5 | 9:16 | 16:9
  status             varchar(16) NOT NULL DEFAULT 'generating',  -- generating | ready | failed
  manifest           jsonb,                                      -- { type, format, width, height, fonts_embedded, slides }
  qa                 jsonb,                                      -- { passed, gates[], brandPreflightScore }
  slides             jsonb NOT NULL DEFAULT '[]'::jsonb,          -- [{ n, minio_path, public_url }]
  content            jsonb,                                      -- payload de génération (+ feedback de régénération)
  brand_dna_snapshot jsonb,                                      -- identité de marque résolue au moment de la génération
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visuals_tenant ON public.visuals (tenant_id, created_at DESC);

-- ── RLS : isolation tenant stricte ─────────────────────────────────────────
ALTER TABLE public.visuals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "visuals_select_own" ON public.visuals
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "visuals_insert_own" ON public.visuals
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "visuals_update_own" ON public.visuals
  FOR UPDATE USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "visuals_delete_own" ON public.visuals
  FOR DELETE USING (tenant_id = get_current_tenant_id());
