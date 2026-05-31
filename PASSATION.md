<!-- PASSATION NUCLÉAIRE — RAMI by AI-MPower -->
<!-- Protocole de quart industrie nucléaire — lire INTÉGRALEMENT avant toute action -->

# == PASSATION RAMI 2026-05-31T12:00:00Z ==

> Légende sténo : `>` en cours · `!` problème · `✗` bloqué · `✓` validé · `→` transition · `!!` critique · `??` à vérifier · `cf.` voir

---

## [ETAT] — État global du projet

**Branche active** : `ralph/rami-completion` (créée cette session pour le mode Ralph). `main` = à jour, poussée.
**Repo GitHub** : https://github.com/Afristrat/Rami (origin/main synchronisé).
**Build** : ✅ `npm run build` → OK (Next 16.2.6, `output: standalone` conditionnel `BUILD_STANDALONE`).
**TypeScript** : ✅ 0 erreur · **Lint** : ✅ 0 erreur / 0 warning · **npm audit** : ✅ 0 vulnérabilité.
**Déployé en PROD** : ✅ **`https://rami.ai-mpower.com` EN LIGNE** (login testé en réel, dashboard OK).
**Hébergement** : **Coolify** (serveur Ubuntu `serveurai` 192.168.100.8) + **cloudflared tunnel** (PAS Vercel).
**Supabase** : **instance DÉDIÉE** `db-rami.ai-mpower.com` (service Coolify `supabase-rami`, uuid `szn6rjsrqig7n4oerw27egwr`). Migrations 24/24 appliquées, RLS 100%.
**LLM** : via **proxy LiteLLM** `proxy.ai-mpower.com` — texte `deepseek-v4-flash`, vision `moonshot-v1-8k-vision-preview`. Plus de clés directes Anthropic/OpenAI nécessaires.
**pg-boss** : ✅ connecté (schéma `pgboss`, 8 tables) — app `rami` sur réseau `coolify` partagé avec `supabase-db`.

---

## [ENCOURS] — Tâches actives

> **MODE RALPH ACTIF** sur la branche `ralph/rami-completion`. État dans `.ralph/prd.json` (50 US).
> Avancement : **1/50** (US-001 ✓). Prochaine story : **US-002** (MetricsProvider + collecte X), deps satisfaites.
> Reprendre : *« reprends en Ralph »* → CAS B (lire prd.json + progress.md + AGENTS.md, prendre prochaine `passes=false`).

---

## [FAIT] — Accompli cette session (2026-05-31) — ÉNORME

### Dette technique purgée (DEFCON N°3)
- Lint **5 erreurs + 39 warnings → 0/0** (RoleBadge, useCallback React Compiler, imports morts, alt-text, hooks deps).
- npm audit **31 vulns (2 crit, 9 high) → 0** (next 16.1.6→16.2.6, overrides postcss/esbuild).
- Typecheck 0, build OK.

### Git consolidé
- `main` était un stub `bb58a77`, code non-tracké, alors qu'`origin/main` avait les 125 commits réels. → reset --soft sur origin/main, correctifs reposés par-dessus, poussés. Historique préservé.

### Migration infra Vercel → Coolify
- `Dockerfile` (standalone) + `.dockerignore`, `next.config.ts` (CSP/images self-hosted via env), `vercel.json` supprimé, CI Coolify, `docs/DEPLOY_COOLIFY.md`.

### Déploiement prod (de zéro à live)
- Instance Supabase **dédiée** créée via API Coolify + 24 migrations + RLS.
- Domaine Kong `db-rami` corrigé **dans coolify-db** (`service_applications` id 18, fqdn `http://` pour éviter boucle TLS).
- App `rami` : 530 réparé (DNS `--overwrite-dns` vers tunnel nahda + `output:standalone` conditionnel).
- 14 variables env posées via API Coolify (NEXT_PUBLIC_* buildtime).
- Super-admin créé : `medamine.mansouriidrissi@gmail.com` (id `6d7bda98-44b0-4735-81f4-e9f7ff8274aa`) + **tenant `AI-MPower`** (id `0f38ef43-7467-494b-a2a4-86a21d3293bd`, plan enterprise) + ligne `users` (tenant lié). **Login validé API + navigateur.**
- pg-boss connecté (réseau coolify, `connect_to_docker_network=true` sur le service Supabase).

### LLM via proxy
- Code rendu provider-agnostic (5 fetch + SDK), texte→deepseek, vision→moonshot (base64 only). Clé LiteLLM dédiée `rami-app`. Config DB `ai_prompts_config` + `ai_provider_chains` basculée. **Génération tagline Brand DNA testée live.**

### Benchmark sectoriel : Perplexity → Crawl4AI + deepseek
- `benchmark.ts` réécrit : Crawl4AI (recherche DuckDuckGo) → deepseek synthèse. **Testé live (200, 8,4 s).** Plus de dépendance Perplexity.

### Analyse stratégique + PRD
- Audit codebase (réel vs factice) + **Moat Hunt scoré** (2 moats "priorité absolue" 13/15 : Performance Loop cross-tenant + Autorité Brand DNA).
- **PRD L99** : `docs/PRD_RAMI_L99.md` (epics) + `tasks/prd-rami-completion.md` (50 US ralph-tui).
- **Mode Ralph démarré** : `.ralph/` scaffoldé, US-001 (table `post_metrics` + RLS) livré.

---

## [ALERTE] — Avertissements / risques

- **!! Mot de passe super-admin EXPOSÉ en clair** (`7#s4R94wqXWs7dzxD_xJRD`) dans une session précédente → **À CHANGER**. Compromis. (transmis à nezha par l'utilisateur).
- **! Modules FACTICES en prod** (affichés mais non câblés) : Vidéo, Présentations, Competitors (données hardcodées), + 🟡 Transcriptions (Whisper absent), Documents (PDF absent), Leads (Apollo absent), Analytics (engagement réel absent). Détail : `docs/PRD_RAMI_L99.md` §0.2.
- **! Stripe encore en TEST** — Price IDs live + webhook live non configurés.
- **! IP publique serveur dynamique** (DHCP) — re-vérifier après reboot ; le tunnel cloudflared (cfargotunnel) est IP-indépendant donc OK.
- **! Branche ralph/rami-completion non mergée** dans main — 1 commit US-001 + scaffolding.

---

## [BLOQUE] — Items bloqués

| Item | Cause |
|------|-------|
| Validation runtime des metrics (US-002+) | ✗ Nécessite des posts publiés réels avec engagement |
| Benchmarks collectifs (US-009/010) | ✗ Nécessite ≥5 tenants opt-in (k-anonymity) |
| Stripe live | ✗ Price IDs live à créer côté Stripe dashboard |
| Envoi WhatsApp programmatique | ✗ Pas d'Evolution API dans le coffre (Hermès gère côté user) |

---

## [NEXT] — Prochaines actions prioritaires

1. **OPS-1** (US-017) : rotation du mot de passe super-admin (compromis). XS, urgent.
2. **Reprendre le Ralph loop** → US-002 (collecte metrics X), puis EPIC A complet = activer MOAT-1.
3. **OPS-2/3** : Stripe live + tâche cron reconcile Coolify.
4. Suivre le backlog `.ralph/prd.json` (P0 moats → P1 cœur factice → P2 surface).

---

## [CTX] — Contexte session

- Session marathon (audit → purge dette → migration Coolify → déploiement complet → LLM proxy → Crawl4AI → audit+moats → PRD L99 → mode Ralph US-001).
- Accès : SSH `serveurai_mnemo` ✓ · API Coolify (token coffre) ✓ · coffre DPAPI ✓ · Playwright (vérifs UI) ✓.
- Commits clés branche ralph : `19f570f` (scaffolding) · `e23c097` (US-001).

---

## [MEMO] — À ne pas oublier inter-sessions

- **Infra complète** : cf. memory projet `deploiement-coolify-infra.md` (Supabase dédié, proxy, cloudflared, gotchas).
- **Schéma DB réel** : `src/lib/db/schema.ts` (pas packages/db) ; migrations `supabase/migrations/` appliquées sur `db-rami` via `docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres`.
- **RLS** : `get_current_tenant_id()` lit `public.users.tenant_id`. Tout compte hors-onboarding doit avoir une ligne `tenants` (owner_id) + `users` (tenant_id) sinon 404.
- **LLM** : `OPENAI_BASE_URL=https://proxy.ai-mpower.com/v1`, `OPENAI_API_KEY`=clé rami. deepseek PAS via /v1/messages. moonshot vision = base64 inline only.
- **Crawl4AI** : `https://crawl4ai.ai-mpower.com` `POST /md {url, filter:"fit"}`.
- **Coolify** : app `rami` uuid `ry8ytnene4czxdhsoes0z56y`, service Supabase `szn6rjsrqig7n4oerw27egwr`, projet RAMI `auqfv8irum62nirlv65obbg6`. Auto-deploy sur push main. Domaine sous-service = éditer `coolify-db` table `service_applications` (l'API ne l'expose pas).
- **Ralph** : état dans `.ralph/prd.json` + `.ralph/progress.md` + `AGENTS.md`. Reprendre via *« reprends en Ralph »*.
- **PRD complet** : `docs/PRD_RAMI_L99.md` + `tasks/prd-rami-completion.md`.
