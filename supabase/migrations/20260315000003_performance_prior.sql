-- ============================================================
-- RAMI — US-008 : Persistance du performance prior (Performance Loop)
-- Stocke le signal de performance réelle utilisé lors de la génération
-- (couleurs/styles gagnants), pour audit et analyse de la boucle.
-- ============================================================

ALTER TABLE public.visual_session_images
  ADD COLUMN IF NOT EXISTS performance_prior JSONB;

COMMENT ON COLUMN public.visual_session_images.performance_prior IS
  'Performance prior (US-008) pondérant la génération : { topColors, topStyles, sampleSize, source }. NULL = matrice Causse pure (volume sous le seuil).';
