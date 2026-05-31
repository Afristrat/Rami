# AGENTS.md — RAMI

Conventions pour les agents IA travaillant sur RAMI (mode Ralph).

## Règles d'or
1. **Une seule story à la fois** (cf. `.ralph/prd.json`). Respecter les dépendances (`deps` passes=true).
2. **Quality gates avant `passes=true`** : `npm run typecheck` (0), `npm run lint` (0), `npm run build` (OK). UI → vérif navigateur. Nouvelle table → RLS testée (cross-tenant échoue).
3. **Zéro dette** : aucune erreur TS, aucun warning lint, aucun TODO laissé. Corriger à la racine.
4. **Français irréprochable** (accents) dans commentaires et UI.
5. **Pas hors-scope** : ne modifier que ce que la story exige.

## Workflow par story
1. Lire `.ralph/prd.json` (story prioritaire passes=false, deps OK) + `.ralph/progress.md`.
2. Implémenter en suivant les patterns (`progress.md`).
3. Valider (gates).
4. `passes=true` + log dans `progress.md` + enrichir patterns.
5. Commit `[US-XXX] Titre`.
6. Story suivante. Si toutes passes=true → `<promise>COMPLETE</promise>`.

## Sécurité
- Secrets via env (coffre DPAPI), jamais en clair. RLS sur toutes les tables. Tokens OAuth chiffrés AES-256.
- Migrations Supabase sur l'instance dédiée `db-rami` (réseau Docker `szn6...`).

## Détails techniques : voir `.ralph/progress.md` (Codebase Patterns).
