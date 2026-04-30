-- Fix RLS gaps identified during deploy audit
-- Tables social_accounts and audit_log were missing RLS policies

-- ============================================================
-- social_accounts — CRITICAL: stores OAuth tokens per tenant
-- ============================================================
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_social_accounts" ON social_accounts
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_insert_social_accounts" ON social_accounts
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_update_social_accounts" ON social_accounts
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_delete_social_accounts" ON social_accounts
  FOR DELETE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- audit_log — contains sensitive action logs per tenant
-- ============================================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_audit_log" ON audit_log
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "tenant_insert_audit_log" ON audit_log
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

-- audit_log: no update/delete — logs are immutable

-- ============================================================
-- media_assets — add missing UPDATE policy
-- ============================================================
CREATE POLICY "tenant_update_media_assets" ON media_assets
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- media — add missing UPDATE policy
-- ============================================================
CREATE POLICY "tenant_update_media" ON media
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()
    )
  );
