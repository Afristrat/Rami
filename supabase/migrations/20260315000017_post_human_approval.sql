-- ============================================================
-- Verrou de publication — approbation humaine sur posts
-- ============================================================
-- Aucune publication (workflow, Kanban, API v1/Hermès, programmé) ne doit
-- partir sans qu'un membre du tenant ait approuvé le contenu tel qu'il sera
-- publié. Ces deux colonnes portent cette approbation ; toute édition de
-- contenu les réinitialise (re-validation obligatoire). NULL = non approuvé.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

COMMENT ON COLUMN posts.approved_by IS 'Membre du tenant ayant approuvé la publication (NULL = non approuvé).';
COMMENT ON COLUMN posts.approved_at IS 'Horodatage de l''approbation humaine pour publication.';
