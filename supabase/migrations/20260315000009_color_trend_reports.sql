-- ============================================================
-- Rapport « Tendances Couleur MENA » (US-014/015)
-- Un rapport par (tenant, période trimestrielle). RLS tenant strict.
-- ============================================================

CREATE TABLE IF NOT EXISTS color_trend_reports (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sector       text NOT NULL,
  culture      text NOT NULL,
  period       text NOT NULL,                 -- ex. "2026-T2"
  report       jsonb NOT NULL,                -- ColorTrendReport sérialisé
  generated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_color_trend_reports_tenant_period UNIQUE (tenant_id, period)
);

CREATE INDEX IF NOT EXISTS idx_color_trend_reports_tenant
  ON color_trend_reports (tenant_id, generated_at DESC);

-- ── RLS : isolation tenant stricte ─────────────────────────────────────────
ALTER TABLE color_trend_reports ENABLE ROW LEVEL SECURITY;

-- Lecture : le tenant ne voit que ses propres rapports.
CREATE POLICY "color_trend_reports_select_own" ON color_trend_reports
  FOR SELECT USING (tenant_id = get_current_tenant_id());

-- Écriture : réservée au service-role (le générateur/cron). Aucune policy
-- write pour authenticated → les écritures applicatives passent par service-role.
CREATE POLICY "color_trend_reports_insert_own" ON color_trend_reports
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "color_trend_reports_update_own" ON color_trend_reports
  FOR UPDATE USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());
