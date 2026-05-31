-- ============================================================
-- RAMI — US-001 : Table post_metrics (engagement réel)
-- Performance Loop (MOAT-1) : stocke les metrics réelles par post/plateforme.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.post_metrics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  post_id          UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  platform         platform NOT NULL,
  collected_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  impressions      INTEGER DEFAULT 0,
  likes            INTEGER DEFAULT 0,
  comments         INTEGER DEFAULT 0,
  shares           INTEGER DEFAULT 0,
  clicks           INTEGER DEFAULT 0,
  saves            INTEGER DEFAULT 0,
  engagement_rate  REAL DEFAULT 0,
  raw              JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_metrics_tenant_platform_collected
  ON public.post_metrics (tenant_id, platform, collected_at);
CREATE INDEX IF NOT EXISTS idx_post_metrics_post
  ON public.post_metrics (post_id);

-- ── RLS — isolation tenant (pattern identique à posts) ───────
ALTER TABLE public.post_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_metrics_tenant_select"
  ON public.post_metrics
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "post_metrics_tenant_insert"
  ON public.post_metrics
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "post_metrics_tenant_update"
  ON public.post_metrics
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "post_metrics_tenant_delete"
  ON public.post_metrics
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());
