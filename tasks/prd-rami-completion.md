# PRD: RAMI — Complétion & Déploiement (ralph-tui)

## Overview
Finir la plateforme RAMI (Agency OS SaaS B2B multitenant) : éliminer tout le contenu factice/mock, activer les 2 moats défendables (Performance Loop cross-tenant + Autorité Brand DNA culturelle), et finaliser le déploiement production. Base : audit codebase (réel vs mock) + moat-hunt scoré. Stack : Next.js 16, React 19, TypeScript strict, Supabase (RLS), Drizzle, pg-boss, proxy LiteLLM (deepseek/moonshot), Coolify. Exécution autonome story par story.

## Goals
- Activer MOAT-1 : boucle `publication → engagement réel → attribution → scoring → génération` + intelligence collective anonymisée.
- Activer MOAT-2 : productiser la matrice Causse×culture en standard public + rapport "Couleur de l'année MENA".
- Zéro factice : remplacer tout DEMO_/MOCK_/données hardcodées par des implémentations réelles.
- Production : Stripe live, quotas, monitoring, E2E, durcissement sécurité.

## Quality Gates
Ces commandes doivent passer pour CHAQUE user story (0 erreur, 0 warning — RÈGLE N°3) :
- `npm run typecheck` — TypeScript strict
- `npm run lint` — ESLint
- `npm run build` — build Next.js production

Pour toute story d'UI, ajouter :
- Vérification dans le navigateur via Playwright (parcours réel jusqu'à l'écran, conforme "zéro dette de validation").

Pour toute nouvelle table : RLS activée + policy d'isolation tenant testée (cross-tenant doit échouer).

## User Stories

<!-- ===================== VAGUE 1 — P0 : ACTIVER LES MOATS ===================== -->
<!-- EPIC A — Performance Loop cross-tenant (MOAT-1) -->

### US-001: Schéma post_metrics + RLS
**Description:** En tant que système, je veux stocker l'engagement réel des posts publiés pour mesurer la performance.
**Acceptance Criteria:**
- [ ] Table `post_metrics(id uuid, tenant_id uuid FK, post_id uuid FK social_posts, platform, collected_at, impressions, likes, comments, shares, clicks, saves, engagement_rate, raw jsonb, created_at)` via migration Drizzle + SQL Supabase.
- [ ] RLS activée : un tenant ne lit que ses propres metrics ; test cross-tenant échoue (403/0 ligne).
- [ ] Index `(tenant_id, platform, collected_at)` et `(post_id)`.
- [ ] Types partagés exportés depuis `packages/db/schema/post-metrics.ts`.

### US-002: MetricsProvider interface + collecte X (Twitter)
**Description:** En tant que système, je veux récupérer les metrics d'un tweet publié.
**Acceptance Criteria:**
- [ ] Interface `MetricsProvider { fetchMetrics(postId, token): NormalizedMetrics }` dans `src/lib/services/metrics/index.ts`.
- [ ] `src/lib/services/metrics/twitter.ts` appelle l'API X (tweet metrics) via `getValidToken()`, normalise impressions/likes/retweets/replies.
- [ ] Gestion erreurs : token révoqué → retour `{ unavailable: true }` sans crash.

### US-003: Collecte metrics LinkedIn
**Description:** En tant que système, je veux les metrics d'un post LinkedIn.
**Acceptance Criteria:**
- [ ] `src/lib/services/metrics/linkedin.ts` (socialActions / organizationalEntityShareStatistics), normalisé vers `NormalizedMetrics`.
- [ ] Mappe likes/comments/shares/impressions ; gère l'absence de scope gracieusement.

### US-004: Collecte metrics Meta (Facebook + Instagram)
**Description:** En tant que système, je veux les insights d'un post FB/IG.
**Acceptance Criteria:**
- [ ] `src/lib/services/metrics/meta.ts` (Graph API insights), reach/impressions/engagement/saves.
- [ ] Distingue FB page post vs IG media ; normalise.

### US-005: Collecte metrics Pinterest
**Description:** En tant que système, je veux les analytics d'un pin.
**Acceptance Criteria:**
- [ ] `src/lib/services/metrics/pinterest.ts` (Pin analytics v5), impressions/saves/clicks normalisés.

### US-006: Job pg-boss de collecte planifiée
**Description:** En tant que système, je veux collecter les metrics automatiquement après publication.
**Acceptance Criteria:**
- [ ] Worker `src/lib/queue/jobs/collect-metrics.ts` enregistré dans `src/instrumentation.ts`.
- [ ] À chaque `social_posts.status = published`, planifie 3 collectes (T+1h, T+24h, T+7j) via pg-boss `sendAfter`.
- [ ] Chaque exécution route vers le bon MetricsProvider et upsert dans `post_metrics`.
- [ ] Retry x3 + backoff ; logs structurés (pas de console.log).

### US-007: Attribution feature→performance
**Description:** En tant qu'agence, je veux savoir quels choix (couleur, forme, style, hook, format, créneau) corrèlent avec la performance.
**Acceptance Criteria:**
- [ ] Vue (ou table matérialisée) `attribution_facts` joignant `post_metrics` × (`generated_assets.dominant_color_hex`, `visual_direction`, `brand_dna_score`, objectif cognitif, hook, format, heure planifiée) via migration.
- [ ] Service `src/lib/services/metrics/attribution.ts` : `topFeatures(tenantId, sector, dimension)` renvoie un classement réel.
- [ ] Job `attribution.refresh` (incrémental) enregistré.

### US-008: Injection du "performance prior" dans le Prompt Compiler
**Description:** En tant qu'agence, je veux que la génération privilégie ce qui performe réellement.
**Acceptance Criteria:**
- [ ] `src/lib/services/brand-dna/prompt-compiler.ts` accepte un `performancePrior` (couleurs/styles gagnants par secteur×culture) et le pondère.
- [ ] Feature-flaggé : actif seulement si ≥ N posts mesurés (sinon fallback Causse pur).
- [ ] `generated_assets.performance_prior` (jsonb) persiste le prior utilisé.

### US-009: Schéma intelligence collective anonymisée
**Description:** En tant que système, je veux agréger la performance cross-tenant sans exposer de données individuelles.
**Acceptance Criteria:**
- [ ] Table `collective_benchmarks(sector, culture, platform, metric, value, sample_size, updated_at)` via migration.
- [ ] RLS : lecture filtrée par secteur du tenant ; aucune donnée brute d'autrui accessible ; écriture service-role uniquement.
- [ ] Contrainte k-anonymity : une ligne n'existe que si `sample_size >= 5` tenants distincts.

### US-010: Job d'agrégation collective
**Description:** En tant que système, je veux recalculer les benchmarks collectifs quotidiennement.
**Acceptance Criteria:**
- [ ] Job `collective.aggregate` (quotidien) agrège `post_metrics` opt-in par (secteur, culture, plateforme, metric).
- [ ] N'inclut que les tenants ayant consenti (US-011) ET respecte k≥5.
- [ ] Test : avec <5 tenants, aucune ligne produite.

### US-011: Consentement opt-in benchmarks (RGPD/CNDP)
**Description:** En tant que tenant, je veux choisir de contribuer aux benchmarks anonymisés en échange de l'accès collectif.
**Acceptance Criteria:**
- [ ] Champ `tenants.collective_optin boolean default false` + UI toggle dans Settings.
- [ ] Texte de consentement explicite (anonymisation, finalité) ; refus = pas d'accès aux benchmarks collectifs.
- [ ] Vérifié dans le navigateur.

### US-012: Dashboard analytics réel
**Description:** En tant qu'agence, je veux voir la performance réelle de mes posts (pas un count local).
**Acceptance Criteria:**
- [ ] `src/app/(dashboard)/dashboard/analytics/page.tsx` lit `post_metrics` (impressions/engagement réels) au lieu du count de posts.
- [ ] Affiche top features gagnantes (US-007) + comparaison au benchmark collectif (si opt-in).
- [ ] Empty state honnête si aucune metric encore collectée.
- [ ] Vérifié dans le navigateur.

<!-- EPIC B — Autorité Brand DNA (MOAT-2) -->

### US-013: Page publique standard "Causse × Culture"
**Description:** En tant que visiteur, je veux consulter le référentiel couleur×émotion×culture de RAMI.
**Acceptance Criteria:**
- [ ] Route publique `src/app/(public)/causse/page.tsx` : couleurs nommées + émotion + effet physio + notes culturelles (Maroc/MENA/Afrique), depuis `causse-matrix.ts`.
- [ ] SEO : metadata + OpenGraph + Schema.org + entrée sitemap ; i18n FR/EN (AR si dispo).
- [ ] Accessible sans authentification ; vérifié dans le navigateur.

### US-014: Service rapport de tendances "Couleur MENA"
**Description:** En tant que produit, je veux générer un rapport périodique liant culture, secteur et couleur.
**Acceptance Criteria:**
- [ ] `src/lib/services/brand-dna/trend-report.ts` : Crawl4AI (tendances) + collective_benchmarks + synthèse deepseek → rapport structuré.
- [ ] Export PDF brandé + version web (extrait freemium / complet premium).
- [ ] Route `/api/brand-dna/trend-report` (auth + gating plan Pro+).

### US-015: Cadence + gating du rapport tendances
**Description:** En tant que système, je veux générer le rapport trimestriellement et le réserver aux plans payants.
**Acceptance Criteria:**
- [ ] Tâche planifiée (cron Coolify documentée) génère le rapport par secteur chaque trimestre.
- [ ] Extrait visible en freemium ; rapport complet gated Pro+ (feature flag server-side).
- [ ] Vérifié dans le navigateur (extrait vs complet selon plan).

### US-016: Score de cohérence culturelle
**Description:** En tant qu'agence, je veux un score d'alignement culturel sur chaque visuel/post.
**Acceptance Criteria:**
- [ ] `vision-scorer.ts` + règles `causse-matrix.ts` produisent un score culturel + justification (ex. vert finance islamique, éviter rouge santé).
- [ ] Badge affiché sur le visuel avec le motif ; vérifié dans le navigateur.

<!-- OPS P0 -->

### US-017: Rotation du mot de passe super-admin
**Description:** En tant qu'admin, je veux régénérer le mot de passe super-admin exposé et invalider les sessions.
**Acceptance Criteria:**
- [ ] Script/action régénère le mot de passe via l'API admin Supabase et révoque les sessions actives.
- [ ] Le nouveau mot de passe n'apparaît jamais en clair dans les logs/transcript (sortie sécurisée).

### US-018: Configuration Stripe live
**Description:** En tant qu'admin, je veux passer Stripe en mode live.
**Acceptance Criteria:**
- [ ] 4 Price IDs live (`STRIPE_PRICE_SOLO/_PRO/_AGENCY/_AGENCY_PLUS`) + clés live + `STRIPE_WEBHOOK_SECRET` documentés dans `.env.example` et posés en env Coolify.
- [ ] Endpoint webhook `https://rami.ai-mpower.com/api/webhooks/stripe` configuré ; signature vérifiée ; un événement test live sync le plan.

### US-019: Tâche planifiée reconciliation Stripe
**Description:** En tant que système, je veux réconcilier les abonnements Stripe quotidiennement.
**Acceptance Criteria:**
- [ ] Tâche planifiée Coolify exécute `scripts/cron-stripe-reconcile.sh` à 02h UTC.
- [ ] Le secret `STRIPE_RECONCILE_CRON_SECRET` protège la route ; exécution manuelle OK.

### US-020: Enforcement des quotas de génération par plan
**Description:** En tant que système, je veux bloquer la génération au-delà du quota du plan.
**Acceptance Criteria:**
- [ ] `tenants.monthly_generation_count` incrémenté à chaque génération ; reset mensuel.
- [ ] Au-delà du quota plan → génération bloquée + modal upgrade ; vérifié dans le navigateur.
- [ ] `QuotaBadge` affiche le restant.

### US-021: Événements Sentry/PostHog réels
**Description:** En tant qu'équipe produit, je veux tracer les événements clés.
**Acceptance Criteria:**
- [ ] PostHog capture : `tenant_signup`, `brand_dna_completed`, `visual_generated`, `post_published`, `subscription_upgraded`.
- [ ] Sentry capture les erreurs runtime des actions critiques (publishing, billing, génération).
- [ ] Aucun `console.log` en prod ; logger structuré.

<!-- ===================== VAGUE 2 — P1 : COMPLÉTER LE CŒUR FACTICE ===================== -->
<!-- EPIC C — Transcriptions -->

### US-022: Traitement Whisper des transcriptions
**Description:** En tant qu'utilisateur Pro, je veux que mon audio uploadé soit transcrit.
**Acceptance Criteria:**
- [ ] Job `src/lib/queue/jobs/transcribe.ts` → service `src/lib/services/transcription/whisper.ts` (OpenAI Whisper) sur le fichier MinIO.
- [ ] Remplit `transcriptions.transcript_text` + statut (`processing`→`done`/`failed`).
- [ ] Vérifié dans le navigateur : upload → transcription affichée.

### US-023: Verbatims, speakers et résumé
**Description:** En tant qu'utilisateur, je veux des verbatims clés et un résumé.
**Acceptance Criteria:**
- [ ] Extraction verbatims + diarisation basique + résumé via deepseek ; persiste `speakers`, `verbatims`.
- [ ] Affichés et exportables ; vérifié dans le navigateur.

### US-024: Transcription → brief de contenu (moat)
**Description:** En tant qu'agence, je veux générer un brief de contenu depuis une réunion client.
**Acceptance Criteria:**
- [ ] Bouton "Générer un brief" sur une transcription → pré-remplit le Workflow (Step 1) + propose un raffinage Brand DNA (ton/tabous détectés).
- [ ] Vérifié dans le navigateur : un brief pré-rempli est créé.

<!-- EPIC D — Documents -->

### US-025: Génération d'offre commerciale PDF
**Description:** En tant qu'agence, je veux générer une offre commerciale brandée.
**Acceptance Criteria:**
- [ ] `src/lib/services/documents/offer.ts` : deepseek (structure) → rendu PDF brandé (react-pdf ou puppeteer) → MinIO.
- [ ] Gated Agency ; vérifié dans le navigateur (PDF téléchargeable).

### US-026: Rapport client PDF
**Description:** En tant qu'agence, je veux un rapport de performance client en PDF.
**Acceptance Criteria:**
- [ ] Agrège `post_metrics` (US-001+) → PDF hebdo/à la demande, brandé.
- [ ] Gated Agency ; vérifié dans le navigateur.

<!-- EPIC E — Leads -->

### US-027: Enrichissement Apollo
**Description:** En tant qu'agence, je veux enrichir un lead via Apollo.
**Acceptance Criteria:**
- [ ] `src/lib/services/leads/apollo.ts` appelle Apollo `/people/match` ; remplit `leads.apollo_data` (titre, entreprise, email).
- [ ] Action `enrichLeadAction` + bouton UI ; vérifié dans le navigateur.

### US-028: Scoring Brand DNA match des leads
**Description:** En tant qu'agence, je veux un score de pertinence lead↔ICP.
**Acceptance Criteria:**
- [ ] Score (deepseek) écrit dans `leads.score` + `brand_dna_match` ; tri par score dans la UI.
- [ ] Vérifié dans le navigateur.

### US-029: Remplacer les leads de démo
**Description:** En tant qu'utilisateur, je ne veux plus voir de données de démo.
**Acceptance Criteria:**
- [ ] `DEMO_LEADS` supprimé ; liste lit la table `leads` réelle ; empty state honnête si vide.
- [ ] Vérifié dans le navigateur.

<!-- EPIC F — Competitors -->

### US-030: Analyse concurrents réelle via Crawl4AI
**Description:** En tant qu'agence, je veux analyser un concurrent réel.
**Acceptance Criteria:**
- [ ] Ajouter un concurrent (URL/handle) → Crawl4AI ingère + deepseek analyse (fréquence, formats, tonalité, gaps) ; persiste table `competitors`.
- [ ] Données hardcodées (COMPETITORS/TOP_CONTENT/FREQ_DATA/GAP_ANALYSIS) supprimées.
- [ ] Vérifié dans le navigateur.

<!-- EPIC G — Analytics (fallback) -->

### US-031: Fallback Ayrshare + finalisation UI analytics
**Description:** En tant que système, je veux un fallback analytics si la collecte directe échoue.
**Acceptance Criteria:**
- [ ] Si un provider metrics direct échoue, fallback optionnel Ayrshare (si clé configurée), sinon dégradation propre.
- [ ] UI analytics finalisée (filtres période/plateforme) ; vérifié dans le navigateur.

<!-- EPIC H — Approvals -->

### US-032: Workflow d'approbation client
**Description:** En tant qu'agence, je veux faire approuver un post par un client externe sans compte.
**Acceptance Criteria:**
- [ ] Table `approvals` + route publique `/approve/[token]` (token signé) ; client approuve/commente → statut `approved`/`changes_requested`.
- [ ] RLS + expiration du token ; gated Agency+ ; vérifié dans le navigateur (parcours externe).

<!-- OPS P1 -->

### US-033: Tests E2E Playwright des parcours critiques
**Description:** En tant qu'équipe, je veux des E2E verts en CI sur les parcours critiques.
**Acceptance Criteria:**
- [ ] Specs : auth, onboarding Brand DNA, workflow génération, publishing, billing — passent en local + CI.
- [ ] Intégrés au workflow GitHub Actions.

### US-034: Audit trail des actions sensibles
**Description:** En tant qu'admin, je veux tracer les actions sensibles.
**Acceptance Criteria:**
- [ ] Table `audit_logs` alimentée sur : publish, oauth connect/disconnect, billing, actions admin.
- [ ] RLS lecture tenant ; consultable.

### US-035: Smoke tests prod + monitoring
**Description:** En tant qu'équipe, je veux valider la prod après déploiement.
**Acceptance Criteria:**
- [ ] `scripts/smoke-test.ts` couvre health, auth, génération, publishing ; lancé post-deploy.
- [ ] Alertes Sentry configurées (error rate, p95).

<!-- ===================== VAGUE 3 — P2 : SURFACE & EXTENSION ===================== -->
<!-- EPIC I — Vidéo -->

### US-036: Génération de script vidéo
**Description:** En tant qu'agence, je veux générer un script vidéo depuis un brief.
**Acceptance Criteria:**
- [ ] Brief → script structuré (deepseek) persisté ; affiché dans la UI vidéo (remplace le mock script).

### US-037: Génération de voix-off (TTS)
**Description:** En tant qu'agence, je veux une voix-off depuis le script.
**Acceptance Criteria:**
- [ ] Service TTS (ElevenLabs ou équivalent) → fichier audio MinIO ; job async ; statut affiché.

### US-038: Génération de storyboard
**Description:** En tant qu'agence, je veux un storyboard visuel.
**Acceptance Criteria:**
- [ ] Découpe le script en plans → images via le Visual Engine existant ; galerie storyboard.

### US-039: Assemblage / rendu vidéo
**Description:** En tant qu'agence, je veux une vidéo finale rendue.
**Acceptance Criteria:**
- [ ] Job async (Veo/Runway/Kling déjà déclarés) assemble plans + voix → vidéo MinIO ; statut + fallback provider.

### US-040: UI vidéo réelle
**Description:** En tant qu'agence, je veux piloter le pipeline vidéo réel.
**Acceptance Criteria:**
- [ ] `dashboard/video/page.tsx` reflète l'état réel des jobs (plus de stepper hardcodé) ; vérifié dans le navigateur.

<!-- EPIC J — Présentations -->

### US-041: Génération du plan de présentation
**Description:** En tant qu'agence, je veux générer un plan de slides.
**Acceptance Criteria:**
- [ ] Brief → plan structuré (deepseek) ; remplace MOCK des étapes plan.

### US-042: Génération des slides
**Description:** En tant qu'agence, je veux des slides réelles.
**Acceptance Criteria:**
- [ ] Plan → slides via templates (style Gamma) ; `MOCK_SLIDES`/`MOCK_THEMES` supprimés ; vérifié dans le navigateur.

### US-043: Export présentation PDF/PPTX
**Description:** En tant qu'agence, je veux exporter la présentation.
**Acceptance Criteria:**
- [ ] Export PDF (et PPTX si faisable) → MinIO ; téléchargeable ; vérifié dans le navigateur.

<!-- EPIC K — Publishing étendu -->

### US-044: Service de publication Mastodon
**Description:** En tant qu'agence, je veux publier sur Mastodon.
**Acceptance Criteria:**
- [ ] `src/lib/services/publishing/mastodon.ts` (lib `masto`) implémente `PublishingProvider` ; testé avec un compte dev.

### US-045: Service de publication YouTube
**Description:** En tant qu'agence, je veux publier sur YouTube.
**Acceptance Criteria:**
- [ ] `src/lib/services/publishing/youtube.ts` (googleapis, Data API v3) ; upload + métadonnées ; testé compte dev.

### US-046: Service de publication TikTok
**Description:** En tant qu'agence, je veux publier sur TikTok.
**Acceptance Criteria:**
- [ ] `src/lib/services/publishing/tiktok.ts` (Content Posting API) ; testé compte dev.

<!-- EPIC L — Settings & Email -->

### US-047: Emails transactionnels Resend
**Description:** En tant qu'utilisateur, je veux recevoir les emails transactionnels.
**Acceptance Criteria:**
- [ ] Resend branché : invitation équipe, alertes (échec publication), envoi rapport.
- [ ] Templates ; `EMAIL_FROM` configuré ; envoi réel vérifié.

### US-048: Préférences de notifications réelles
**Description:** En tant qu'utilisateur, je veux gérer mes notifications.
**Acceptance Criteria:**
- [ ] `settings/notifications` persiste les préférences et les respecte ; vérifié dans le navigateur.

### US-049: Invitations et gestion d'équipe
**Description:** En tant qu'agency owner, je veux inviter des membres.
**Acceptance Criteria:**
- [ ] Invitation via `tenant_members` + email Resend ; rôles (agency_owner/brand_manager/content_creator/viewer) ; vérifié dans le navigateur.

### US-050: Danger zone — suppression & export RGPD
**Description:** En tant que propriétaire, je veux supprimer mon tenant et exporter mes données.
**Acceptance Criteria:**
- [ ] Suppression tenant avec double confirmation ; export Brand DNA + assets (JSON/ZIP) RGPD.
- [ ] Vérifié dans le navigateur.

## Functional Requirements
- FR-1: Toute publication réussie doit déclencher la collecte de metrics (T+1h/24h/7j).
- FR-2: Les recommandations de génération doivent intégrer un signal de performance réelle dès qu'un seuil de volume est atteint, sinon fallback Causse.
- FR-3: Les benchmarks collectifs ne doivent exister qu'avec k-anonymity ≥ 5 tenants opt-in et ne jamais exposer de données individuelles.
- FR-4: Aucune donnée mock/DEMO/hardcodée ne doit être servie en runtime après complétion d'un epic.
- FR-5: Toute feature gated par plan doit correspondre à une capacité réelle (pas de démo-ware).
- FR-6: Toute nouvelle table doit avoir RLS d'isolation tenant testée.
- FR-7: Les jobs longs (metrics, transcription, vidéo, agrégation) doivent passer par pg-boss (async, retry).

## Non-Goals
- Auto-détection de thème système / personnalisation visuelle avancée.
- TikTok/YouTube/Mastodon prioritaires avant les moats (P2 seulement).
- Refonte du noyau réel existant (auth, visual engine, publishing X/LinkedIn/Meta/Pinterest) — il fonctionne, on capitalise.
- Migration hors Coolify/Supabase self-hosted.

## Technical Considerations
- Réutiliser les abstractions existantes : `PublishingProvider`, `ImageProvider`, `prompt-config` (provider chains), `getValidToken()` (OAuth refresh), storage MinIO/R2.
- LLM via proxy LiteLLM (deepseek-v4-flash texte, moonshot-v1-8k-vision-preview vision) — `OPENAI_BASE_URL`/`OPENAI_API_KEY`.
- pg-boss déjà connecté (schéma `pgboss`) — y brancher les nouveaux jobs via `instrumentation.ts`.
- Anonymisation : k-anonymity + opt-in, conforme RGPD/CNDP (registre Art.30).
- Déploiement Coolify (Dockerfile/Nixpacks) + cloudflared ; Supabase dédié `db-rami`.

## Success Metrics
- MOAT-1 actif : ≥1 secteur avec benchmark collectif (≥5 tenants) + uplift engagement mesurable (A/B prior vs Causse pur).
- MOAT-2 actif : 1 rapport "Couleur MENA" publié + page `/causse` indexée.
- Zéro factice : `grep -r "DEMO_\|MOCK_" src/` = 0 en usage runtime.
- Prod : lint 0 / TS 0 / build OK / E2E verts / Stripe live / 0 vuln critique.

## Open Questions
- Whisper : API OpenAI vs self-hosted (coût/souveraineté) ?
- TTS vidéo : ElevenLabs vs alternative MENA/arabe ?
- Seuil de volume (N) exact pour activer le performance prior par secteur ?
