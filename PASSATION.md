<!-- PASSATION NUCLÉAIRE — RAMI by AI-MPower -->
<!-- Protocole de quart industrie nucléaire — lire INTÉGRALEMENT avant toute action -->

# == PASSATION RAMI 2026-06-01T23:59:00Z (session #4) ==

> Légende sténo : `>` en cours · `!` problème · `✗` bloqué · `✓` validé · `→` transition · `!!` critique · `??` à vérifier · `cf.` voir

---

## [ETAT] — État global du projet

**Branche active** : `ralph/rami-completion` (~31 commits, **NON mergée** dans main). `main` = à jour, poussée.
**Repo GitHub** : https://github.com/Afristrat/Rami (origin/main synchronisé).
**Avancement Ralph** : **17/50** stories `passes=true` (US-001→013, US-016, US-021, US-027, US-029). **Epic A (MOAT-1) = 12/12 COMPLET**. **Epic B (MOAT-2) = 2/4** (US-013, US-016 ✓ ; reste US-014/015). **Epic E (Leads) = 2/3** (US-027, US-029 ✓ ; reste US-028). **OPS = US-021 ✓**.
**Build** : ✅ `npm run build` → OK (Next 16.2.6, `output: standalone` conditionnel `BUILD_STANDALONE`).
**TypeScript** : ✅ 0 erreur · **Lint** : ✅ 0 erreur / 0 warning · **npm audit** : ✅ 0 vuln · **Jest** : ✅ **tout vert** (dette `brand-dna-score` CORRIGÉE en US-016 ; +cultural-scorer 24, +apollo-leads 10, +hunter-enrich 15).
**Déployé en PROD** : ✅ **`https://rami.ai-mpower.com` EN LIGNE** (login testé en réel, dashboard OK).
**Hébergement** : **Coolify** (serveur Ubuntu `serveurai` 192.168.100.8) + **cloudflared tunnel** (PAS Vercel).
**Supabase** : **instance DÉDIÉE** `db-rami.ai-mpower.com` (service Coolify `supabase-rami`, uuid `szn6rjsrqig7n4oerw27egwr`). Migrations 24/24 appliquées, RLS 100%.
**LLM** : via **proxy LiteLLM** `proxy.ai-mpower.com` — texte `deepseek-v4-flash`, vision `moonshot-v1-8k-vision-preview`. Plus de clés directes Anthropic/OpenAI nécessaires.
**pg-boss** : ✅ connecté (schéma `pgboss`, 8 tables) — app `rami` sur réseau `coolify` partagé avec `supabase-db`.

---

## [ENCOURS] — Tâches actives

> **MODE RALPH ACTIF** sur la branche `ralph/rami-completion`. État dans `.ralph/prd.json` (50 US).
> Avancement : **17/50** (US-001→013, US-016, US-021, US-027, US-029 ✓). Epic A COMPLET, Epic B 2/4, Epic E 2/3, OPS US-021.
> **Session Ralph #4 (2026-06-01)** : US-016 (score culturel), US-021 (Sentry/PostHog), US-027 (enrichissement leads + BYOK Hunter), US-029 (suppression leads démo) — tous browser-verified. + **migration CRM `leads`** (gap prod corrigé) + **système BYOK enrichissement** + **abstraction `EnrichmentProvider`** + **doc création clés providers**.
> **🔴 GAP OUVERT (demande Amine)** : « Hunter + une 2ᵉ plateforme + tous les autres en BYOK ». Actuellement **seuls Apollo + Hunter** sont implémentés/sélectionnables. Reste à implémenter **Enrich.so (2ᵉ plateforme gratuite validable) + PDL + Dropcontact** (mapper + router + lignes `ai_provider_keys` + tests, recherche API par provider). cf. `docs/ENRICHMENT_PROVIDERS_BYOK.md`.
> **Prochaine story Ralph** : **US-028** (scoring Brand DNA match leads, deps US-027 ✓, débloqué). Puis US-014/015 (rapport MENA, Epic B), puis OPS/P1/P2.
> ⚠️ OPS P0 input Amine : **US-017** (mot de passe super-admin), **US-018/019** (Stripe live). **US-020** (quotas) autonome.
> Reprendre : *« continue »* / *« reprends en Ralph »* → CAS B (lire prd.json + progress.md + AGENTS.md).

---

## [FAIT] — Session Ralph #4 (2026-06-01) — Epic B/E + BYOK enrichissement

> **+4 stories `passes=true`** (US-016, US-021, US-027, US-029) → 17/50. Migration CRM (gap prod). Système BYOK enrichissement + abstraction provider + doc. Clés Apollo & Hunter provisionnées. Gates TS0/lint0/build OK, Jest tout vert. ~12 commits. Zéro dette laissée.

- **US-016 — Score cohérence culturelle BROWSER-VERIFIED** : module PUR `src/lib/services/brand-dna/cultural-scorer.ts` (`nearestCausseColor` plus proche voisin RGB + `scoreCulturalCoherence({sector, colorIds})` barème baseline 70/+10 reco/−20 avoid + `scoreCulturalCoherenceFromHex`). Badge **Server Component** `cultural-score-badge.tsx` intégré page Brand DNA (section Palette). i18n `culturalScore` × 8 locales. **FIX dette** `pharmacie_parapharmacie.avoidReasonKey` (brand-dna-score repasse). **+ dette i18n corrigée** : 5 raisons `sectorColorRules` traduites en/es/de/pt/tr/zh (étaient en FR). 24 tests Jest. Browser-verify FR+EN (score 70, motif+alternative). Commits `8cadab2`, `1fa8d51`.
- **US-021 — Événements Sentry/PostHog** : les 5 events PostHog étaient déjà câblés (tenant_signup/brand_dna_completed/visual_generated/post_published/subscription_upgraded) ; 0 console.log prod. Gap comblé = **génération** (`visual.actions.ts` : log error sur `persist_session_failed` + `generation_failed` → Sentry). Commit `93181f1`.
- **US-027 — Enrichissement leads BROWSER-VERIFIED (Hunter + BYOK chiffré)** : abstraction `src/lib/services/leads/` (`types.ts`, `apollo.ts` INCHANGÉ, `hunter.ts` Email Finder, `index.ts` router `enrichLead` + `resolveEnrichmentKey` BYOK→env). `enrichLeadAction` via router. Migration `20260315000007_enrichment_byok.sql` (cat `enrichment` + rows apollo/hunter). **Happy-path validé navigateur** : lead « Box / Aaron Levie » → Hunter renvoie `alevie@box.com` → `apollo_data` rempli, via clé Hunter **chiffrée AES-256 en DB** (résolution sans env). ⚠️ **Apollo API = plan PAYANT** (free → 403 `API_INACCESSIBLE` sur tous endpoints). Commits `b17c1df`, `44b36ae`, `1422dd9`.
- **US-029 — Suppression leads démo BROWSER-VERIFIED** : `DEMO_LEADS` (≈215 lignes) supprimé de la page leads → lecture exclusive table réelle + état vide honnête (« Aucun lead »). Vérifié navigateur (4 colonnes à 0, zéro démo). Commit `178937c`.
- **Migration CRM `leads`** (`20260315000006_crm_leads.sql`, **gap prod : module CRM jamais migré**) : enums `lead_stage`/`lead_activity_type` + tables `leads`+`lead_activities` + 5 index + RLS (testée cross-tenant : isolation + WITH CHECK). → module Leads fonctionnel en prod. Commit `655407b`.
- **Provisioning clés** : `APOLLO_API_KEY` (coffre DPAPI + Coolify + vault Hermes `vault.js`) ; `HUNTER_API_KEY` (coffre + chiffrée dans `ai_provider_keys` db-rami). `LEADS_ENRICHMENT_PROVIDER=hunter` posé Coolify (dormant jusqu'au déploiement branche).
- **Doc** `docs/ENRICHMENT_PROVIDERS_BYOK.md` : création de clés Apollo/Hunter/PDL/Dropcontact/Enrich.so (vérifié docs officielles).

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
- **! Modules FACTICES restants en prod** (affichés mais non câblés) : Vidéo, Présentations, Competitors (hardcodés), 🟡 Transcriptions (Whisper absent), Documents (PDF absent). ✅ **Analytics RÉEL** (US-012), ✅ **Leads RÉELS** (US-029, démo supprimée), ✅ **Enrichissement câblé** (US-027, Hunter/Apollo via BYOK). Détail : `docs/PRD_RAMI_L99.md` §0.2.
- **!! Apollo API = plan PAYANT uniquement** : la clé Apollo gratuite (120 crédits) renvoie **403 `API_INACCESSIBLE`** sur TOUS les endpoints REST (people/match, mixed_people/search, organizations/enrich…). L'enrichissement live nécessite un plan Apollo payant. → **Hunter.io (gratuit) configuré comme provider par défaut** (`LEADS_ENRICHMENT_PROVIDER=hunter`).
- **🔴 GAP providers enrichissement (demande Amine)** : seuls Apollo + Hunter implémentés. Reste **Enrich.so (2ᵉ plateforme) + PDL + Dropcontact** en BYOK (mapper+router+rows+tests par provider). cf. `docs/ENRICHMENT_PROVIDERS_BYOK.md`.
- **! Stripe encore en TEST** — Price IDs live + webhook live non configurés (US-018, input Amine requis).
- **! Cosmétique mineur** : libellé section panneau lead « Enrichissement Apollo » + descriptions mentionnent encore Apollo (multi-provider) — le bouton/log ont été neutralisés ; le titre/descriptions restent à neutraliser (`apolloEnrichment`/`apollo*Desc`).
- **! IP publique serveur dynamique** (DHCP) — re-vérifier après reboot ; le tunnel cloudflared (cfargotunnel) est IP-indépendant donc OK.
- **! Branche ralph/rami-completion non mergée** dans main — ~31 commits (US-001→013, US-016/021/027/029 + migrations CRM/BYOK + checkpoints). ⚠️ Les **migrations DB sont déjà live** sur db-rami (leads, enrichment) mais le **CODE n'est pas déployé** (prod = ancien main) → l'env Coolify `LEADS_ENRICHMENT_PROVIDER=hunter` est dormant jusqu'au merge+deploy.
- **!! Instance cloud `.env.local` SUPPRIMÉE** (découvert session #3) : `rfndjbrwpdltfzvyreyv.supabase.co` ne résout plus (NXDOMAIN API+DB) — `SUPABASE_DB_URL` ET `NEXT_PUBLIC_SUPABASE_URL` du `.env.local` pointent vers un projet mort. **Conséquence** : `npm run dev` brut échoue. **Toujours** override vers db-rami (cf. méthode tunnel en [CTX]). Prod = db-rami (source de vérité unique).
- **! `brand_dna` shape RÉELLE = PLATE** (`brand_dna->>'sector'`, `->>'primaryCulture'`, `colorPrimary`…), alors que l'interface `BrandDNA` du `prompt-compiler` suppose une shape NESTÉE (`identity.sector`, `color_palette[]`). Divergence = dette pré-existante (le compiler lit mal les couleurs en prod). Story dédiée à créer.
- **✓ Dette test rouge `brand-dna-score` RÉSOLUE** (US-016) : `SECTOR_COLOR_RULES.pharmacie_parapharmacie.avoidReasonKey = "sante_medical"` ajoutée → suite Jest tout vert.
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

1. **🔴 Compléter providers enrichissement (demande Amine, contexte frais conseillé)** : Enrich.so (2ᵉ plateforme gratuite validable) + PDL + Dropcontact en BYOK. Par provider : recherche API exacte (cf. `docs/ENRICHMENT_PROVIDERS_BYOK.md`) + `enrichVia{X}` + mapper pur + case router `enrichLead` + `EnrichmentProviderId` + row `ai_provider_keys` + `.env.example` + tests Jest. Modèle : `src/lib/services/leads/hunter.ts`.
2. **US-028** — Scoring Brand DNA match leads (Epic E, deps US-027 ✓ débloqué) : score deepseek `leads.score`/`brand_dna_match`, tri UI, browser-verify.
3. **US-014/015** — Rapport « Couleur MENA » (Epic B, deps US-009 ✓) : Crawl4AI + `collective_benchmarks` + deepseek → PDF + web, gating Pro+ + cadence trimestrielle.
4. **US-020** — Enforcement quotas génération par plan (OPS, autonome ; `checkGenerationQuota` existe déjà dans `visual.actions.ts`).
5. **OPS input Amine** : US-017 (mot de passe super-admin, urgent), US-018/019 (Stripe live).
6. **Cosmétique** : neutraliser le titre/descriptions « Enrichissement Apollo » (multi-provider).
7. Suivre `.ralph/prd.json` (Epic B → OPS → P1 cœur factice → P2 surface).

---

## [CTX] — Contexte session

- Session #4 = US-016 (Epic B), US-021 (OPS), US-027+US-029 (Epic E Leads) + migration CRM + BYOK enrichissement + provisioning clés Apollo/Hunter. Tout on-LAN (SSH OK après reconnexion réseau). 2 migrations appliquées db-rami (CRM + enrichment).
- Session #3 = fin Epic A (US-010/011/012) + début Epic B (US-013). Browser-verify via tunnel SSH ; migrations inchangées (réutilise tables session #2).
- **BYOK chiffrement hors-app (session #4, validé)** : récupérer `OAUTH_TOKEN_ENCRYPTION_KEY` via `docker exec <rami> printenv` (jamais affiché) → node `crypto` aes-256-gcm (`key=padEnd(64,'0').slice(0,64)` hex, `iv:tag:ct`) → UPDATE `ai_provider_keys.api_key_encrypted`. Vérif round-trip par hash sha256 (la valeur n'est jamais imprimée).
- **Méthode migration db-rami (validée)** : `$sql=[IO.File]::ReadAllText(<migration>)` → base64 → `ssh -i $env:SERVER_SSH_KEY $env:SERVER_SSH_USER@$env:SERVER_HOST "echo '<blob>' | base64 -d | docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres -d postgres -v ON_ERROR_STOP=1"`. Charger le coffre d'abord (`. load-secrets.ps1`).
- **Méthode BROWSER-VERIFY (session #3, validée)** : (a) **tunnel SSH** `ssh -i $key -N -L 54322:172.24.0.6:5432 $u@$h` (run_in_background) — cibler l'IP CONTENEUR `172.24.0.6` (via `docker inspect`), PAS le host:5432 (= supavisor pooler → « Tenant or user not found »). (b) pwd PG : `docker exec supabase-db-szn6... printenv POSTGRES_PASSWORD` (récupéré dans une variable, JAMAIS affiché). (c) `npm run dev` (run_in_background) avec `$env:SUPABASE_DB_URL="postgresql://postgres:<pwd>@127.0.0.1:54322/postgres"` (Drizzle) + `$env:NEXT_PUBLIC_SUPABASE_URL="https://db-rami.ai-mpower.com"` + anon key db-rami. Pour une page SANS Drizzle, seul l'override NEXT_PUBLIC suffit (pas de tunnel). ⚠️ tuer le dev zombie sur :3000 entre runs (`Get-NetTCPConnection -LocalPort 3000 | Stop-Process -Force`). (d) Playwright MCP ; toggles `sr-only` → `locator('aria-ref=eXXX').click({force:true})`. (e) **cleanup** : supprimer le seed, stopper dev + tunnel.
- **Test RLS** : transaction `BEGIN; ... SELECT set_config('request.jwt.claims','{"sub":"<userid>"}',true); SET LOCAL ROLE authenticated; <test>; ROLLBACK;`. ⚠️ éviter blocs `DO $$` (échappement PowerShell casse le dollar-quoting) → INSERT directs.
- Accès : SSH `serveurai_mnemo` ✓ · API Coolify (token coffre) ✓ · coffre DPAPI ✓ · Playwright MCP ✓.
- Commits clés : session #1 `19f570f`/`e23c097` ; session #2 US-002→009 ; session #3 `527c9e2`/`659a79b`/`c0a721c`/`4816dfb`/`a61747d` ; **session #4** `8cadab2`(US-016 impl)/`93181f1`(US-021)/`b17c1df`(US-027 impl)/`655407b`(CRM)/`1fa8d51`(US-016 verified)/`44b36ae`(US-027 verified)/`1422dd9`(prod Hunter)/`178937c`(US-029).

---

## [MEMO] — À ne pas oublier inter-sessions

- **Infra complète** : cf. memory projet `deploiement-coolify-infra.md` (Supabase dédié, proxy, cloudflared, gotchas).
- **Schéma DB réel** : `src/lib/db/schema.ts` (pas packages/db) ; migrations `supabase/migrations/` appliquées sur `db-rami` via `docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres` (méthode base64 cf. [CTX]).
- **Tables Performance Loop** : `post_metrics`, `attribution_facts` (vue), `attribution_rankings`, `collective_benchmarks`, `tenants.collective_optin`, `visual_session_images.performance_prior`. Helpers RLS : `get_current_tenant_id()`, `get_current_tenant_sector()` (= `brand_dna->>'sector'`), `current_tenant_is_collective_optin()`.
- **Module metrics** : `src/lib/services/metrics/{types,engagement,twitter,linkedin,meta,pinterest,attribution,collective,index}.ts`. Workers : `src/lib/queue/jobs/{collect-metrics,attribution-refresh,collective-aggregate}.ts` + `token-refresh.ts`, enregistrés dans `src/instrumentation.ts`.
- **Module analytics** : logique PURE `src/lib/services/analytics/aggregate.ts` (`assembleAnalytics`) ; action I/O `src/app/actions/analytics.ts` (Drizzle `post_metrics`).
- **Compte test db-rami** : `test-ralph@rami.local` / `TestRalph2026!` — user id `f73ccdad-5b6b-4f40-a905-ab3737fe2c18`, tenant id `12fe935c-55c2-4864-aced-e18eb6235f9d`. ⚠️ **fixtures modifiées session #4** : `brand_dna.sector=finance_islamique` (+ palette vert/rouge/bleu, pour US-016) et `plan=agency` (pour atteindre la page Leads gated AGENCY+). **Réutilisable pour toutes les stories UI.**
- **Enrichissement leads (session #4)** : module `src/lib/services/leads/{types,apollo,hunter,index}.ts`. Router `enrichLead` + `resolveEnrichmentKey` (BYOK `ai_provider_keys` cat=`enrichment` déchiffré `decryptToken` → fallback env). Provider via `LEADS_ENRICHMENT_PROVIDER` (apollo|hunter, défaut apollo). **Clés** : `HUNTER_API_KEY` (coffre + chiffrée en DB), `APOLLO_API_KEY` (coffre/Coolify/Hermes). Doc création clés : `docs/ENRICHMENT_PROVIDERS_BYOK.md`.
- **BYOK** : table `ai_provider_keys` (clé globale plateforme par provider, chiffrée AES-256 via `encryptToken`/`decryptToken` de `oauth/state.ts`, clé = `OAUTH_TOKEN_ENCRYPTION_KEY` paddée 64 hex, format `iv:tag:ct`). Catégories : text/image/video/audio/infographic/**enrichment**. Pour chiffrer hors-app : node `crypto` aes-256-gcm avec la même clé (cf. méthode session #4).
- **Vault Hermes** (credential-vault) : `vault.js` conteneur `hermes-oagpd60vuec2zhokge4tf93v` `/opt/data/home/.hermes-vault/`, passphrase coffre `HERMES_VAULT_PASSPHRASE`, `HOME=/opt/data/home`. Set anti-leak : passphrase+valeur en base64 décodées côté conteneur, vérif par hash (jamais `get` brut). cf. memory `reference_vault_hermes_credentialstore.md`.
- **Tables CRM** (migrées session #4) : `leads`, `lead_activities` (enums `lead_stage`/`lead_activity_type`, RLS `get_current_tenant_id()`). Migration `20260315000006_crm_leads.sql`.
- **US-028 (prochaine Ralph)** : scoring Brand DNA match leads (deps US-027 ✓).
- **RLS** : `get_current_tenant_id()` lit `public.users.tenant_id`. Tout compte hors-onboarding doit avoir une ligne `tenants` (owner_id) + `users` (tenant_id) sinon 404.
- **LLM** : `OPENAI_BASE_URL=https://proxy.ai-mpower.com/v1`, `OPENAI_API_KEY`=clé rami. deepseek PAS via /v1/messages. moonshot vision = base64 inline only.
- **Crawl4AI** : `https://crawl4ai.ai-mpower.com` `POST /md {url, filter:"fit"}`.
- **Coolify** : app `rami` uuid `ry8ytnene4czxdhsoes0z56y`, service Supabase `szn6rjsrqig7n4oerw27egwr`, projet RAMI `auqfv8irum62nirlv65obbg6`. Auto-deploy sur push main. Domaine sous-service = éditer `coolify-db` table `service_applications` (l'API ne l'expose pas).
- **Ralph** : état dans `.ralph/prd.json` + `.ralph/progress.md` + `AGENTS.md`. Reprendre via *« reprends en Ralph »*.
- **PRD complet** : `docs/PRD_RAMI_L99.md` + `tasks/prd-rami-completion.md`.
