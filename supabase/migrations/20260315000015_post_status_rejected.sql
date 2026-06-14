-- ============================================================
-- Ajout du statut 'rejected' à l'enum post_status
-- ============================================================
-- Le tableau d'approbation interne (Kanban /dashboard/approvals) distingue
-- un post « rejeté » (refus tracé, avec commentaire) d'un post renvoyé en
-- brouillon. Sans cette valeur, la colonne « Rejeté » ne pouvait afficher que
-- des données factices. ADD VALUE est idempotent (IF NOT EXISTS) et hors
-- transaction (autocommit) pour être utilisable immédiatement.

ALTER TYPE post_status ADD VALUE IF NOT EXISTS 'rejected';
