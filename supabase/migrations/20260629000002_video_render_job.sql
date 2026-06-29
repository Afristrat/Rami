-- ============================================================
-- Flux vidéo v2 « par scène » — suivi en 2 phases.
-- En v2, RAMI lance d'abord un STORYBOARD (mishkat_job_id), génère une image
-- par scène, puis lance le RENDU final (un second job Mishkāt). On stocke l'id
-- du job de rendu à part : `mishkat_job_id` reste l'identifiant STABLE suivi par
-- le client ; `render_job_id` porte le job de rendu une fois la production lancée.
-- NULL en v1 (un seul job) → comportement inchangé.
-- ============================================================

ALTER TABLE public.video_productions
  ADD COLUMN IF NOT EXISTS render_job_id text;
