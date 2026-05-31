-- ============================================================
-- RAMI — US-007 : Attribution feature → performance (Performance Loop, MOAT-1)
-- Relie l'engagement réel (post_metrics) aux choix de création stockés dans
-- posts.ai_metadata (objectif cognitif, couleur, direction visuelle, hook,
-- format, score Brand DNA) + l'heure de diffusion.
-- ============================================================

-- ── Vue attribution_facts ─────────────────────────────────────────────────────
-- Une ligne par (post, plateforme) = le DERNIER snapshot de metrics, enrichi
-- des dimensions de création. security_invoker=true (PG15+) → hérite des RLS
-- de posts ET post_metrics : isolation tenant garantie sans policy dédiée.

CREATE OR REPLACE VIEW public.attribution_facts
WITH (security_invoker = true) AS
SELECT DISTINCT ON (m.post_id, m.platform)
  m.id              AS metric_id,
  m.tenant_id,
  m.post_id,
  m.platform,
  m.collected_at,
  m.impressions,
  m.likes,
  m.comments,
  m.shares,
  m.clicks,
  m.saves,
  m.engagement_rate,
  -- Dimensions d'attribution (NULL si non renseignées → honnête, DÉFCON 1)
  (p.ai_metadata->>'cognitive_objective')              AS cognitive_objective,
  (p.ai_metadata->>'direction')                        AS visual_direction,
  (p.ai_metadata->>'dominant_color_hex')               AS dominant_color_hex,
  (p.ai_metadata->>'hook')                             AS hook,
  (p.ai_metadata->>'format')                           AS format,
  NULLIF(p.ai_metadata->>'brand_dna_score', '')::real  AS brand_dna_score,
  extract(hour FROM COALESCE(p.scheduled_at, p.published_at))::int AS scheduled_hour,
  p.published_at
FROM public.post_metrics m
JOIN public.posts p ON p.id = m.post_id
ORDER BY m.post_id, m.platform, m.collected_at DESC;

COMMENT ON VIEW public.attribution_facts IS
  'Dernier snapshot de metrics par (post, plateforme) joint aux dimensions de création (ai_metadata). security_invoker → RLS tenant héritée.';

-- ── Table attribution_rankings (cache pré-agrégé) ──────────────────────────────
-- Rempli par le job pg-boss attribution.refresh (incrémental par tenant).
-- Lecture rapide pour le dashboard analytics (US-012).

CREATE TABLE IF NOT EXISTS public.attribution_rankings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  dimension         TEXT NOT NULL,   -- cognitive_objective | dominant_color_hex | visual_direction | hook | format | scheduled_hour | platform
  value             TEXT NOT NULL,   -- valeur de la dimension
  avg_engagement    REAL NOT NULL DEFAULT 0,
  total_impressions BIGINT NOT NULL DEFAULT 0,
  sample_size       INTEGER NOT NULL DEFAULT 0,
  computed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_attribution_rankings_tenant_dim_val
  ON public.attribution_rankings (tenant_id, dimension, value);
CREATE INDEX IF NOT EXISTS idx_attribution_rankings_tenant_dim
  ON public.attribution_rankings (tenant_id, dimension, avg_engagement DESC);

-- ── RLS — isolation tenant (pattern identique à post_metrics) ──────────────────
ALTER TABLE public.attribution_rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attribution_rankings_tenant_select"
  ON public.attribution_rankings
  FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "attribution_rankings_tenant_insert"
  ON public.attribution_rankings
  FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "attribution_rankings_tenant_update"
  ON public.attribution_rankings
  FOR UPDATE
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "attribution_rankings_tenant_delete"
  ON public.attribution_rankings
  FOR DELETE
  USING (tenant_id = get_current_tenant_id());
