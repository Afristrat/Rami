-- ============================================================
-- Migration : queue_publish
-- Ajout du support pg-boss pour la publication des posts
-- ============================================================

-- 1. Créer le schéma pgboss si pg-boss ne l'a pas encore fait
-- (pg-boss le crée automatiquement au premier start, mais on s'assure
--  que le rôle service_role a les droits nécessaires)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'pgboss') THEN
    CREATE SCHEMA pgboss;
  END IF;
END $$;

-- Permissions pour pg-boss (utilisé par le worker via SUPABASE_DB_URL)
-- Le rôle postgres (service role) a déjà les droits sur son propre schéma.

-- 2. Ajouter le champ queue_job_id sur la table posts pour traçabilité
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS queue_job_id TEXT;

-- Index pour retrouver un post par son job pg-boss
CREATE INDEX IF NOT EXISTS idx_posts_queue_job_id
  ON public.posts (queue_job_id)
  WHERE queue_job_id IS NOT NULL;

-- 3. Index sur le statut pour le worker (requête fréquente)
CREATE INDEX IF NOT EXISTS idx_posts_status_scheduled
  ON public.posts (tenant_id, status, scheduled_at)
  WHERE status IN ('scheduled', 'publishing');

-- 4. Commentaires
COMMENT ON COLUMN public.posts.queue_job_id IS
  'ID du job pg-boss associé à ce post pour traçabilité et annulation';

COMMENT ON COLUMN public.posts.platform_results IS
  'Résultats de publication par plateforme : { platform: { status, postId, postUrl, error } }';
