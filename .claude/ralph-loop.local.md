---
active: true
iteration: 2
session_id:
max_iterations: 50
completion_promise: null
started_at: "2026-03-11T02:40:50Z"
---

Implémente le wizard onboarding RAMI en 3 etapes : creation du tenant avec nom et slug, upload logo avec apercu, choix du plan tarifaire. Utilise shadcn-ui avec stepper. Le CLAUDE.md est dans le dossier parent Social_Media.

## Iteration 1 — DONE ✅

Commit: 46b9007

### Fichiers créés
- `src/app/onboarding/page.tsx` — Page onboarding avec guard auth + redirect si déjà onboardé
- `src/app/actions/onboarding.ts` — Server actions : createTenantOnboarding, checkSlugAvailability, uploadLogoToSupabase
- `src/components/ui/stepper.tsx` — Stepper custom (completed/active/pending states)
- `src/components/ui/input.tsx`, `label.tsx`, `card.tsx`, `badge.tsx`, `progress.tsx` — Via shadcn CLI
- `src/components/onboarding/OnboardingWizard.tsx` — Orchestration des 3 étapes avec état partagé
- `src/components/onboarding/StepTenant.tsx` — Étape 1 : nom + slug auto-généré + check disponibilité debounced
- `src/components/onboarding/StepLogo.tsx` — Étape 2 : drag & drop + aperçu + upload Supabase Storage
- `src/components/onboarding/StepPlan.tsx` — Étape 3 : sélection plan (Free/Solo/Pro/Agency/Agency+)

### Qualité
- TypeScript ✓ (0 erreurs)
- Lint ✓ (0 erreurs, 1 warning non-bloquant react-hook-form/compiler)
- Build Next.js 16 ✓

## Iteration 2 — EN COURS

Améliorations prévues :
- [ ] Middleware : rediriger automatiquement vers /onboarding si auth mais pas onboardé
- [ ] Dashboard placeholder pour le redirect post-onboarding
- [ ] Tests Playwright : onboarding.spec.ts (parcours complet)
