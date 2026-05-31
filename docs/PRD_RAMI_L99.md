# PRD RAMI — Complétion & Déploiement (Niveau L99)

```
Produit   : RAMI by AI-MPower — Agency OS SaaS B2B multitenant
Objet     : Finir + déployer la plateforme : éliminer tout le factice, activer les moats
Base      : Audit codebase (réel vs mock, 2026-05-31) + Moat Hunt scoré (/15)
Méthode   : Priorité MOATS > complétion factice > surface. Chaque story = AC + spec + DoD.
Statut    : Noyau réel ~70%. Modules vitrine factices. 2 moats "priorité absolue" à 70% prêts.
Auteur    : Amine — AI-MPower
Date       : 2026-05-31
```

> **Règle L99** : aucune story n'est "done" sans (1) typecheck 0 / lint 0 / build OK,
> (2) RLS sur toute nouvelle table, (3) validation jusqu'au navigateur, (4) test du parcours.
> Aligné CLAUDE.md Level 6 (RÈGLES FONDAMENTALES N°1/2/3).

---

## 0. ÉTAT DES LIEUX (vérifié)

### 0.1 RÉEL & production-ready (à NE PAS refaire — capitaliser)
Auth multitenant + RLS · Brand DNA (matrice Causse, logo Vision IA) · Visual Engine (Prompt Compiler + 5 providers fallback + scoring Vision + MinIO/R2) · Workflow 7 étapes · Publishing (X, LinkedIn, Instagram, Facebook, Pinterest) · OAuth chiffré AES-256 + refresh · Scheduling calendrier · Admin BYOK + prompt-config · Stripe webhooks + 6 plans + feature flags server-side · **pg-boss connecté** (schéma `pgboss`, 8 tables) · **LLM via proxy LiteLLM** (deepseek-v4-flash texte, moonshot vision) · **Benchmark sectoriel Crawl4AI + deepseek** (testé live).

### 0.2 FACTICE / INCOMPLET (le périmètre de ce PRD)
| # | Module | État réel | Manque |
|---|--------|-----------|--------|
| F1 | Vidéo | UI stepper mock | Tout le backend (script, voix, storyboard, render) |
| F2 | Présentations | Wizard + MOCK_SLIDES/THEMES | Génération plan + slides + export PDF/PPTX |
| F3 | Competitors | Données hardcodées | Ingestion réelle (Crawl4AI) + analyse |
| F4 | Transcriptions | Upload + MinIO OK | Traitement Whisper + verbatims + diarisation |
| F5 | Documents | CRUD + table | Génération offres/rapports PDF |
| F6 | Leads | DEMO_LEADS + CRUD | Enrichissement Apollo + scoring Brand DNA |
| F7 | Analytics | Local (count posts) | **Sync engagement réel** (impressions/likes/clics) |
| F8 | Approvals | Board stub | Workflow d'approbation client réel |
| F9 | Settings (notifications/team/danger) | Routes présentes | Logique notifications, invitations, suppression sécurisée |
| F10 | Email (Resend) | Refs | Envois transactionnels réels |
| F11 | Publishing étendu | Enum | Services Mastodon / YouTube / TikTok |
| F12 | Performance Loop | Inexistant | **Boucle publish→engagement→scoring→génération** (= MOAT #1) |

### 0.3 Déploiement — reste à finaliser (cf. PASSATION)
Rotation mot de passe super-admin exposé · Stripe live (Price IDs + webhook) · Sentry/PostHog events réels · Cron Stripe reconcile (tâche Coolify) · Domaine Kong db-rami (FAIT) · pg-boss réseau (FAIT) · Smoke tests prod.

---

## 1. MOATS — CIBLES STRATÉGIQUES (priorité absolue)

Les 2 douves défendables (Moat Hunt 13/15). **Toute la roadmap converge vers elles.**

- **MOAT-1 — Performance Loop cross-tenant (effet réseau de données, type Waze).**
  Chaque post publié + son engagement réel alimente un moteur "ce qui marche" par
  secteur×culture×plateforme. Chaque nouveau tenant améliore les recommandations de tous.
  Condition : *l'usage doit alimenter directement la donnée* (sinon simple échelle).
- **MOAT-2 — Autorité Brand DNA couleur×culture (type Pantone MENA).**
  Productiser la matrice Causse×culture locale en standard public + rapport "Couleur de l'année MENA",
  freemium→premium. Non réplicable par Canva/Buffer (profondeur culturelle).

Moats secondaires (FORTE, 10-12) : scoring Brand DNA compounding · benchmark web×perf réelle ·
BYOK cost moat (déjà là) · cycle agence complet · transcription→brief.

---

## 2. PHASAGE (3 vagues)

| Vague | Thème | Pourquoi en premier |
|-------|-------|---------------------|
| **V1 — ACTIVER LES MOATS** (P0) | Fermer la boucle de performance + productiser l'autorité Brand DNA | Crée l'avantage défendable. S'appuie sur le réel existant. |
| **V2 — COMPLÉTER LE CŒUR FACTICE** (P1) | Transcription, Documents, Leads, Competitors, Analytics réel, Approvals | Tient les promesses de plans payants (Agency/Pro), réduit le "démo-ware". |
| **V3 — SURFACE & EXTENSION** (P2) | Vidéo, Présentations, Publishing étendu, Settings, Email | Différenciation secondaire, gros effort, faible moat. |

---

## 3. VAGUE 1 — ACTIVER LES MOATS (P0)

### EPIC A — Performance Loop cross-tenant (MOAT-1)

**Objectif** : fermer la boucle `publication → engagement réel → attribution → scoring → meilleure génération`, puis exposer une intelligence collective anonymisée.

#### A.1 — Ingestion de l'engagement réel par plateforme
- **Story** : En tant qu'agence, je veux que RAMI récupère automatiquement impressions/likes/commentaires/partages/clics de chaque post publié, pour mesurer la performance réelle.
- **AC** :
  - Job pg-boss `metrics.collect` planifié (T+1h, T+24h, T+7j après publication).
  - Pour chaque `social_posts.platform_post_id`, appel API plateforme (X /2/tweets metrics, LinkedIn socialActions, Meta insights, Pinterest analytics) via `getValidToken()`.
  - Stockage normalisé dans nouvelle table `post_metrics` (voir schéma).
  - Gestion quotas + retry + fallback (token révoqué → marquer `metrics_unavailable`).
- **Spec technique** :
  - DB : `packages/db/schema/post-metrics.ts` →
    `post_metrics(id, tenant_id, post_id FK, platform, collected_at, impressions, likes, comments, shares, clicks, saves, engagement_rate, raw jsonb)`. RLS tenant.
  - Service : `src/lib/services/metrics/[twitter|linkedin|meta|pinterest].ts` (interface `MetricsProvider`).
  - Worker : `src/lib/queue/jobs/collect-metrics.ts` (enregistré dans `instrumentation.ts`).
  - Migration RLS + index `(tenant_id, platform, collected_at)`.
- **Effort** : L · **DoD** : un post publié réel voit ses metrics apparaître en DB sous 1h, RLS testée, dashboard analytics lit `post_metrics` (remplace le count local).

#### A.2 — Attribution feature→performance
- **Story** : Je veux savoir quels choix (couleur dominante HEX, forme Gestalt, style visuel, objectif cognitif, hook, format, créneau) corrèlent avec la performance.
- **AC** :
  - Chaque post lie ses "features" : `generated_assets.dominant_color_hex`, `visual_direction`, `brand_dna_score`, `social_posts` (objectif cognitif, hook type, format, scheduled hour).
  - Vue matérialisée `attribution_facts` jointant `post_metrics` × features.
  - Recalcul incrémental via job `attribution.refresh`.
- **Spec** : SQL view/materialized view dans migration ; `src/lib/services/metrics/attribution.ts`.
- **Effort** : M · **DoD** : requête "top 5 couleurs par engagement, secteur fintech" renvoie un résultat réel.

#### A.3 — Boucle de re-scoring & recommandations génération
- **Story** : Je veux que le Prompt Compiler / scoring Brand DNA s'améliore avec les données de performance (pas seulement la cohérence visuelle).
- **AC** :
  - Le `vision-scorer` / `prompt-compiler` intègre un signal "performance prior" : couleurs/styles historiquement performants (par secteur×culture) pondèrent la génération.
  - Nouveau champ `generated_assets.performance_prior` + ajustement `guidance`/sélection.
  - Feature flag : actif seulement si ≥ N posts mesurés pour le tenant/secteur (sinon fallback Causse pur).
- **Spec** : `src/lib/services/brand-dna/prompt-compiler.ts` (injecter le prior), `src/lib/services/metrics/recommendations.ts`.
- **Effort** : M · **DoD** : à volume suffisant, le compiler privilégie les couleurs gagnantes ; A/B mesurable.

#### A.4 — Intelligence collective anonymisée (l'effet réseau Waze)
- **Story** : En tant que tenant, je veux des benchmarks "ce qui marche maintenant dans mon secteur×culture" alimentés par l'ensemble des tenants (anonymisé).
- **AC** :
  - Agrégat cross-tenant **anonymisé** (k-anonymity ≥ 5 tenants, aucun id/contenu exposé) : table `collective_benchmarks(sector, culture, platform, metric, value, sample_size, updated_at)`.
  - Job `collective.aggregate` (quotidien) — service role uniquement, RLS lecture filtrée (un tenant voit l'agrégat de son secteur, jamais les données brutes d'autrui).
  - Exposé dans le benchmark sectoriel (fusion avec Crawl4AI + deepseek) et dans le scoring.
  - **Consentement** : opt-in tenant (RGPD/CNDP) "contribuer aux benchmarks anonymisés en échange de l'accès collectif".
- **Spec** : migration `collective_benchmarks` + RLS spéciale ; `src/lib/services/metrics/collective.ts` ; UI consentement dans settings.
- **Effort** : L · **DoD** : avec ≥5 tenants d'un secteur, l'agrégat s'affiche ; preuve qu'aucune donnée individuelle ne fuit (test cross-tenant).

#### A.5 — Dashboard Performance Loop
- **Story** : Je veux un tableau de bord montrant performance réelle, attribution, et recommandations.
- **AC** : KPIs réels (depuis `post_metrics`), top features gagnantes, recommandations actionnables, comparaison vs benchmark collectif.
- **Spec** : refonte `src/app/(dashboard)/dashboard/analytics/page.tsx` (lecture réelle), composants charts Recharts.
- **Effort** : M · **DoD** : dashboard affiche des metrics réelles d'un post publié + recommandations.

> **Gate moat-1** : EPIC A "done" = MOAT-1 activé. C'est la priorité n°1 absolue.

---

### EPIC B — Autorité Brand DNA couleur×culture (MOAT-2)

#### B.1 — Standard public "Causse × Culture" (langage)
- **Story** : Je veux exposer la matrice Causse×culture comme une référence publique citable (le "Pantone MENA").
- **AC** :
  - Page publique SEO `/causse` (ou `/standard`) : couleurs nommées + émotion + effet physio + notes culturelles (Maroc/MENA/Afrique), versionnée.
  - Données issues de `causse-matrix.ts`, enrichies par l'attribution réelle (A.2) quand dispo.
  - Schema.org + OpenGraph (partageable), i18n FR/EN/AR.
- **Spec** : `src/app/(public)/causse/page.tsx`, `src/lib/utils/causse-matrix.ts` (export public), sitemap.
- **Effort** : M · **DoD** : page publique indexable, citable, avec sources.

#### B.2 — "Couleur de l'année / du trimestre MENA" (trend forecasting)
- **Story** : Je veux un rapport périodique liant culture, secteur et couleur (le mécanisme Color-of-the-Year de Pantone).
- **AC** :
  - Génération semi-automatique : Crawl4AI (tendances) + données collectives (A.4) + deepseek synthèse → rapport "Tendances couleur MENA T{n}".
  - Export PDF brandé + version web freemium (extrait) / premium (complet, plan Pro+).
  - Cadence trimestrielle (cron Coolify).
- **Spec** : `src/lib/services/brand-dna/trend-report.ts`, route `/api/brand-dna/trend-report`, gating plan.
- **Effort** : M · **DoD** : un rapport est généré, exportable, gated par plan.

#### B.3 — Score de cohérence culturelle (différenciateur produit)
- **Story** : Je veux que chaque visuel/post affiche un score "alignement culturel" (au-delà du Brand DNA).
- **AC** : extension du scoring : pénalités/bonus culturels (ex. vert finance islamique, éviter rouge santé) explicités dans le feedback.
- **Spec** : `vision-scorer.ts` + `causse-matrix.ts` (règles culturelles), affichage badge.
- **Effort** : S · **DoD** : un visuel hors-norme culturelle est signalé avec justification.

---

## 4. VAGUE 2 — COMPLÉTER LE CŒUR FACTICE (P1)

### EPIC C — Transcriptions (F4) → branche aussi le moat "transcription→brief"
- **C.1 Whisper processing** : job pg-boss `transcription.process` → OpenAI Whisper (ou self-hosted) sur le fichier MinIO → `transcript_text`. AC : upload → transcription dispo + statut. Spec : `src/lib/queue/jobs/transcribe.ts`, `src/lib/services/transcription/whisper.ts`. Effort M.
- **C.2 Verbatims + diarisation + résumé** : extraction verbatims clés + speakers + résumé via deepseek. AC : verbatims affichés, exportables. Effort M.
- **C.3 Transcription → brief contenu** *(moat)* : bouton "Générer un brief de contenu depuis cette réunion" → pré-remplit le Workflow + propose un raffinage Brand DNA (ton/tabous détectés). AC : un brief pré-rempli est créé depuis une transcription. Effort M.
- **DoD EPIC C** : MP3 uploadé → transcription + verbatims + brief généré, plan Pro+ gated.

### EPIC D — Documents (F5) : génération réelle
- **D.1 Offres commerciales** : LLM (deepseek) → structure → rendu PDF brandé (style Gamma). Spec : `src/lib/services/documents/offer.ts`, lib PDF (react-pdf / puppeteer). AC : une offre PDF brandée est générée. Effort L.
- **D.2 Rapports client** : agrège `post_metrics` (V1) → PDF hebdo/à la demande. AC : rapport PDF avec metrics réelles. Effort M.
- **DoD** : 2 types de PDF générés, stockés MinIO, gated Agency.

### EPIC E — Leads (F6) + Apollo
- **E.1 Enrichissement Apollo** : action `enrichLeadAction` → Apollo REST (`/people/match`) → remplit `apollo_data`. AC : un lead s'enrichit (titre, entreprise, email). Spec : `src/lib/services/leads/apollo.ts`. Effort M.
- **E.2 Scoring Brand DNA match** : score lead↔ICP via deepseek + champs `score`, `brand_dna_match`. AC : score calculé et trié. Effort M.
- **E.3 Remplacer DEMO_LEADS** par données réelles + empty state honnête. Effort S.
- **DoD** : pipeline lead réel (création→enrichissement→scoring), gated Agency.

### EPIC F — Competitors (F3) via Crawl4AI
- **F.1** : remplacer les données hardcodées par ingestion Crawl4AI (profils publics / pages) + analyse deepseek (fréquence, formats, tonalité, gaps). AC : ajouter un concurrent (URL/handle) → analyse réelle. Spec : `src/lib/services/competitors/crawl.ts`, table `competitors`. Effort L.
- **DoD** : un concurrent réel est analysé, plus aucune donnée mock.

### EPIC G — Analytics réel (F7) — *fusionne avec A.1/A.5*
- Déjà couvert par EPIC A (ingestion `post_metrics`). G = brancher l'UI analytics + Ayrshare optionnel en fallback. Effort S (si A fait).

### EPIC H — Approvals (F8)
- **H.1 Workflow d'approbation client** : statut `review` → lien d'approbation (token signé) → client externe approuve/commente → statut `approved`/`changes_requested`. AC : un client externe approuve sans compte. Spec : table `approvals`, route `/approve/[token]`, RLS. Effort M.
- **DoD** : cycle d'approbation complet testé, gated Agency+ (client portal).

---

## 5. VAGUE 3 — SURFACE & EXTENSION (P2)

### EPIC I — Vidéo (F1)
- Pipeline réel : brief → script (deepseek) → voix (ElevenLabs/TTS) → storyboard (image gen existant) → assemblage (Veo/Runway/Kling déjà déclarés). Stories I.1–I.5 par étape, jobs pg-boss async. Effort XL. **Note** : fort coût, moat faible — ne pas prioriser avant V1/V2.

### EPIC J — Présentations (F2)
- Plan (deepseek) → slides (templates) → export PDF/PPTX. Remplacer MOCK_SLIDES. Effort L.

### EPIC K — Publishing étendu (F11)
- Services Mastodon (`masto`), YouTube (`googleapis`), TikTok (Content Posting API). Stories par réseau, réutilise l'abstraction `PublishingProvider`. Effort M chacun.

### EPIC L — Settings & Email (F9/F10)
- L.1 Resend transactionnel (invitations équipe, alertes, rapports). L.2 Notifications préférences réelles. L.3 Team invitations (réutilise tenant_members). L.4 Danger zone (suppression tenant + export RGPD). Effort M global.

---

## 6. DÉPLOIEMENT & DURCISSEMENT (transverse, P0 ops)

| # | Tâche | Détail | Effort |
|---|-------|--------|--------|
| OPS-1 | **Rotation mot de passe** super-admin exposé | Régénérer + invalider sessions | XS |
| OPS-2 | Stripe **live** | 4 Price IDs live + webhook `https://rami.ai-mpower.com/api/webhooks/stripe` + secret | S |
| OPS-3 | Cron reconcile | Tâche planifiée Coolify `scripts/cron-stripe-reconcile.sh` (02h UTC) | XS |
| OPS-4 | Sentry/PostHog **events réels** | Instrumenter actions clés (signup, generate, publish, upgrade) | M |
| OPS-5 | Tests E2E Playwright | Parcours critiques (auth, workflow, publishing, billing, brand-dna) verts en CI | L |
| OPS-6 | Quotas génération par plan | Enforcement `monthly_generation_count` + reset + modal upgrade | M |
| OPS-7 | Audit trail | `audit_logs` sur actions sensibles (publish, oauth, billing, admin) | M |
| OPS-8 | Smoke tests prod + monitoring | `scripts/smoke-test.ts` post-deploy + alertes Sentry | S |

---

## 7. BACKLOG PRIORISÉ (séquence d'exécution)

```
P0 (activer moats + ops critiques) :
  1. OPS-1 (rotation MDP)                    [XS]
  2. EPIC A — Performance Loop (A.1→A.5)     [moat #1]  ← cœur stratégique
  3. EPIC B — Autorité Brand DNA (B.1→B.3)   [moat #2]
  4. OPS-2/3 (Stripe live + cron)            [S]
  5. OPS-6 (quotas), OPS-4 (events)          [M]

P1 (compléter le cœur) :
  6. EPIC C — Transcriptions + brief
  7. EPIC G — Analytics UI (post-A)
  8. EPIC E — Leads + Apollo
  9. EPIC D — Documents PDF (rapports = post-A)
 10. EPIC F — Competitors (Crawl4AI)
 11. EPIC H — Approvals
 12. OPS-5 (E2E), OPS-7 (audit), OPS-8 (smoke)

P2 (surface) :
 13. EPIC K — Publishing étendu (Mastodon/YT/TikTok)
 14. EPIC L — Settings/Email
 15. EPIC J — Présentations
 16. EPIC I — Vidéo (dernier : coût élevé, moat faible)
```

---

## 8. MÉTRIQUES DE SUCCÈS

- **Moat-1 actif** : ≥1 secteur avec benchmark collectif (≥5 tenants) + recommandations data-driven mesurables (uplift engagement A/B).
- **Moat-2 actif** : 1 rapport "Couleur MENA" publié + page `/causse` indexée + N citations/partages.
- **Zéro factice** : aucune donnée mock/DEMO/MOCK servie en prod (grep `DEMO_|MOCK_|COMPETITORS =` = 0 en usage runtime).
- **Prod** : 0 erreur lint/TS, build OK, E2E verts, Stripe live opérationnel, 0 vuln critique.
- **Plans tenus** : chaque feature gated correspond à une capacité RÉELLE (plus de "démo-ware").

---

## 9. DÉPENDANCES & RISQUES

| Risque | Mitigation |
|--------|------------|
| APIs metrics plateformes (quotas/permissions OAuth) | Scopes étendus à la connexion + backoff + cache `post_metrics` |
| Anonymisation collective (RGPD/CNDP) | k-anonymity ≥5, opt-in explicite, jamais de contenu/id exposé, registre Art.30 |
| Volume insuffisant pour le moat data au démarrage | Fallback Causse pur tant que < seuil ; seed via early adopters d'un même secteur |
| Coût LLM/vidéo | BYOK + routage deepseek (moat coût déjà là) ; vidéo en dernier |
| Cohérence multi-provider publishing | Tests d'intégration par réseau + comptes dev réels |

---

*RAMI — "L'IA qui vise juste." Ce PRD est le plan de complétion ; le mettre à jour à chaque epic livré.*
