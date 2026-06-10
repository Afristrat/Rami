# PRD — RAMI FINITION L99 (v2, 2026-06-10)

> Successeur opérationnel de `PRD_RAMI_L99.md`. Objectif unique : **plateforme pleinement
> fonctionnelle, zéro dette technique, zéro dette de validation** — chaque module RÉEL,
> câblé, browser-verified. Fondé sur l'audit de câblage du 2026-06-10
> (`AUDIT_CABLAGE_2026-06-10.md`), l'analyse des 50 US (`.ralph/prd.json`, 21 passes),
> et l'analyse de référence Social Engine Pro.

---

## 0. État des lieux (vérifié, pas déclaré)

- **Gates** : TS 0 · lint 0/0 · Jest 261/261 · audit 0 — *sur main, vérifié 2026-06-10*.
- **Prod** : `https://rami.ai-mpower.com` live (Coolify), DB dédiée `db-rami` (27 migrations, RLS 100 %).
- **Moats** : MOAT-1 Performance Loop ✅ actif (pipeline complet) · MOAT-2 Autorité Causse ✅ actif.
- **MAIS usage réel = zéro** : 0 posts, 0 connexions sociales, 0 sessions visuelles.
  Cause racine : chaînes de câblage mortes (OAuth apps jamais créées, Stripe absent, Whisper non routé).
- **US-017 (mdp super-admin) : SOLDÉE le 2026-06-10** (rotation bcrypt + 4 sessions révoquées).
- **13 poches de factice résiduel** détectées hors prd.json (→ Epic Z).

## 1. Principes d'exécution

1. **DEFCON 1 données** : aucune stat/score inventé. Un état vide honnête vaut mieux qu'un mock.
2. **Zéro dette** : chaque story = TS 0 + lint 0 + tests + browser-verify avant `passes=true`.
3. **Proxy-first** : tout LLM/audio passe par `proxy.ai-mpower.com` quand routable (clé unique, coûts centralisés). Les générateurs image/vidéo restent en direct (non routables LiteLLM).
4. **Patterns gelés** (cf. `.ralph/progress.md`) : proxy.ts, RLS `get_current_tenant_id()`, normalizeBrandDNA, PDF print-CSS, pg-boss singleton, AES-256-GCM tokens, Jest.
5. **Orchestration** : agents d'exécution sur modèles inférieurs (sonnet/haiku) supervisés par l'expert (revue de chaque diff, gates avant merge) ; stories indépendantes en parallèle via worktrees.

## 2. Epics et séquencement

### EPIC Z — Zéro dette câblage (NOUVEAU — avant tout, 100 % autonome)
Purge des 13 poches de factice (cf. audit §3). Aucune clé requise.

| US | Contenu | Fichiers |
|---|---|---|
| Z-01 | Score Brand DNA réel dans le workflow : brancher VisionScorer, supprimer `Math.random` (2 sites) | `workflow.actions.ts` |
| Z-02 | Supprimer fallback picsum.photos → erreur honnête + retry UI | `workflow.actions.ts` |
| Z-03 | Supprimer le path image legacy dupliqué + références `/api/replicate/poll` mortes (unifier sur `image-generation/index.ts`) | `workflow.actions.ts` |
| Z-04 | Score réel dans media-card (lire `visual_session_images.brand_dna_score`) | `media-card.tsx` |
| Z-05 | Tenant-switcher + page admin tenants : données réelles (requête tenants RLS/service-role) | `tenant-switcher.tsx`, `tenants/page.tsx` |
| Z-06 | Calendar-strip : événements réels depuis `posts.scheduled_at` (état vide honnête) | `calendar-strip.tsx` |
| Z-07 | Dashboard : retirer lignes d'activité mock → état vide honnête | `dashboard/page.tsx` |
| Z-08 | Sync `.env.example` : +OPENAI_BASE_URL/VISION_MODEL/LLM_TEXT_MODEL/SUPABASE_DB_POOLER_URL ; purge fantômes (R2, Ayrshare†, IMAGE_PROVIDER_PRIMARY) | `.env.example` |

† US-031 tranchera : implémenter Ayrshare en fallback OU purger définitivement.

### PHASE 1 — Autonome immédiat (aucune clé requise) — parallélisable ×3 agents
US-025 (offre PDF) · US-026 (rapport client PDF) · US-030 (competitors Crawl4AI — service UP vérifié) ·
US-032 (approbation client, remplace Z mock approval-board) · US-034 (audit trail) ·
US-036 (script vidéo deepseek) · US-038 (storyboard via Visual Engine) ·
US-041/042/043 (présentations + export) · US-050 (danger zone RGPD) · US-033 (Playwright E2E) ·
US-035 (smoke tests — alertes Sentry dès DSN posé).

### PHASE 2 — Dès provisioning P0 Amine (cf. `API_REQUIREMENTS_AMINE.md`)
- **Whisper routé** → US-022 happy-path → US-023 (verbatims/speakers, purge Z-10) → US-024 (brief).
- **Stripe live** → US-018 → US-019 (+ tâche planifiée Coolify) → invoices réelles (Z5).
- **OAuth apps X/LinkedIn/Meta/Pinterest** → première connexion sociale réelle en prod,
  premier post publié, premier cycle Performance Loop vivant. **Durcissement publishing**
  (learnings SE Pro) : escaping commentary LinkedIn `()[]{}<>@|~_`, post-id via header
  `x-linkedin-id`, version header `LinkedIn-Version` épinglée, multiImage LinkedIn,
  carousel Instagram (containers `is_carousel_item`), crop ratio IG 4:5–1.91:1 automatique,
  retry exponentiel catégorisé (retryable 5xx/timeout vs fatal 4xx/token révoqué),
  pre-flight refresh à J-7, notification expiration LinkedIn (pas de refresh possible).

### PHASE 3 — P1/P2 provisioning
- Sentry+PostHog posés → observabilité réelle (US-021 déjà codée, US-035 alertes).
- Resend → US-047 (service email from scratch : `src/lib/services/email/`) → US-048/049.
- TTS (décision ElevenLabs/proxy) → US-037 → US-039 (Veo/Wan déjà couverts) → US-040 (UI vidéo réelle, purge Z-13).
- YouTube/Mastodon → US-044/045 (porter les flows SE Pro analysés : Mastodon = Bearer simple
  + polling 202 média ; YouTube = OAuth Google + resumable upload). TikTok US-046 après accès API.

### Critères de sortie globaux (Definition of Done plateforme)
1. 50/50 US `passes=true` + Epic Z purgé ; 2. zéro `MOCK_`/`Math.random` données dans src/ ;
3. parcours réel complet en prod : signup → onboarding → génération → publication X/LinkedIn
→ métriques J+1 → rapport PDF — browser-verified ; 4. gates 0/0/verts/0 ; 5. Sentry+PostHog
actifs ; 6. `.env.example` = miroir exact du code ; 7. PASSATION à jour.

## 3. Risques & parades
- **Meta App Review** (délai semaines) → démarrer en mode dev/testeurs, review en parallèle.
- **Apollo payant** → Hunter par défaut (déjà fait), BYOK pour les tenants.
- **LinkedIn Community Management** (accès restreint) → MVP profil perso + pages simples d'abord.
- **TikTok Content Posting API** (validation) → dernière position du séquencement.
- **Coûts image** : chaînes 1-3 actives suffisent ; fallbacks 4-5 = résilience, pas capacité.

## 4. Suivi
Ralph loop sur `.ralph/prd.json` (ajouter Epic Z en stories Z-01→Z-08, prio P0).
Chaque session : gates avant/après, browser-verify, PASSATION.md, commit `[S-XXX]`.
