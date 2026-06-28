-- ============================================================
-- Fix RLS video_productions — la policy initiale exigeait une appartenance
-- via tenant_members, mais les tenants sont rattachés à l'utilisateur via
-- users.tenant_id (cf. media_assets). L'INSERT était donc rejeté par la RLS.
-- On couvre LES DEUX rattachements (users.tenant_id ∪ tenant_members),
-- avec USING + WITH CHECK explicites.
-- ============================================================

DROP POLICY IF EXISTS "tenant_isolation_video_productions" ON video_productions;

CREATE POLICY "tenant_isolation_video_productions" ON video_productions
  FOR ALL
  USING (
    tenant_id IN (
      SELECT u.tenant_id FROM users u WHERE u.id = auth.uid() AND u.tenant_id IS NOT NULL
      UNION
      SELECT tm.tenant_id FROM tenant_members tm WHERE tm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT u.tenant_id FROM users u WHERE u.id = auth.uid() AND u.tenant_id IS NOT NULL
      UNION
      SELECT tm.tenant_id FROM tenant_members tm WHERE tm.user_id = auth.uid()
    )
  );
