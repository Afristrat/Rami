-- ============================================================
-- Document Engine — table documents (US-025)
-- Le schéma existait dans src/lib/db/schema.ts mais n'avait aucune migration
-- (la page Documents retombait sur des données de démo). Fidèle au schéma
-- Drizzle. RLS tenant strict (get_current_tenant_id).
-- ============================================================

-- Enums
CREATE TYPE document_type AS ENUM ('offre_commerciale', 'rapport_client', 'presentation');
CREATE TYPE document_status AS ENUM ('draft', 'in_progress', 'completed');

-- Table documents
CREATE TABLE public.documents (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title              varchar(500) NOT NULL,
  type               document_type NOT NULL,
  client_name        varchar(255),
  status             document_status NOT NULL DEFAULT 'draft',
  storage_path       text,
  public_url         text,
  content_json       jsonb,
  brand_dna_snapshot jsonb,
  file_size_bytes    integer,
  created_by         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_documents_tenant_created
  ON public.documents (tenant_id, created_at DESC);
CREATE INDEX idx_documents_tenant_type
  ON public.documents (tenant_id, type);

-- ── RLS : isolation tenant stricte ─────────────────────────────────────────
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "documents_update_own" ON public.documents
  FOR UPDATE USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE USING (tenant_id = get_current_tenant_id());
