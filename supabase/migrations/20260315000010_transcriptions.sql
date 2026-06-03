-- ============================================================
-- Transcriptions (Whisper, US-022) — table + enum statut + RLS tenant
-- (le module existait en Drizzle uniquement ; gap prod : aucune migration).
-- ============================================================

DO $$ BEGIN
  CREATE TYPE transcription_status AS ENUM ('uploading', 'processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS transcriptions (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title             varchar(500) NOT NULL,
  original_filename varchar(500) NOT NULL,
  storage_path      text NOT NULL,
  mime_type         varchar(100) NOT NULL,
  file_size_bytes   integer NOT NULL,
  duration_seconds  integer,
  language          varchar(10) NOT NULL DEFAULT 'fr',
  status            transcription_status NOT NULL DEFAULT 'uploading',
  transcript_text   text,
  speakers          jsonb,
  verbatims         jsonb,
  ai_summary        text,
  ai_actions        jsonb,
  error_message     text,
  created_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transcriptions_tenant
  ON transcriptions (tenant_id, created_at DESC);

-- ── RLS : isolation tenant stricte ─────────────────────────────────────────
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transcriptions_select_own" ON transcriptions
  FOR SELECT USING (tenant_id = get_current_tenant_id());

CREATE POLICY "transcriptions_insert_own" ON transcriptions
  FOR INSERT WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "transcriptions_update_own" ON transcriptions
  FOR UPDATE USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "transcriptions_delete_own" ON transcriptions
  FOR DELETE USING (tenant_id = get_current_tenant_id());
