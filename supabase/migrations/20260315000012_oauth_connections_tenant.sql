-- ============================================================
-- Aligner oauth_connections sur tenants(id) (corrigé 2026-06-12)
-- ============================================================
-- La table rattachait les connexions à auth.users(id) (MVP user_id=tenant_id),
-- alors que posts/documents/leads utilisent tenants(id). Conséquence : une
-- connexion créée par le callback (tenant_id = user.id) était introuvable par
-- le test et la publication (qui cherchent par tenant.id réel). On bascule
-- TOUS les réseaux sociaux sur tenants(id) + RLS get_current_tenant_id().

-- 1. Retirer l'ancienne FK (vers users) AVANT de convertir les valeurs.
ALTER TABLE public.oauth_connections
  DROP CONSTRAINT IF EXISTS oauth_connections_tenant_id_fkey;

-- 2. Convertir les tenant_id existants (user.id → tenant.id)
UPDATE public.oauth_connections oc
SET tenant_id = u.tenant_id
FROM public.users u
WHERE u.id = oc.tenant_id AND u.tenant_id IS NOT NULL;

-- 3. Ajouter la nouvelle FK vers tenants(id)
ALTER TABLE public.oauth_connections
  ADD CONSTRAINT oauth_connections_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;

-- 3. RLS : passer de auth.uid() à get_current_tenant_id()
DROP POLICY IF EXISTS "tenant_select_own_connections" ON public.oauth_connections;
DROP POLICY IF EXISTS "tenant_insert_own_connections" ON public.oauth_connections;
DROP POLICY IF EXISTS "tenant_update_own_connections" ON public.oauth_connections;
DROP POLICY IF EXISTS "tenant_delete_own_connections" ON public.oauth_connections;

CREATE POLICY "oauth_connections_select_own" ON public.oauth_connections
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "oauth_connections_insert_own" ON public.oauth_connections
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "oauth_connections_update_own" ON public.oauth_connections
  FOR UPDATE USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "oauth_connections_delete_own" ON public.oauth_connections
  FOR DELETE USING (tenant_id = get_current_tenant_id());

COMMENT ON COLUMN public.oauth_connections.tenant_id IS
  'Référence tenants(id) — aligné avec posts/documents/leads (corrigé 2026-06-12).';
