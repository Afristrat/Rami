# RAMI — Agency OS by AI-MPower

> **"L'IA qui vise juste."**
> Chaque post est une flèche calibrée pour toucher l'émotion précise de votre audience cible.

RAMI est un **Agency OS SaaS B2B multitenant** qui génère du contenu social media psychologiquement calculé via la neuropsychologie des couleurs (Causse), la psychologie des formes (Gestalt), et un Brand DNA persistant par tenant enrichi par les analytics réels.

Il remplace en une seule plateforme : **Buffer + Canva + Notion + Otter.ai + Apollo + Zoho Invoice + Sprout Social**.

---

## Fonctionnalités

### Authentification & Onboarding
- Inscription, connexion, réinitialisation de mot de passe (Supabase Auth SSR)
- Wizard d'onboarding en 4 étapes :
  - Création du tenant (nom + slug auto-généré)
  - Upload logo + aperçu
  - Choix du plan (Free → Agency+)
  - Connexion des comptes réseaux sociaux (OAuth)
- Middleware de redirection onboarding obligatoire
- Isolation multitenant complète via RLS Supabase

### Brand DNA
- Formulaire complet en étapes : Identité, Audience, Style, Plateformes
- Psychologie des couleurs selon Jean-Gabriel Causse (matrice couleur × émotion × culture)
- Psychologie des formes Gestalt
- Upload logo avec analyse Vision AI (extraction couleurs HEX dominantes)
- Sélecteur de palette couleurs avec justification Causse
- Sélecteur de ton éditorial
- Objectifs cognitifs (Confiance, Urgence, Aspiration, Expertise, Communauté, Joie)
- Score DNA en temps réel (0–100) avec badge visuel
- Tests unitaires complets (23 cas de test)

### Scheduler — Calendrier de publication
- Vue calendrier mensuelle avec navigation mois par mois
- Posts planifiés affichés par couleur selon la plateforme
- Dialogue création de post avec sélecteur de date/heure
- Panneau de détail post (édition, suppression, changement de statut)
- Indicateurs de limite de caractères par plateforme (Twitter 280, Pinterest 500, LinkedIn 3000…)
- Liste des posts à venir et brouillons
- Résumé mensuel (posts planifiés, publiés, brouillons)
- Migration Supabase avec RLS tenant isolation

### Connexions OAuth — Réseaux Sociaux
- Page de gestion des connexions `/settings/connections`
- OAuth complet pour : **X (Twitter), LinkedIn, Meta (Facebook + Instagram), Pinterest**
- Flow OAuth : `/api/oauth/[platform]/authorize` → `/callback` → `/disconnect` → `/refresh`
- Chiffrement AES-256 des tokens au repos (jamais stockés en clair)
- Refresh automatique des tokens avant expiration
- Statuts visuels : connecté (vert) / token expiré (rouge) / non connecté (gris)
- Protection CSRF via state OAuth
- 24 tests Playwright E2E

### Visual Engine — Génération d'images IA
- **Fal.ai FLUX.1 [pro]** en provider primaire
- **Replicate** en fallback automatique (si timeout > 15s)
- **Together AI** en fallback secondaire
- **Prompt Compiler** : lit le Brand DNA du tenant et construit :
  - `positive_prompt` : couleurs HEX Causse + formes Gestalt + objectif cognitif + style
  - `negative_prompt` : watermark, flou, hors palette, générique
- 4 directions visuelles distinctes × 5 images chacune = 20 visuels par session
- Score Brand DNA affiché sur chaque image (0–100)
- Sélection manuelle des images
- Export ZIP des images sélectionnées
- Galerie par session avec historique

### Content Workflow — Création en 7 étapes
1. **Brief & Contexte** — Description du contenu à créer
2. **Format & Plateformes** — Sélection des plateformes cibles
3. **Génération texte** — Claude Haiku génère captions, hashtags et hooks par plateforme
4. **Génération visuelle** — Fal.ai via le Prompt Compiler Brand DNA
5. **Review & Sélection** — Révision et choix des contenus
6. **Approbation** — Validation avant publication
7. **Planification** — Envoi vers le Scheduler avec date/heure

- Stepper UI avec barre de progression
- Sauvegarde automatique à chaque étape
- Liaison complète entre Visual Engine et Scheduler

### Queue de Publication — pg-boss
- Worker Next.js (`src/instrumentation.ts`) démarré au boot du serveur
- Publication automatique des posts planifiés via les OAuth connections
- **Retry logic** : 3 tentatives avec backoff exponentiel
- Gestion des erreurs par plateforme avec messages explicites
- Mise à jour des statuts en DB : `draft → scheduled → publishing → published / failed`
- Services de publication dédiés : Twitter, LinkedIn, Facebook, Instagram, Pinterest
- Migration Supabase avec table `publication_jobs`
- 15 tests Playwright E2E

### Storage — Gestion des fichiers
- Upload vers **Supabase Storage** (buckets : logos, media, audios, docs)
- Resize automatique des images via **sharp** (WebP < 500 Ko)
- URLs CDN publiques signées
- Validation MIME type obligatoire (PNG, JPEG, WebP, SVG, MP4, MP3, PDF)
- Quota par plan :
  - Free : 500 Mo
  - Solo : 5 Go
  - Pro : 20 Go
  - Agency : 100 Go
  - Agency+ : illimité
- Barre de quota visuelle dans le dashboard
- Composant `FileUploader` drag-and-drop réutilisable

### Médiathèque
- Grille masonry de tous les fichiers du tenant
- Upload drag-and-drop depuis la médiathèque
- Filtres par type (image, vidéo, document)
- Recherche par nom de fichier
- Lightbox aperçu au clic
- Actions : supprimer, utiliser dans un post
- RLS strict — isolation tenant
- Migration Supabase avec table `media_assets`

### Billing — Facturation Stripe
- Page pricing publique `/pricing` avec 5 plans
- **Checkout Stripe Sessions** avec redirection sécurisée
- **Webhook** `/api/webhooks/stripe` pour sync abonnements en temps réel
- **Portail client Stripe** pour gérer les abonnements
- **Feature flags** vérifiés côté serveur uniquement (jamais côté client)
- **Modal upgrade** affiché automatiquement quand le quota est atteint
- **QuotaBadge** dans le header indiquant l'utilisation mensuelle
- Edge Function Supabase pour réconciliation Stripe quotidienne
- Tests unitaires plans + tests Playwright E2E billing

**Plans disponibles :**

| Plan | Prix | Tenants | Générations/mois |
|------|------|---------|-----------------|
| Free | $0 | 1 | 10 (watermark) |
| Solo | $59 | 3 | 150 |
| Pro | $149 | 10 | 500 |
| Agency | $399 | illimité | 2 000 |
| Agency+ | $699 | illimité | illimité |

### Analytics Dashboard
- **KPIs globaux** : posts publiés, reach total, taux d'engagement, top plateforme
- **Graphique Recharts** : engagement par plateforme sur 30 jours
- **Graphique camembert** : répartition des posts par statut
- **Top 5 posts** par engagement avec miniature et métriques
- Filtres par période (7j, 30j, 90j) et par plateforme
- Données temps réel via Supabase

### Settings & Gestion d'équipe
- **Profil** : nom, email, avatar
- **Équipe** : invitation membres par email, rôles (Admin, Éditeur, Viewer), révocation d'accès
- **Notifications** : préférences email par type d'événement
- **Danger Zone** : suppression du tenant avec confirmation explicite
- **Connexions** : gestion OAuth réseaux sociaux (voir section dédiée)

### Sécurité
- **RLS Supabase** activé sur toutes les tables sans exception
- **AES-256** pour les tokens OAuth au repos
- **CSP** complet dans `next.config.ts`
- **CSRF** protection sur les flows OAuth
- **Zod** validation sur tous les inputs (front + back)
- **Rate limiting** sur auth (5 tentatives / 15 min) et génération IA
- **Isolation tenant** stricte — tests cross-tenant automatisés
- **Sanitisation prompts LLM** anti-injection
- **HTTPS forcé** (Vercel + Railway)
- **OWASP Top 10** checklist complète

### Tests
- **Playwright E2E** : auth, onboarding, brand-dna, scheduler, connections, billing, analytics, settings, library, queue, workflow, security
- **Tests de sécurité** : XSS, isolation tenant, feature flags par plan
- **Tests unitaires** : score Brand DNA (23 cas), plans billing (275 cas)
- **Fixtures globales** : setup/teardown automatique avec comptes de test

---

## Stack Technique

| Couche | Technologie |
|--------|------------|
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Backend | Supabase (PostgreSQL + Edge Functions + Auth + Storage) |
| ORM | Drizzle ORM (type-safe, Postgres-natif) |
| Queue | pg-boss (Postgres-natif, retry automatique) |
| Validation | Zod (schemas partagés front/back) |
| State | React Hook Form + Zustand |
| Déploiement | Vercel (frontend) + Railway (workers) |
| CDN/Storage | Supabase Storage + Cloudflare R2 |
| Image IA | Fal.ai FLUX.1 → Replicate → Together AI (fallback chain) |
| LLM | Claude Haiku 4.5 (runtime) + Claude Sonnet 4.6 (Brand DNA) |
| Publishing | OAuth natif par plateforme + services dédiés |
| Billing | Stripe (Checkout + Webhooks + Portal) |
| Email | Resend |
| Monitoring | Sentry + PostHog |
| Tests | Playwright E2E + Vitest unit |

---

## Installation

```bash
# Cloner le repo
git clone https://github.com/Afristrat/Rami.git
cd Rami

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Remplir .env.local avec vos clés (voir section Variables d'environnement)

# Lancer en développement
npm run dev
```

## Variables d'environnement requises

```bash
# Supabase (obligatoire)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=                    # Pooler IPv4 recommandé

# Génération d'images (au moins FAL_KEY)
FAL_KEY=
REPLICATE_API_TOKEN=
TOGETHER_API_KEY=

# LLM
ANTHROPIC_API_KEY=

# Billing
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Chiffrement OAuth tokens
OAUTH_TOKEN_ENCRYPTION_KEY=         # 32 bytes hex

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Commandes

```bash
npm run dev          # Serveur de développement
npm run build        # Build production
npm run lint         # ESLint — zéro tolérance
npm run typecheck    # TypeScript — zéro tolérance
npm test             # Tests unitaires Vitest
npx playwright test  # Tests E2E Playwright
npm audit            # Audit vulnérabilités
```

---

## Architecture

```
rami/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, register, reset-password
│   │   ├── (dashboard)/     # Dashboard protégé (auth + onboarding)
│   │   │   ├── create/      # Visual Engine + Workflow 7 étapes
│   │   │   ├── dashboard/   # Analytics, Brand DNA, Calendar, Library
│   │   │   ├── billing/     # Gestion abonnement
│   │   │   └── settings/    # Profil, équipe, connexions, notifications
│   │   ├── api/
│   │   │   ├── oauth/       # Flows OAuth par plateforme
│   │   │   ├── queue/       # Endpoint trigger publication
│   │   │   └── webhooks/    # Stripe webhook
│   │   ├── onboarding/      # Wizard onboarding
│   │   └── pricing/         # Page publique pricing
│   ├── components/
│   │   ├── brand-dna/       # Formulaire, palette, score, logo
│   │   ├── scheduler/       # Calendrier, posts, dialog
│   │   ├── connections/     # OAuth connections UI
│   │   ├── visual/          # Galerie, carte image, score badge
│   │   ├── workflow/        # Steps 1-7
│   │   ├── analytics/       # KPIs, charts, filtres
│   │   ├── billing/         # Pricing cards, modal upgrade
│   │   ├── library/         # Médiathèque, lightbox
│   │   ├── storage/         # Uploader, quota bar
│   │   ├── settings/        # Profil, équipe, notifications
│   │   └── ui/              # shadcn/ui components
│   └── lib/
│       ├── services/
│       │   ├── image-generation/  # Fal.ai + Replicate + Together AI
│       │   ├── brand-dna/         # Prompt Compiler + Scorer
│       │   ├── publishing/        # Twitter, LinkedIn, Facebook, Instagram, Pinterest
│       │   ├── oauth/             # Config, state, refresh
│       │   └── storage/           # Client, resize, quota, MIME
│       ├── queue/                 # pg-boss + publish worker
│       ├── billing/               # Plans, feature flags, Stripe
│       ├── schemas/               # Zod schemas partagés
│       └── supabase/              # Client browser + server + service
├── supabase/
│   ├── migrations/          # SQL migrations (RLS inclus)
│   └── functions/           # Edge Functions (stripe-reconcile)
└── tests/
    ├── e2e/                  # 12 fichiers Playwright
    └── unit/                 # Tests unitaires Vitest
```

---

## Roadmap

### v1.0 — MVP (en cours)
- ✅ Auth + Onboarding
- ✅ Brand DNA complet
- ✅ Visual Engine (Fal.ai + fallback chain)
- ✅ Content Workflow 7 étapes
- ✅ Publishing OAuth (X, LinkedIn, Meta, Pinterest)
- ✅ Scheduler calendrier
- ✅ Storage + Médiathèque
- ✅ Billing Stripe
- ✅ Analytics Dashboard
- ✅ Settings + Team
- ⏳ Polish + Performance
- ⏳ Déploiement prod (rami.ai-mpower.com)

### v1.1 — Brand DNA enrichi
- ⏳ Connexion plateformes dans l'onboarding
- ⏳ Secteurs étendus + champ libre "Autre"
- ⏳ Objectifs cognitifs multi-sélection
- ⏳ Boutons IA contextuels (Générer / Améliorer)
- ⏳ Bouton "Pré-remplir" sur chaque section
- ⏳ Benchmark sectoriel via Perplexity
- ⏳ Interface Super Admin + BYOK

### v2.0 — Phase 2
- ⏳ Transcription réunions (Whisper)
- ⏳ Document Engine (offres commerciales, rapports PDF)
- ⏳ Lead Gen (Apollo.io)
- ⏳ Performance Loop (A/B testing automatique)
- ⏳ TikTok + WhatsApp
- ⏳ API publique (Agency+)
- ⏳ Mobile (React Native / Expo)

---

## Licence

Propriétaire — AI-MPower Consulting © 2026. Tous droits réservés.

---

*RAMI by AI-MPower — "L'IA qui vise juste."*
