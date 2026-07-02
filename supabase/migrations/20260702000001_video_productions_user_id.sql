-- ============================================================
-- video_productions.user_id — auteur de la production
--
-- Root cause (2026-07-02) : sans cette colonne, seule la route GET
-- /api/video/[id] (polling navigateur, session vivante) connaissait
-- l'utilisateur au moment de la finalisation. Le worker de fond
-- render-watch-worker (cf. migration précédente 20260629000002) n'a pas
-- de session HTTP et ne pouvait donc jamais référencer la vidéo terminée
-- dans media_assets (Bibliothèque) — resultat : AUCUNE production vidéo,
-- même réussie, n'apparaissait jamais dans la Bibliothèque, qu'elle ait
-- été finalisée par le navigateur ou par le worker.
-- ============================================================

ALTER TABLE video_productions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_video_productions_user ON video_productions (user_id);
