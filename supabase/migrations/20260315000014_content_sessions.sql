-- ============================================================
-- Persistance du workflow « Créer un post » — table content_sessions
-- L'état du wizard (7 étapes) vivait uniquement en mémoire React :
-- refresh / fermeture d'onglet = travail perdu (y compris des visuels
-- générés qui ont consommé du quota). Cette table porte l'autosave
-- serveur à chaque transition d'étape + la reprise au montage.
-- ============================================================

CREATE TABLE public.content_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_by   uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title        varchar(200),
  current_step smallint NOT NULL DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7),
  -- WorkflowState sérialisé (brief, plateformes, captions, visuels, sélections…)
  state        jsonb NOT NULL,
  status       text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Index : reprise = dernière session active d'un utilisateur
CREATE INDEX idx_content_sessions_resume
  ON public.content_sessions (created_by, status, updated_at DESC);
CREATE INDEX idx_content_sessions_tenant
  ON public.content_sessions (tenant_id, updated_at DESC);

-- ── RLS : isolation tenant stricte ─────────────────────────────────────────
ALTER TABLE public.content_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_sessions_select_own" ON public.content_sessions
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "content_sessions_insert_own" ON public.content_sessions
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "content_sessions_update_own" ON public.content_sessions
  FOR UPDATE USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "content_sessions_delete_own" ON public.content_sessions
  FOR DELETE USING (tenant_id = get_current_tenant_id());
