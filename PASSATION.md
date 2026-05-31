<!-- PASSATION NUCLÉAIRE — RAMI by AI-MPower -->
<!-- Protocole de quart industrie nucléaire — lire INTÉGRALEMENT avant toute action -->

# == PASSATION RAMI 2026-05-05T00:45:00Z ==

---

## [ETAT] — État global du projet

**Branch active** : `main` — propre (`git status` : nothing to commit)
**Commits totaux** : 126 (dernier : `009c026 fix(billing): lazy initialization Stripe`)
**Build** : ✅ `npm run build` → passe sans erreur (0 TS errors, 0 build errors)
**TypeScript** : ✅ `npm run typecheck` → 0 erreur
**Lint** : ❌ `npm run lint` → **5 erreurs + 39 warnings** (voir [ALERTE])
**npm audit** : ❌ **2 vulnérabilités critiques + 7 high** (via resend → svix → handlebars/protobufjs)
**Tests** : non exécutés en prod (Playwright nécessite `.env.local` + serveur actif)
**Repo GitHub** : https://github.com/Afristrat/Rami
**Supabase Staging** : rfndjbrwpdltfzvyreyv.supabase.co ✅ configuré
**Supabase Prod** : uzmatxilmyepuhfnpfrv.supabase.co ⚠️ tables NON créées (voir [BLOQUE])
**Déployé en prod** : ❌ JAMAIS déployé — rami.ai-mpower.com ne pointe pas encore vers Vercel

---

## [ENCOURS] — Tâches actives

> Aucune tâche active — projet en pause après marathon. Prochaines actions = pre-deploy (voir [NEXT]).

---

## [FAIT] — Ce qui a été accompli (marathon complet)

### Phase Fondation — J1

- ✅ Next.js 16.1.6 + React 19 + TypeScript strict + Tailwind v4 + shadcn/ui
- ✅ Drizzle ORM — schéma complet (14 tables + 9 enums, voir §DB)
- ✅ Supabase Auth SSR (login / register / reset-password / callback)
- ✅ Middleware onboarding obligatoire (redirect si pas `onboarding_completed`)
- ✅ Wizard onboarding 3 étapes (tenant creation + logo upload + plan choice)
- ✅ Layout dashboard : sidebar, header, tenant-switcher, mobile drawer, dark mode
- ✅ Brand DNA : formulaire complet, matrice Causse (11 couleurs), score 0–100 temps réel
- ✅ Scheduler : calendrier mensuel, brouillons, limites caractères par plateforme
- ✅ Tests Playwright : auth.spec + brand-dna.spec + scheduler.spec + onboarding.spec

### Phase J2 — Publishing + Visual Engine

- ✅ OAuth complet : Twitter (PKCE), LinkedIn, Meta (FB+IG), Pinterest — authorize / callback / disconnect / refresh
- ✅ Tokens chiffrés AES-256 au repos
- ✅ `getValidToken()` — refresh automatique avant publication
- ✅ 24 tests Playwright connections.spec.ts
- ✅ Services publishing : twitter.ts, linkedin.ts, facebook.ts, instagram.ts, pinterest.ts
- ✅ Prompt Compiler : Brand DNA → positive_prompt + negative_prompt (Causse + Gestalt)
- ✅ Image generation : 5 providers en fallback chain (Nano Banana → Fal.ai FLUX1.1 Pro Ultra → Google Imagen 4 → Replicate → Together AI)
- ✅ Galerie 4 directions × N images + Brand DNA score badge (0–100) sur chaque visuel
- ✅ Export ZIP des sélections
- ✅ `generateBatch()` — seeds variants en parallèle

### Phase J3 — Content Workflow + Queue

- ✅ Workflow 7 étapes (Brief → Format → Génération texte Claude → Visuel → Review → Approbation → Scheduling)
- ✅ pg-boss worker (initialisé dans `src/instrumentation.ts` au boot)
- ✅ Publication réelle via OAuth avec retry × 3
- ✅ Statuts posts : draft → review → approved → scheduled → publishing → published / failed
- ✅ Route `/api/queue/publish` — maxDuration Vercel : 60s

### Phase J4 — Storage + Media Library

- ✅ MinIO self-hosted sur cloud-station.io (PAS Supabase Storage)
- ✅ Upload + resize WebP via sharp (< 500 Ko)
- ✅ URLs CDN signées (MinIO + R2)
- ✅ Quota par plan : Free 500 Mo / Solo 5 Go / Pro 20 Go / Agency illimité
- ✅ Media library : grille, upload drag-and-drop, filtres type, lightbox

### Phase J5 — Billing Stripe

- ✅ Page `/pricing` — 5 plans (Free / Solo $59 / Pro $149 / Agency $399 / Agency+ $699)
- ✅ Checkout Stripe Sessions
- ✅ Webhook `/api/webhooks/stripe` (signature vérifiée, maxDuration 30s)
- ✅ Cron quotidien `/api/cron/stripe-reconcile` (00:02 UTC, secret requis)
- ✅ Feature flags vérifiés côté serveur (`require-feature.ts`)
- ✅ Modal upgrade quand quota dépassé + `QuotaBadge` dans le header

### Phase J6 — Analytics

- ✅ Dashboard analytics : KPIs, graphiques Recharts, top posts, filtres période/plateforme

### Phase J7 — Settings

- ✅ `/settings/profile` — édition nom, email, avatar
- ✅ `/settings/connections` — OAuth connections manager
- ✅ `/settings/billing` — portail Stripe
- ✅ `/settings/team` — invitation membres, rôles (agency_owner, brand_manager, content_creator, viewer)
- ✅ `/settings/notifications` — préférences email
- ✅ `/settings/danger` — suppression tenant (confirmation explicite)

### Phase J8 — Tests & Sécurité

- ✅ 15 fichiers Playwright E2E (auth, brand-dna, workflow, billing, analytics, security, settings, library, queue, scheduler, publishing, connections, onboarding, build-health, ???)
- ✅ 2 fichiers tests unitaires Jest (billing-plans.test.ts + brand-dna-score.test.ts)
- ✅ Tests isolation tenant (cross-tenant → doit échouer)
- ✅ Tests XSS dans brief
- ✅ Tests feature flags par plan

### Phase J9 — Polish

- ✅ Loading skeletons sur toutes les pages dashboard
- ✅ Error boundaries
- ✅ Toast notifications (sonner)
- ✅ Empty states illustrés
- ✅ SEO metadata via `generateMetadata()` sur toutes les pages
- ✅ Page 404 personnalisée
- ✅ Structured logger (`src/lib/utils/logger.ts`) — zéro `console.log` en prod

### Phase J10 — Deploy prep

- ✅ Sentry : client + server + edge (source maps)
- ✅ PostHog : client-side tracking
- ✅ `vercel.json` : région cdg1, maxDuration par route, cron Stripe
- ✅ `.github/workflows/` : CI/CD (lint → typecheck → build → E2E → Vercel)
- ✅ `scripts/smoke-test.ts` — smoke test post-deploy
- ✅ Health endpoint `/api/health`
- ✅ Robots.txt + sitemap.xml dynamiques
- ✅ CSP strict (Content-Security-Policy) dans `next.config.ts`

### Phase CDC v1.1 — Features supplémentaires post-marathon

- ✅ **F1–F4** : Connexions OAuth dans onboarding, 30 secteurs groupés, multi-select objectifs cognitifs, promesses concrètes Brand DNA
- ✅ **F5–F6** : Boutons IA "Générer/Améliorer/Pré-remplir sections" dans le formulaire Brand DNA (Claude Haiku 4.5), route `/api/brand-dna/ai-assist`
- ✅ **F7** : Benchmark sectoriel Perplexity (cache 7j, route `/api/brand-dna/perplexity-benchmark`) — plan Pro+
- ✅ **F8** : Super Admin BYOK (Bring Your Own Key) — panel admin pour configurer les API keys par tenant

### Admin panel complet

- ✅ `/admin` — dashboard stats globaux
- ✅ `/admin/users` — gestion utilisateurs
- ✅ `/admin/tenants` — activation/plan override
- ✅ `/admin/keys` — API keys management
- ✅ `/admin/prompts` — CRUD prompt templates (avec seed 11 cas d'usage)
- ✅ `/admin/providers` — configuration providers IA par tenant (BYOK)

### Video Generation (feature bonus)

- ✅ 5 providers : Veo 3.1 → Runway Gen-4.5 → Kling 2.6 → Luma Ray3 → Wan 2.2
- ✅ Page `/dashboard/video` (scaffold UI riche, 378 lignes)

### i18n

- ✅ next-intl 4.8.3 — FR + EN, tous les namespaces couverts

---

## [ALERTE] — Avertissements, dettes, risques

### !! LINT — 5 erreurs bloquantes (DEFCON 1 selon CLAUDE.md)

**Fichiers concernés** (5 errors, 39 warnings) :

| Fichier | Erreur |
|---------|--------|
| `src/components/library/media-library-client.tsx:86` | React Compiler : memoization ne peut pas être préservée (`useMemo` avec deps `[]` alors que dep réelle est `t`) |
| `src/components/library/media-library-client.tsx:100` | idem (dep réelle `assets`) |
| `src/components/library/media-library-client.tsx:116` | idem (dep réelle `t`) |
| `src/components/brand-dna/brand-dna-form.tsx:46` | idem (dep réelle `onUpload`) |
| `src/components/settings/team-panel.tsx:297` (environ) | `Cannot create components during render` — composant créé dans le rendu |

**Fichiers avec warnings** (39 au total) : `admin/model-picker.tsx`, `admin/provider-keys-panel.tsx`, `billing/upgrade-modal.tsx`, `brand-dna/brand-assets-manager.tsx`, `brand-dna/color-palette-picker.tsx`, `brand-dna/dna-score-badge.tsx`, `brand-dna/perplexity-benchmark-panel.tsx`, `brand-dna/prefill-section-button.tsx`, `documents/DocumentsTable.tsx`, `layout/user-menu.tsx`, `leads/AddLeadDialog.tsx`, `leads/KanbanBoard.tsx`, `leads/LeadDetailPanel.tsx`

**Fix requis** : supprimer les `useMemo` manuels dans ces composants (React 19 + React Compiler les gère automatiquement) et extraire le composant inline en dehors du rendu dans team-panel.tsx.

### !! npm audit — 2 vulnérabilités CRITIQUES

| Paquet | Sévérité | Via | Fix |
|--------|----------|-----|-----|
| `handlebars 4.0.0–4.7.8` | **CRITIQUE** | `resend → @svix/cli` | `npm audit fix` ou upgrade resend |
| `protobufjs < 7.5.5` | **CRITIQUE** | `resend → @svix/cli` | idem |
| + 7 high | high | divers | `npm audit fix` |

**Fix** : `npm audit fix` (ne touche pas aux breaking changes). Si insuffisant : forcer les résolutions dans `package.json` avec `overrides`.

### !! Supabase PROD — tables non créées

Les 34 migrations SQL sont dans `supabase/migrations/` mais n'ont PAS été appliquées sur `uzmatxilmyepuhfnpfrv.supabase.co` (prod). Seul le staging est configuré.

### ! CHECKLIST.md obsolète

Le fichier `CHECKLIST.md` à la racine de `Rami/` est obsolète — il marque J2-J10 comme "⏳ À faire" alors que tout est mergé dans main. Ne pas s'y fier pour l'état réel.

### ! Leads — données de démo

La page `/dashboard/leads` affiche `DEMO_LEADS` (9 leads hardcodés) quand la table `leads` est vide. C'est un comportement intentionnel (UX empty state), mais masque l'absence de vraies données.

### ! Page competitors — données mock

`/dashboard/competitors` utilise `COMPETITORS` hardcodé (5 entrées fictives). Ce n'est PAS connecté à une API ou à la DB. Feature non implémentée.

### ! Worktrees non nettoyés

20+ worktrees git existent encore dans `Rami/` (worktree-j1-auth, worktree-j1-brand-dna, ..., worktree-v11-admin, etc.). Aucun n'est actif mais ils prennent de la place disque.

### ! Variables d'environnement PROD

Le `.env.local` n'est pas configuré pour la prod. Les 60+ variables du `.env.example` doivent être renseignées sur Vercel.

---

## [BLOQUE] — Items bloqués avec cause

| Item | Blocage | Cause |
|------|---------|-------|
| Déploiement Vercel | ✗ BLOQUÉ | Variables env PROD non configurées sur Vercel |
| Supabase PROD | ✗ BLOQUÉ | 34 migrations non appliquées sur prod |
| Stripe live | ✗ BLOQUÉ | Price IDs live non configurés (`STRIPE_PRICE_SOLO`, `_PRO`, `_AGENCY`, `_AGENCY_PLUS`) |
| DNS rami.ai-mpower.com | ✗ BLOQUÉ | Vercel project non lié — domain non pointé |
| Cloudflare R2 | ✗ BLOQUÉ | Bucket "rami-cdn" non créé (R2 credentials dans .env.example mais vides) |
| Fal.ai key rotation | ✗ BLOQUÉ | Clé utilisée en dév doit être révoquée post-deploy (sécurité) |
| MinIO PROD | ?? À vérifier | `MINIO_ENDPOINT` = cloud-station.io (staging) — vérifier si prod = même endpoint |

---

## [NEXT] — Prochaines actions prioritaires

### Priorité 1 — Corriger la dette technique avant tout déploiement

```bash
# 1. Corriger les 5 erreurs lint (React Compiler useMemo)
# Dans media-library-client.tsx : supprimer les useMemo manuels
# Dans brand-dna-form.tsx : supprimer le useMemo avec dep onUpload
# Dans team-panel.tsx : extraire le composant inline hors du rendu

# 2. Corriger les vulnérabilités npm
npm audit fix
# Si insuffisant, ajouter dans package.json :
# "overrides": { "handlebars": "^4.7.8", "protobufjs": "^7.5.5" }

# 3. Vérifier après correction
npm run lint        # → doit afficher 0 error, 0 warning
npm audit           # → doit afficher 0 critical/high
```

### Priorité 2 — Appliquer les migrations Supabase PROD

```sql
-- Se connecter à uzmatxilmyepuhfnpfrv.supabase.co
-- Appliquer dans l'ordre :
-- supabase/migrations/20260311000001_init_schema.sql → ...20260314000001_fix_rls_gaps.sql
-- VÉRIFIER ensuite que RLS est actif sur TOUTES les tables
```

### Priorité 3 — Configurer les variables d'environnement Vercel

Toutes les variables du `.env.example` (60+) doivent être renseignées dans les settings Vercel du projet. Variables minimales absolues :
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_POOLER_URL` (IPv4 pooler — pg-boss en a besoin)
- `ANTHROPIC_API_KEY`
- `FAL_KEY` / `FAL_API_KEY`
- `STRIPE_SECRET_KEY` (live) / `STRIPE_PUBLISHABLE_KEY` (live) / `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_SOLO` / `_PRO` / `_AGENCY` / `_AGENCY_PLUS` (Price IDs Stripe live)
- `MINIO_ENDPOINT` / `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` / `MINIO_BUCKET`
- `OAUTH_TOKEN_ENCRYPTION_KEY` (32-byte hex — **NOUVEAU** à générer : `openssl rand -hex 32`)
- `RESEND_API_KEY` / `EMAIL_FROM`
- `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `TWITTER_CLIENT_ID` / `_SECRET` + LinkedIn / Meta / Pinterest credentials
- `STRIPE_RECONCILE_CRON_SECRET` (générer avec `openssl rand -hex 32`)

### Priorité 4 — Configurer Stripe live

1. Créer les 4 Price IDs en mode live dans le dashboard Stripe
2. Configurer le webhook Stripe → `https://rami.ai-mpower.com/api/webhooks/stripe`
3. Récupérer le `STRIPE_WEBHOOK_SECRET` live

### Priorité 5 — Pointer le DNS

```
CNAME rami.ai-mpower.com → cname.vercel-dns.com
```

### Priorité 6 — Smoke tests post-deploy

```bash
npm run smoke-test
# Vérifie : /api/health, auth flow, onboarding, dashboard
```

### Priorité 7 — Nettoyer les worktrees

```powershell
# Depuis Social_Media/Rami/
git -C Rami worktree list
# Supprimer chaque worktree manuellement :
git -C Rami worktree remove worktree-j1-auth --force
# ... répéter pour chaque worktree
```

---

## [CTX] — Contexte et métriques projet

| Métrique | Valeur |
|----------|--------|
| Durée marathon | ~10 jours (2026-03-11 → 2026-03-14 estimé) |
| Commits totaux | 126 |
| Branches créées | 23 (j1-auth → v11-ux) |
| Worktrees actifs | 0 (mais 20+ non nettoyés) |
| Lignes de code (src/) | ~15 000+ estimé |
| Fichiers TypeScript | 90+ dans src/lib/, 155 composants |
| Tables DB | 14 tables + 9 enums |
| Migrations SQL | 34 fichiers |
| Tests E2E | 15 fichiers Playwright |
| Tests unitaires | 2 fichiers Jest |
| Providers image | 5 (Nano Banana, Fal.ai, Imagen, Replicate, Together) |
| Providers vidéo | 5 (Veo, Runway, Kling, Luma, Wan) |
| Plateformes OAuth | 5 (Twitter, LinkedIn, Meta FB+IG, Pinterest) |
| Variables env requises | 60+ |

---

## [MEMO] — Information critique inter-sessions

### Architecture — Points non évidents

**MinIO ≠ Supabase Storage** : Amine utilise MinIO self-hosted sur cloud-station.io pour TOUS les uploads (logos, media, audios, docs). Le dossier `supabase/sql/create-storage-buckets.sql` est un artefact généré automatiquement — NE PAS l'exécuter.

**pg-boss IPv4** : Le worker pg-boss nécessite `SUPABASE_DB_POOLER_URL` (IPv4 pooler) et non l'URL directe IPv6. C'est configuré dans `src/lib/queue/pgboss.ts`. L'URL directe plante dans les environnements serverless.

**Stripe lazy init** : Le client Stripe est initialisé de manière lazy (dernier commit `009c026`) pour éviter les erreurs au build SSG. Pattern : `let stripe: Stripe | null = null; function getStripe() { return stripe ??= new Stripe(...) }`.

**OAUTH_TOKEN_ENCRYPTION_KEY** : Clé 32-byte hex pour AES-256. DOIT être générée avec `openssl rand -hex 32` et stockée dans les env vars Vercel. Si elle change, tous les tokens OAuth existants en DB deviennent illisibles.

**Leads — demo data** : La page leads affiche `DEMO_LEADS` si la table `leads` est vide en DB. Ce n'est PAS un bug — c'est un empty state intentionnel. Dès qu'un vrai lead est créé, les données réelles s'affichent.

**Competitors** : Page entièrement sur données mock (`COMPETITORS` hardcodé). Non connectée à une vraie source. Feature à implémenter si besoin.

**Nano Banana** : Premier provider dans la chain image (ultra-rapide, sans API key). Si le service est down, Fal.ai prend le relais automatiquement.

**React Compiler** : Next.js 16 active React Compiler. Les `useMemo` / `useCallback` manuels sont en conflit si les deps déclarées ne correspondent pas à ce que le compilateur infère. La solution est de supprimer les memoizations manuelles — le compilateur les gère automatiquement.

### Stack — Versions exactes

```
Next.js    : 16.1.6
React      : 19.2.3
Tailwind   : v4
Drizzle    : 0.45.1
Supabase   : @supabase/supabase-js 2.99.0
Zod        : 4.3.6
pg-boss    : 12.14.0
Stripe     : 20.4.1
Sentry     : @sentry/nextjs 10.43.0
next-intl  : 4.8.3
```

### Accès & Credentials

| Service | Accès |
|---------|-------|
| GitHub | https://github.com/Afristrat/Rami |
| Supabase Staging | rfndjbrwpdltfzvyreyv.supabase.co |
| Supabase Prod | uzmatxilmyepuhfnpfrv.supabase.co |
| MinIO | cst-minio-a255a4be-dab24dd5.az-csprod1.cloud-station.io |
| Vercel | lié au repo GitHub via `npm run deploy` |

### Commandes d'urgence (PowerShell — Windows)

```powershell
# Purger ralph-loop résiduel avant un agent
Remove-Item -Force -ErrorAction SilentlyContinue .claude\ralph-loop.local.md

# Lister les worktrees actifs
git -C "C:\Users\amans\OneDrive\Projets\Social_Media\Rami\Rami" worktree list

# Démarrer le dev server
cd "C:\Users\amans\OneDrive\Projets\Social_Media\Rami\Rami"
npm run dev

# Déployer en prod
npm run deploy

# Vérifier l'état qualité complet
npm run lint && npm run typecheck && npm audit
```

---

## [SCHEMA DB] — Référence rapide des tables

| Table | Usage | RLS |
|-------|-------|-----|
| `tenants` | Organisations clientes (multitenant) | ✅ |
| `users` | Sync avec Supabase auth.users | ✅ |
| `social_accounts` | OAuth connections chiffrées AES-256 | ✅ |
| `posts` | Posts créés (draft→published) | ✅ |
| `media` | Fichiers uploadés (MinIO paths) | ✅ |
| `transcriptions` | Fichiers audio + texte Whisper + verbatims | ✅ |
| `leads` | CRM leads par stage (Kanban) | ✅ |
| `lead_activities` | Historique actions par lead | ✅ |
| `documents` | Offres commerciales, rapports clients | ✅ |
| `audit_log` | Trail complet actions sensibles | ✅ |

**Tables admin (hors RLS tenant, accès super_admin uniquement)** :
- `ai_prompts_config` — templates prompts IA configurables
- `provider_keys` — BYOK (Bring Your Own Key) par tenant
- `visual_sessions` — sessions de génération avec métadonnées
- `generated_assets` — assets générés avec score Brand DNA

---

*RAMI by AI-MPower — "L'IA qui vise juste."*
*Passation générée le 2026-05-05 — Amine Mansouri Idrissi*
*Ce fichier représente l'état photographique du projet à cette date.*
