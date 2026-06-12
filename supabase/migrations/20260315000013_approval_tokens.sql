-- ============================================================
-- Approbation externe — table approval_tokens (LOT 1 Step 6)
-- Remplace l'URL d'approbation factice du workflow « Créer un post » :
-- un token aléatoire (capability URL) permet à un approbateur EXTERNE
-- (client final, sans compte RAMI) de consulter le post et de décider
-- via la route publique /approve/[token] (accès service-role, le token
-- long et à durée limitée EST l'authentification).
-- ============================================================

CREATE TABLE public.approval_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  post_id     uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  token       varchar(64) NOT NULL UNIQUE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  comment     text,
  decided_at  timestamptz,
  expires_at  timestamptz NOT NULL,
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_approval_tokens_post
  ON public.approval_tokens (post_id, created_at DESC);
CREATE INDEX idx_approval_tokens_tenant
  ON public.approval_tokens (tenant_id, created_at DESC);

-- ── RLS : isolation tenant stricte ─────────────────────────────────────────
-- La route publique /approve/[token] passe par le client service-role
-- (bypass RLS volontaire) : lookup exclusivement par token unique.
ALTER TABLE public.approval_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approval_tokens_select_own" ON public.approval_tokens
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "approval_tokens_insert_own" ON public.approval_tokens
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "approval_tokens_update_own" ON public.approval_tokens
  FOR UPDATE USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "approval_tokens_delete_own" ON public.approval_tokens
  FOR DELETE USING (tenant_id = get_current_tenant_id());
