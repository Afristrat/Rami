<!-- PASSATION NUCLÉAIRE — RAMI by AI-MPower -->
<!-- Protocole de quart industrie nucléaire — lire INTÉGRALEMENT avant toute action -->

# == PASSATION RAMI 2026-06-01T00:00:00Z (session #3) ==

> Légende sténo : `>` en cours · `!` problème · `✗` bloqué · `✓` validé · `→` transition · `!!` critique · `??` à vérifier · `cf.` voir

---

## [ETAT] — État global du projet

**Branche active** : `ralph/rami-completion` (~19 commits, **NON mergée** dans main). `main` = à jour, poussée.
**Repo GitHub** : https://github.com/Afristrat/Rami (origin/main synchronisé).
**Avancement Ralph** : **13/50** stories `passes=true`. **Epic A (Performance Loop / MOAT-1) = 12/12 COMPLET**. **Epic B (Autorité Brand DNA / MOAT-2) = 1/4** (US-013 ✓).
**Build** : ✅ `npm run build` → OK (Next 16.2.6, `output: standalone` conditionnel `BUILD_STANDALONE`).
**TypeScript** : ✅ 0 erreur · **Lint** : ✅ 0 erreur / 0 warning · **npm audit** : ✅ 0 vulnérabilité · **Jest** : 143/144 (1 rouge pré-existant `brand-dna-score`, cf. [ALERTE]).
**Déployé en PROD** : ✅ **`https://rami.ai-mpower.com` EN LIGNE** (login testé en réel, dashboard OK).
**Hébergement** : **Coolify** (serveur Ubuntu `serveurai` 192.168.100.8) + **cloudflared tunnel** (PAS Vercel).
**Supabase** : **instance DÉDIÉE** `db-rami.ai-mpower.com` (service Coolify `supabase-rami`, uuid `szn6rjsrqig7n4oerw27egwr`). Migrations 24/24 appliquées, RLS 100%.
**LLM** : via **proxy LiteLLM** `proxy.ai-mpower.com` — texte `deepseek-v4-flash`, vision `moonshot-v1-8k-vision-preview`. Plus de clés directes Anthropic/OpenAI nécessaires.
**pg-boss** : ✅ connecté (schéma `pgboss`, 8 tables) — app `rami` sur réseau `coolify` partagé avec `supabase-db`.

---

## [ENCOURS] — Tâches actives

> **MODE RALPH ACTIF** sur la branche `ralph/rami-completion`. État dans `.ralph/prd.json` (50 US).
> Avancement : **13/50** (US-001→013 ✓). **🎯 Epic A — Performance Loop (MOAT-1) COMPLET** (US-001→012). **Epic B (MOAT-2 Autorité Brand DNA) démarré** : US-013 page publique `/causse` ✓.
> **Session Ralph #3 (2026-05-31 → 06-01)** : US-011, US-010, US-012, US-013 — tous browser-verified ou testés. Commits `527c9e2`, `659a79b`, `c0a721c`, `4816dfb`, `a61747d`.
> **Méthode browser-verify débloquée** : tunnel SSH vers le Postgres conteneur db-rami (`-L 54322:172.24.0.6:5432`) pour les stories Drizzle ; override NEXT_PUBLIC→db-rami seul pour les pages sans Drizzle. ⚠️ instance cloud `.env.local` SUPPRIMÉE → toujours override.
> **Prochaine story prête** : **US-016** (score cohérence culturelle, deps [], **design complet dans `.ralph/progress.md` § CHECKPOINT US-016**). Puis US-014 (rapport MENA, deps US-009 ✓). ⚠️ OPS P0 nécessitant input Amine : **US-017** (mot de passe super-admin), **US-018** (Stripe live). **US-020** (quotas) autonome.
> Reprendre : *« continue »* / *« reprends en Ralph »* → CAS B (lire prd.json + progress.md + AGENTS.md).
> ⚠️ **2 dettes à traiter (hors-scope Ralph)** : (1) test pré-existant rouge `tests/unit/brand-dna-score.test.ts` (`SECTOR_COLOR_RULES` `pharmacie_parapharmacie` : `avoidReasonKey` manquante) ; (2) `AiRecommendations` du dashboard = recommandations hardcodées (statistiques inventées) — à câbler sur l'attribution réelle (US-007 `topFeatures`).

---

## [FAIT] — Session Ralph #3 (2026-05-31 soir → 2026-06-01) — fin Epic A + début Epic B

> **+4 stories** (US-011, US-010, US-012, US-013). Epic A bouclé. Gates TS0/lint0/build OK + 21 tests Jest ajoutés. Browser-verify exécuté pour 3 stories. Zéro dette laissée (DÉFCON 1/3).

- **US-011 — Opt-in RGPD BROWSER-VERIFIED** : section « Intelligence collective » sur `/settings/profile`. Toggle OFF→ON→DB(`collective_optin=t`)→reload(persiste)→OFF. Compte test db-rami créé 100% SQL (CTE `auth.users` bcrypt `crypt()` + `auth.identities` + `tenants` + `users`). 2 gotchas GoTrue : colonnes token NULL→`Scan error` (set `''`), proxy lit `onboarding_completed` depuis `raw_user_meta_data` (pas la colonne users). Commit `527c9e2`.
- **US-010 — Job agrégation collective** : module PUR `metrics/collective.ts` (`aggregateCollective` k-anonymity ≥5 AVANT insert, moyenne des moyennes-tenant) + worker pg-boss cron quotidien `collective-aggregate.ts` (upsert + purge stale) + `JOBS.COLLECTIVE_AGGREGATE`. 10 tests Jest (<5 tenants→0 ligne). Commit `659a79b`.
- **US-012 — Dashboard analytics réel BROWSER-VERIFIED** : remplacé TOUT le factice (`Math.random`, `simulateEngagement/Reach`, DEMO_POSTS, multiplicateurs, fallbacks 1.2M/5.8%) par du réel `post_metrics`. Module pur `analytics/aggregate.ts` + action I/O Drizzle seule + 3 composants nettoyés + retrait bloc `phase2Notice` mensonger. 11 tests Jest. Vérifié navigateur (chiffres = seed exact : impressions 18k, engagement 1.2k, taux 6.9%…). Commits `c0a721c`, `4816dfb`.
- **US-013 — Page publique `/causse` BROWSER-VERIFIED** : 1er route group `(public)`, référentiel 8 couleurs Causse (émotion/physio/notes culturelles) + SEO (metadata+OpenGraph+JSON-LD `DefinedTermSet`+sitemap) + i18n namespace `causse` 18 clés × 8 locales. Accès anonyme + switch FR/EN vérifiés. Commit `a61747d`.
- **Méthode browser-verify DÉBLOQUÉE (réutilisable)** : tunnel SSH `-L 54322:172.24.0.6:5432` vers le **conteneur** Postgres db-rami (⚠️ host:5432 = supavisor pooler « Tenant or user not found »), pwd via `docker exec <db> printenv POSTGRES_PASSWORD`. `npm run dev` avec override `SUPABASE_DB_URL` (tunnel) + `NEXT_PUBLIC_SUPABASE_URL=https://db-rami.ai-mpower.com` + anon. Détail dans `.ralph/progress.md`.

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

- **!! Mot de passe super-admin COMPROMIS** (exposé en clair lors d'une session antérieure — valeur rédigée ici par anti-leak) → **US-017 À FAIRE en priorité** : régénérer via l'API admin Supabase + révoquer les sessions. Nécessite l'input d'Amine (nouveau mot de passe).
- **! Modules FACTICES restants en prod** (affichés mais non câblés) : Vidéo, Présentations, Competitors (hardcodés), 🟡 Transcriptions (Whisper absent), Documents (PDF absent), Leads (Apollo absent). ✅ **Analytics = RÉEL depuis US-012** (n'est plus factice). Détail : `docs/PRD_RAMI_L99.md` §0.2.
- **! Stripe encore en TEST** — Price IDs live + webhook live non configurés (US-018, input Amine requis).
- **! IP publique serveur dynamique** (DHCP) — re-vérifier après reboot ; le tunnel cloudflared (cfargotunnel) est IP-indépendant donc OK.
- **! Branche ralph/rami-completion non mergée** dans main — ~19 commits (US-001→013 + checkpoints).
- **!! Instance cloud `.env.local` SUPPRIMÉE** (découvert session #3) : `rfndjbrwpdltfzvyreyv.supabase.co` ne résout plus (NXDOMAIN API+DB) — `SUPABASE_DB_URL` ET `NEXT_PUBLIC_SUPABASE_URL` du `.env.local` pointent vers un projet mort. **Conséquence** : `npm run dev` brut échoue. **Toujours** override vers db-rami (cf. méthode tunnel en [CTX]). Prod = db-rami (source de vérité unique).
- **! `brand_dna` shape RÉELLE = PLATE** (`brand_dna->>'sector'`, `->>'primaryCulture'`, `colorPrimary`…), alors que l'interface `BrandDNA` du `prompt-compiler` suppose une shape NESTÉE (`identity.sector`, `color_palette[]`). Divergence = dette pré-existante (le compiler lit mal les couleurs en prod). Story dédiée à créer.
- **! Dette test rouge** : `tests/unit/brand-dna-score.test.ts` échoue (pré-existant) — `SECTOR_COLOR_RULES.pharmacie_parapharmacie` : `avoidReasonKey` manquante alors qu'`avoidAlternative` définie. **Sera corrigé dans US-016** (qui touche ces règles) : ajouter `avoidReasonKey: "sante_medical"`.
- **! Dette `AiRecommendations`** (dashboard analytics) : recommandations hardcodées avec statistiques inventées (« +40% le mardi »…) — à câbler sur l'attribution réelle (`metrics/attribution.ts topFeatures`, US-007). Story dédiée.

---

## [BLOQUE] — Items bloqués

| Item | Cause |
|------|-------|
| Production réelle de benchmarks collectifs (US-010 runtime) | ✗ Nécessite ≥5 tenants opt-in distincts par bucket (k-anonymity) — le job est correct & testé, mais ne produira 0 ligne tant que <5 tenants en prod |
| US-017 rotation mot de passe super-admin | ✗ Nécessite le nouveau mot de passe d'Amine |
| US-018 Stripe live | ✗ Price IDs live + webhook à créer côté Stripe dashboard (Amine) |
| Envoi WhatsApp programmatique | ✗ Pas d'Evolution API dans le coffre (Hermès gère côté user) |

---

## [NEXT] — Prochaines actions prioritaires

1. **US-016 — Score cohérence culturelle** (Epic B, deps [], autonome). **Design complet prêt** dans `.ralph/progress.md` § CHECKPOINT US-016 : scorer pur (`cultural-scorer.ts`, mapping HEX→`CAUSSE_COLORS` plus proche voisin) + fix dette `pharmacie_parapharmacie` + badge `CulturalScoreBadge` + intégration `VisualCard`/page Brand DNA + tests Jest + browser-verify (badge sur palette du tenant test, sans génération).
2. **US-014** — Service rapport « Couleur MENA » (deps US-009 ✓) : Crawl4AI + `collective_benchmarks` + synthèse deepseek → PDF + web, gating Pro+. Puis US-015 (cadence trimestrielle + gating).
3. **US-020** — Enforcement quotas génération par plan (OPS, autonome).
4. **OPS input Amine** : US-017 (mot de passe super-admin, urgent), US-018 (Stripe live).
5. Suivre `.ralph/prd.json` (Epic B → OPS → P1 cœur factice → P2 surface).

---

## [CTX] — Contexte session

- Session #3 = fin Epic A (US-010/011/012) + début Epic B (US-013). Browser-verify via tunnel SSH ; migrations inchangées (réutilise tables session #2).
- **Méthode migration db-rami (validée)** : `$sql=[IO.File]::ReadAllText(<migration>)` → base64 → `ssh -i $env:SERVER_SSH_KEY $env:SERVER_SSH_USER@$env:SERVER_HOST "echo '<blob>' | base64 -d | docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres -d postgres -v ON_ERROR_STOP=1"`. Charger le coffre d'abord (`. load-secrets.ps1`).
- **Méthode BROWSER-VERIFY (session #3, validée)** : (a) **tunnel SSH** `ssh -i $key -N -L 54322:172.24.0.6:5432 $u@$h` (run_in_background) — cibler l'IP CONTENEUR `172.24.0.6` (via `docker inspect`), PAS le host:5432 (= supavisor pooler → « Tenant or user not found »). (b) pwd PG : `docker exec supabase-db-szn6... printenv POSTGRES_PASSWORD` (récupéré dans une variable, JAMAIS affiché). (c) `npm run dev` (run_in_background) avec `$env:SUPABASE_DB_URL="postgresql://postgres:<pwd>@127.0.0.1:54322/postgres"` (Drizzle) + `$env:NEXT_PUBLIC_SUPABASE_URL="https://db-rami.ai-mpower.com"` + anon key db-rami. Pour une page SANS Drizzle, seul l'override NEXT_PUBLIC suffit (pas de tunnel). ⚠️ tuer le dev zombie sur :3000 entre runs (`Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force`). (d) Playwright MCP ; toggles `sr-only` → `locator('aria-ref=eXXX').click({force:true})`. (e) **cleanup** : supprimer le seed, stopper dev + tunnel.
- **Test RLS** : transaction `BEGIN; ... SELECT set_config('request.jwt.claims','{"sub":"<userid>"}',true); SET LOCAL ROLE authenticated; <test>; ROLLBACK;`. ⚠️ éviter blocs `DO $$` (échappement PowerShell casse le dollar-quoting) → INSERT directs.
- Accès : SSH `serveurai_mnemo` ✓ · API Coolify (token coffre) ✓ · coffre DPAPI ✓ · Playwright MCP ✓.
- Commits clés : session #1 `19f570f`/`e23c097` ; session #2 US-002→009 ; session #3 `527c9e2`/`659a79b`/`c0a721c`/`4816dfb`/`a61747d`.

---

## [MEMO] — À ne pas oublier inter-sessions

- **Infra complète** : cf. memory projet `deploiement-coolify-infra.md` (Supabase dédié, proxy, cloudflared, gotchas).
- **Schéma DB réel** : `src/lib/db/schema.ts` (pas packages/db) ; migrations `supabase/migrations/` appliquées sur `db-rami` via `docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres` (méthode base64 cf. [CTX]).
- **Tables Performance Loop** : `post_metrics`, `attribution_facts` (vue), `attribution_rankings`, `collective_benchmarks`, `tenants.collective_optin`, `visual_session_images.performance_prior`. Helpers RLS : `get_current_tenant_id()`, `get_current_tenant_sector()` (= `brand_dna->>'sector'`), `current_tenant_is_collective_optin()`.
- **Module metrics** : `src/lib/services/metrics/{types,engagement,twitter,linkedin,meta,pinterest,attribution,collective,index}.ts`. Workers : `src/lib/queue/jobs/{collect-metrics,attribution-refresh,collective-aggregate}.ts` + `token-refresh.ts`, enregistrés dans `src/instrumentation.ts`.
- **Module analytics** : logique PURE `src/lib/services/analytics/aggregate.ts` (`assembleAnalytics`) ; action I/O `src/app/actions/analytics.ts` (Drizzle `post_metrics`).
- **Compte test db-rami CRÉÉ** (session #3) : `test-ralph@rami.local` / `TestRalph2026!` — user id `f73ccdad-5b6b-4f40-a905-ab3737fe2c18`, tenant slug `test-ralph` id `12fe935c-55c2-4864-aced-e18eb6235f9d` (brand_dna sector=tech, primaryCulture=maroc, `onboarding_completed` dans `raw_user_meta_data`). **Réutilisable pour toutes les stories UI.**
- **US-016 (prochaine)** : design complet dans `.ralph/progress.md` § CHECKPOINT US-016 (scorer culturel + mapping HEX→`CAUSSE_COLORS` + fix dette pharmacie + badge).
- **RLS** : `get_current_tenant_id()` lit `public.users.tenant_id`. Tout compte hors-onboarding doit avoir une ligne `tenants` (owner_id) + `users` (tenant_id) sinon 404.
- **LLM** : `OPENAI_BASE_URL=https://proxy.ai-mpower.com/v1`, `OPENAI_API_KEY`=clé rami. deepseek PAS via /v1/messages. moonshot vision = base64 inline only.
- **Crawl4AI** : `https://crawl4ai.ai-mpower.com` `POST /md {url, filter:"fit"}`.
- **Coolify** : app `rami` uuid `ry8ytnene4czxdhsoes0z56y`, service Supabase `szn6rjsrqig7n4oerw27egwr`, projet RAMI `auqfv8irum62nirlv65obbg6`. Auto-deploy sur push main. Domaine sous-service = éditer `coolify-db` table `service_applications` (l'API ne l'expose pas).
- **Ralph** : état dans `.ralph/prd.json` + `.ralph/progress.md` + `AGENTS.md`. Reprendre via *« reprends en Ralph »*.
- **PRD complet** : `docs/PRD_RAMI_L99.md` + `tasks/prd-rami-completion.md`.
