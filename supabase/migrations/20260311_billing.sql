-- ============================================================
-- RAMI — Migration Billing
-- Colonnes Stripe sur tenants + table invoices + RLS
-- ============================================================

-- ── Colonnes billing sur tenants (si absentes) ───────────────────────────────
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status     VARCHAR(50) DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS generation_count        INTEGER     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS generation_reset_at     TIMESTAMPTZ;

-- Index pour les lookups Stripe
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_stripe_customer
  ON tenants (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_stripe_subscription
  ON tenants (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ── Enum plan (si absent) ─────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE plan AS ENUM ('free', 'solo', 'pro', 'agency', 'agency_plus', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Colonne plan sur tenants
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS plan plan NOT NULL DEFAULT 'free';

-- ── Table invoices (cache local des factures Stripe) ─────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id                   UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id            UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_invoice_id    VARCHAR(255) NOT NULL UNIQUE,
  stripe_customer_id   VARCHAR(255) NOT NULL,
  amount_paid          INTEGER      NOT NULL DEFAULT 0,  -- en centimes
  currency             VARCHAR(3)   NOT NULL DEFAULT 'usd',
  status               VARCHAR(50)  NOT NULL DEFAULT 'paid',
  invoice_pdf_url      TEXT,
  invoice_number       VARCHAR(100),
  period_start         TIMESTAMPTZ,
  period_end           TIMESTAMPTZ,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id
  ON invoices (tenant_id, created_at DESC);

-- ── RLS sur invoices ──────────────────────────────────────────────────────────
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_own_invoices" ON invoices
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE owner_id = auth.uid()
    )
  );

-- Insertions uniquement via service role (webhook)
CREATE POLICY "service_insert_invoices" ON invoices
  FOR INSERT
  WITH CHECK (TRUE);

-- ── Fonction reset quota mensuel ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION reset_generation_quota()
RETURNS TRIGGER AS $$
BEGIN
  -- Réinitialise le compteur si le plan change
  IF OLD.plan IS DISTINCT FROM NEW.plan THEN
    NEW.generation_count := 0;
    NEW.generation_reset_at := NOW() + INTERVAL '1 month';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_reset_quota_on_plan_change ON tenants;

CREATE TRIGGER trigger_reset_quota_on_plan_change
  BEFORE UPDATE OF plan ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION reset_generation_quota();

-- ── Commentaires ─────────────────────────────────────────────────────────────
COMMENT ON TABLE invoices IS 'Cache local des factures Stripe par tenant';
COMMENT ON COLUMN tenants.stripe_customer_id IS 'Stripe Customer ID — null si plan Free sans CB';
COMMENT ON COLUMN tenants.stripe_subscription_id IS 'Stripe Subscription ID — null si Free';
COMMENT ON COLUMN tenants.subscription_status IS 'active | past_due | canceled | unpaid | trialing | inactive';
COMMENT ON COLUMN tenants.generation_count IS 'Compteur générations visuelles du mois en cours';
COMMENT ON COLUMN tenants.generation_reset_at IS 'Date de remise à zéro du compteur mensuel';
