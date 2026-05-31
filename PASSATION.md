<!-- PASSATION NUCLÉAIRE — RAMI by AI-MPower -->
<!-- Protocole de quart industrie nucléaire — lire INTÉGRALEMENT avant toute action -->

# == PASSATION RAMI 2026-05-31T19:30:00Z ==

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
> Avancement : **9/50** (US-001→009 ✓) + **US-011 implémentée** (`passes=false`, en attente du SEUL gate « vérif navigateur »).
> **Epic A — Performance Loop (MOAT-1) quasi complet** : collecte 5 plateformes + job + attribution + prior + schéma collectif + opt-in.
> **Prochaine action** : exécuter la **vérif navigateur US-011** (plan détaillé dans `.ralph/progress.md` § CHECKPOINT) → puis **US-010** (job agrégation collective, déblocable, backend-only) → **US-012** (dashboard).
> Reprendre : *« continue »* / *« reprends en Ralph »* → CAS B (lire prd.json + progress.md + AGENTS.md).

---

## [FAIT] — Session Ralph #2 (2026-05-31 après-midi) — Epic A

> 8 stories `passes=true` (US-002→009) + US-011 implémentée. **5 migrations appliquées sur la prod db-rami, chacune RLS-testée.** Gates TS0/lint0/build OK à chaque story. Zéro donnée inventée (DÉFCON 1).

- **US-002→005 — Collecte metrics réelles** : module `src/lib/services/metrics/` (abstraction `MetricsProvider` + router `collectMetricsFromPlatform`). Providers Twitter (API v2), LinkedIn (organizationalEntityShareStatistics / socialActions), Meta FB+IG (Graph insights), Pinterest (v5 analytics). Token révoqué/post supprimé → `{unavailable:true}` sans crash. Metrics non exposées par une API → 0 (jamais estimé).
- **US-006 — Job pg-boss collecte** : `jobs/collect-metrics.ts` planifie T+1h/24h/7j après publication (`scheduleMetricsCollection`), upsert snapshots dans `post_metrics`. Refresh OAuth extrait en `queue/token-refresh.ts` (DRY publish+collecte).
- **US-007 — Attribution feature→performance** : migration → VIEW `attribution_facts` (`security_invoker`, RLS héritée) + table `attribution_rankings` (RLS). Service `metrics/attribution.ts` (`topFeatures`, `aggregateAttribution`). Job cron `attribution.refresh` (6h, incrémental). **RLS testée** (SELECT isolé + INSERT cross-tenant bloqué).
- **US-008 — Performance prior** : `compileBrandDNAToPrompts` accepte un `performancePrior` (couleurs/styles gagnants), gaté `MIN_PRIOR_SAMPLE=10` (sinon Causse pur). Persisté `visual_session_images.performance_prior` (jsonb).
- **US-009 — Intelligence collective** : table `collective_benchmarks` SANS tenant_id (cross-tenant), `CHECK(sample_size>=5)` k-anonymity, helper `get_current_tenant_sector()`, RLS SELECT filtrée secteur + write service-role only. **3 tests sécurité passés.**
- **US-011 — Opt-in RGPD (impl)** : `tenants.collective_optin` + helper `current_tenant_is_collective_optin()` + RLS benchmarks exige opt-in (refus=0 accès). Actions get/set + UI section « Intelligence collective » (toggle + texte consentement). **RLS testée db-rami** (false→0, true→accès). ✗ **vérif navigateur en attente** (cf. ALERTE split env).
- Commits : `b6c087c · 1409e11 · 0c9acd6 · 7a193ff · e436daf · a3db978 · 174e5ff · eac7dab · 15b25ae` + checkpoints.

---

## [FAIT] — Session #1 (2026-05-31 matin) — ÉNORME

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
- **! Branche ralph/rami-completion non mergée** dans main — désormais ~12 commits (US-001→009 + US-011 impl + checkpoints).
- **!! SPLIT ENVIRONNEMENT dev/prod** (découvert session #2) : `.env.local` → instance Supabase **cloud** `rfndjbrwpdltfzvyreyv.supabase.co` (séparée), alors que la **prod = db-rami**. Les migrations vont sur **db-rami uniquement** (décision Amine). Conséquence : `npm run dev` brut tape sur le cloud (non migré) → pour browser-verify, lancer dev avec env override vers db-rami. Plan complet dans `.ralph/progress.md`.
- **! `brand_dna` shape RÉELLE = PLATE** (`brand_dna->>'sector'`, `->>'primaryCulture'`, `colorPrimary`…), alors que l'interface `BrandDNA` du `prompt-compiler` suppose une shape NESTÉE (`identity.sector`, `color_palette[]`). **Divergence = dette pré-existante** : le compiler lit probablement mal les couleurs en prod. Story dédiée à créer (hors-scope Ralph actuel).

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

1. **Vérif navigateur US-011** : créer compte test sur db-rami + dev local override → db-rami + Playwright (plan exact dans `.ralph/progress.md` § CHECKPOINT). Puis `passes=true`.
2. **US-010** (job agrégation collective, backend-only, déblocable — le flag opt-in qu'il consomme est en place + DB-testé) : sweep tenants opt-in → agrège `post_metrics` par (secteur,culture,plateforme,metric), k≥5, upsert `collective_benchmarks`. Test : <5 tenants → 0 ligne.
3. **US-012** (dashboard analytics réel) : lit `post_metrics` + `attribution_rankings` (réutilise le compte test pour browser-verify).
4. **OPS-1** (US-017) : rotation mot de passe super-admin (compromis). XS, urgent.
5. Suivre le backlog `.ralph/prd.json` (fin Epic A → OPS → P1 cœur factice → P2 surface).

---

## [CTX] — Contexte session

- Session #2 = Ralph loop Epic A (US-002→009 + US-011 impl), avec migrations + tests RLS exécutés DIRECTEMENT sur la prod db-rami via SSH.
- **Méthode migration db-rami (validée)** : `$sql=[IO.File]::ReadAllText(<migration>)` → base64 → `ssh -i $env:SERVER_SSH_KEY $env:SERVER_SSH_USER@$env:SERVER_HOST "echo '<blob>' | base64 -d | docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres -d postgres -v ON_ERROR_STOP=1"`. Charger le coffre d'abord (`. load-secrets.ps1`).
- **Test RLS** : transaction `BEGIN; ... SELECT set_config('request.jwt.claims','{"sub":"<userid>"}',true); SET LOCAL ROLE authenticated; <test>; ROLLBACK;`. ⚠️ éviter blocs `DO $$` (échappement PowerShell casse le dollar-quoting) → INSERT directs.
- Accès : SSH `serveurai_mnemo` ✓ · API Coolify (token coffre) ✓ · coffre DPAPI ✓ · Playwright (vérifs UI) ✓.
- Commits clés : session #1 `19f570f`/`e23c097` ; session #2 US-002→009 + US-011 (cf. [FAIT]).

---

## [MEMO] — À ne pas oublier inter-sessions

- **Infra complète** : cf. memory projet `deploiement-coolify-infra.md` (Supabase dédié, proxy, cloudflared, gotchas).
- **Schéma DB réel** : `src/lib/db/schema.ts` (pas packages/db) ; migrations `supabase/migrations/` appliquées sur `db-rami` via `docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres` (méthode base64 cf. [CTX]).
- **Tables Performance Loop (session #2)** : `post_metrics`, `attribution_facts` (vue), `attribution_rankings`, `collective_benchmarks`, `tenants.collective_optin`, `visual_session_images.performance_prior`. Helpers RLS : `get_current_tenant_id()`, `get_current_tenant_sector()` (= `brand_dna->>'sector'`), `current_tenant_is_collective_optin()`.
- **Module metrics** : `src/lib/services/metrics/{types,engagement,twitter,linkedin,meta,pinterest,attribution,index}.ts`. Workers : `src/lib/queue/jobs/{collect-metrics,attribution-refresh}.ts` + `token-refresh.ts`, enregistrés dans `src/instrumentation.ts`.
- **Compte test db-rami** : à créer (n'existe pas encore) pour browser-verify — db-rami n'a QUE le super-admin. Réutilisable pour toutes les stories UI.
- **RLS** : `get_current_tenant_id()` lit `public.users.tenant_id`. Tout compte hors-onboarding doit avoir une ligne `tenants` (owner_id) + `users` (tenant_id) sinon 404.
- **LLM** : `OPENAI_BASE_URL=https://proxy.ai-mpower.com/v1`, `OPENAI_API_KEY`=clé rami. deepseek PAS via /v1/messages. moonshot vision = base64 inline only.
- **Crawl4AI** : `https://crawl4ai.ai-mpower.com` `POST /md {url, filter:"fit"}`.
- **Coolify** : app `rami` uuid `ry8ytnene4czxdhsoes0z56y`, service Supabase `szn6rjsrqig7n4oerw27egwr`, projet RAMI `auqfv8irum62nirlv65obbg6`. Auto-deploy sur push main. Domaine sous-service = éditer `coolify-db` table `service_applications` (l'API ne l'expose pas).
- **Ralph** : état dans `.ralph/prd.json` + `.ralph/progress.md` + `AGENTS.md`. Reprendre via *« reprends en Ralph »*.
- **PRD complet** : `docs/PRD_RAMI_L99.md` + `tasks/prd-rami-completion.md`.
