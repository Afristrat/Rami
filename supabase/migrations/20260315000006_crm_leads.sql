-- ============================================================
-- CRM — leads + lead_activities (module CRM : table manquante en prod)
-- Le schéma existait dans src/lib/db/schema.ts mais n'avait aucune migration.
-- Fidèle au schéma Drizzle. RLS tenant (get_current_tenant_id) en défense en
-- profondeur (l'app accède via Drizzle/superuser + filtre tenant_id applicatif).
-- ============================================================

-- Enums
CREATE TYPE lead_stage AS ENUM ('lead', 'contacted', 'proposal', 'signed');
CREATE TYPE lead_activity_type AS ENUM ('call', 'email', 'meeting', 'note');

-- Table leads
CREATE TABLE public.leads (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name     varchar(255) NOT NULL,
  contact_name     varchar(255) NOT NULL,
  email            varchar(255),
  phone            varchar(50),
  linkedin_url     text,
  sector           varchar(100),
  company_size     varchar(50),
  location         varchar(255),
  stage            lead_stage NOT NULL DEFAULT 'lead',
  deal_value       integer DEFAULT 0,
  currency         varchar(3) NOT NULL DEFAULT 'MAD',
  score            integer DEFAULT 0,
  brand_dna_match  jsonb,
  apollo_data      jsonb,
  next_followup_at timestamptz,
  assigned_to      uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_by       uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- Table lead_activities
CREATE TABLE public.lead_activities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type        lead_activity_type NOT NULL,
  content     text NOT NULL,
  created_by  uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_leads_tenant ON public.leads(tenant_id);
CREATE INDEX idx_leads_stage ON public.leads(tenant_id, stage);
CREATE INDEX idx_leads_updated ON public.leads(updated_at DESC);
CREATE INDEX idx_lead_activities_lead ON public.lead_activities(lead_id);
CREATE INDEX idx_lead_activities_tenant ON public.lead_activities(tenant_id);

-- RLS — isolation tenant (défense en profondeur)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_leads ON public.leads
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_lead_activities ON public.lead_activities
  FOR ALL
  USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());
