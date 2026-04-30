-- ============================================================
-- RAMI — Migration Settings
-- Tables : tenant_members + notification_preferences
-- ============================================================

-- ── Enum role membre ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Enum statut invitation ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE invite_status AS ENUM ('pending', 'accepted', 'revoked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table tenant_members ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tenant_members (
  id          UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id   UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  email       VARCHAR(255) NOT NULL,
  role        member_role  NOT NULL DEFAULT 'viewer',
  status      invite_status NOT NULL DEFAULT 'pending',
  invited_by  UUID         REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_tenant
  ON tenant_members (tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_tenant_members_user
  ON tenant_members (user_id);

-- ── RLS tenant_members ────────────────────────────────────────────────────────
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- Lecture : membres du tenant (owner + membres acceptés)
CREATE POLICY "tenant_members_select" ON tenant_members
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Insertion : uniquement l'owner peut inviter
CREATE POLICY "tenant_members_insert" ON tenant_members
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- Mise à jour : owner peut modifier les rôles, membre peut accepter son invitation
CREATE POLICY "tenant_members_update" ON tenant_members
  FOR UPDATE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Suppression : uniquement l'owner peut révoquer
CREATE POLICY "tenant_members_delete" ON tenant_members
  FOR DELETE
  USING (
    tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  );

-- ── Table notification_preferences ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_preferences (
  id                          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_post_published        BOOLEAN NOT NULL DEFAULT TRUE,
  email_post_failed           BOOLEAN NOT NULL DEFAULT TRUE,
  email_quota_warning         BOOLEAN NOT NULL DEFAULT TRUE,
  email_team_invite            BOOLEAN NOT NULL DEFAULT TRUE,
  email_billing               BOOLEAN NOT NULL DEFAULT TRUE,
  email_weekly_digest         BOOLEAN NOT NULL DEFAULT FALSE,
  email_brand_dna_tips        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RLS notification_preferences ─────────────────────────────────────────────
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notif_prefs_own" ON notification_preferences
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
