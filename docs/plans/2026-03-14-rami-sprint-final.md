# RAMI — Sprint Final : Plan de Match Complet

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Boucler RAMI pour la production — zéro texte hardcodé, zéro bug, toutes les features clés fonctionnelles, gaps Canva comblés.

**Architecture:** 38 User Stories séquencées en 6 phases. Chaque US est autonome et commitable. Priorité : critiques d'abord, puis gaps Canva, puis polish.

**Tech Stack:** Next.js 15 + TypeScript + Tailwind + shadcn/ui + Supabase + next-intl + Drizzle ORM

---

## PHASE 1 — BUGS CRITIQUES & DETTE TECHNIQUE (US 1-5)

### US-01 : Fix TypeScript syntax error admin dialog
**Priorité:** CRITIQUE — bloque le build
**Files:**
- Fix: `src/components/admin/edit-user-dialog.tsx:270`

**Action:** Remplacer `placeholder=t("minChars")` par `placeholder={t("minChars")}`

**Test:** `npm run typecheck` — zéro erreur

---

### US-02 : Remplacer tous les console.log/error/warn par le logger structuré
**Priorité:** HIGH — violation CLAUDE.md
**Files:**
- `src/app/actions/onboarding.ts`
- `src/lib/actions/admin.actions.ts`
- `src/lib/actions/visual.actions.ts`
- `src/lib/queue/publish-worker.ts`
- `src/lib/services/perplexity/benchmark.ts`

**Action:** Importer `log` depuis `@/lib/utils/logger` et remplacer chaque `console.error/warn` par `log({ level, module, action, metadata })`.

**Test:** `grep -r "console\." src/lib src/app --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "// console"` — zéro résultat (hors scripts/).

---

### US-03 : Remplacer toutes les locales hardcodées "fr-FR" par locale dynamique
**Priorité:** HIGH — casse l'i18n
**Files (23 instances, 14 fichiers):**
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(admin)/admin/dashboard/page.tsx`
- `src/app/api/queue/publish/route.ts`
- `src/components/admin/prompts-table.tsx`
- `src/components/admin/provider-keys-panel.tsx`
- `src/components/admin/tenants-table.tsx`
- `src/components/admin/users-table.tsx`
- `src/components/analytics/engagement-chart.tsx`
- `src/components/analytics/kpi-cards.tsx`
- `src/components/analytics/platform-donut-chart.tsx`
- `src/components/analytics/top-posts-table.tsx`
- `src/components/billing/billing-dashboard.tsx`
- `src/components/scheduler/PostDetailPanel.tsx`
- `src/components/scheduler/SchedulerCalendar.tsx`
- `src/components/scheduler/UpcomingPostsList.tsx`
- `src/components/settings/team-manager.tsx`
- `src/components/transcriptions/TranscriptionList.tsx`
- `src/components/workflow/Step7Schedule.tsx`

**Action:** Créer un helper `src/lib/utils/format-locale.ts` :
```typescript
import { useLocale } from "next-intl"
export function useFormatLocale() {
  const locale = useLocale()
  const map: Record<string, string> = {
    fr: "fr-FR", en: "en-US", ar: "ar-SA",
    es: "es-ES", pt: "pt-BR", de: "de-DE",
    tr: "tr-TR", zh: "zh-CN",
  }
  return map[locale] ?? "fr-FR"
}
```
Remplacer chaque `"fr-FR"` hardcodé par l'appel au hook dans les client components, et `getLocale()` dans les server components.

**Test:** `grep -rn '"fr-FR"' src/ --include="*.tsx" --include="*.ts" | grep -v node_modules` — zéro résultat.

---

### US-04 : Remplacer les textes French hardcodés dans brand-dna-form STEPS/TITLES/TIPS
**Priorité:** HIGH — visible dans l'UI
**Files:**
- `src/components/brand-dna/brand-dna-form.tsx` (lignes 42-97)

**Action:** Les arrays STEPS, STEP_TITLES, STEP_TIPS sont définis hors du composant (avant les hooks). Les transformer en fonctions appelées depuis l'intérieur du composant avec `useTranslations`. Les clés existent déjà dans `brandDna.form`.

**Test:** Switcher en anglais/arabe — les titres des étapes sont traduits.

---

### US-05 : Fix metadata hardcodé sur les pages restantes
**Priorité:** HIGH — SEO + i18n
**Files:**
- `src/app/(dashboard)/create/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`

**Action:** Utiliser `generateMetadata()` avec `getTranslations("metadata")` comme les autres pages.

**Test:** Vérifier `<title>` dans le HTML source en changeant de langue.

---

## PHASE 2 — BRAND DNA : GAPS CANVA (US 6-12)

### US-06 : Ajouter la hiérarchie typographique au Brand DNA
**Priorité:** HIGH — gap majeur vs Canva
**Files:**
- Modify: `src/lib/schemas/brand-dna.schema.ts` — ajouter `typography` au schéma
- Create: `src/components/brand-dna/typography-picker.tsx`
- Modify: `src/components/brand-dna/brand-dna-form.tsx` — ajouter section Typography dans l'étape Identité ou comme 5e étape
- Modify: `packages/db/schema/brand-dna.ts` — ajouter champ `typography` JSONB

**Structure Typography:**
```typescript
typography: z.object({
  heading: z.object({ family: z.string(), size: z.number(), weight: z.enum(["normal","bold","black"]) }),
  subheading: z.object({ family: z.string(), size: z.number(), weight: z.enum(["normal","bold"]) }),
  body: z.object({ family: z.string(), size: z.number(), weight: z.enum(["normal","bold"]) }),
}).optional()
```

**Référence Canva:** Section Polices avec hiérarchie Titre/Sous-titre/En-tête/Corps + police + taille + bold/italic.

---

### US-07 : Ajouter les catégories d'assets de référence
**Priorité:** HIGH — gap majeur vs Canva
**Files:**
- Create: `src/app/(dashboard)/dashboard/brand-dna/assets/page.tsx`
- Create: `src/components/brand-dna/brand-assets-manager.tsx`
- Modify: `src/components/layout/nav-config.ts` — sous-navigation Brand DNA

**Catégories (comme Canva):** Photos de référence, Illustrations, Icônes, Graphiques.
Stockage : MinIO avec metadata catégorie + tenant_id.

---

### US-08 : Extraction IA des brand guidelines uploadés (PDF/image)
**Priorité:** HIGH — différenciateur
**Files:**
- Create: `src/app/api/brand-dna/extract-guidelines/route.ts`
- Modify: `src/components/brand-dna/brand-dna-form.tsx` — composant `ExpertBrandUpload`

**Action:** Quand un PDF ou image est uploadé en mode expert :
1. Envoyer à Claude Haiku Vision
2. Extraire : couleurs dominantes (HEX), ton de voix, positionnement, secteur
3. Pré-remplir le formulaire Brand DNA avec les valeurs extraites

**Coût estimé :** ~$0.003 par extraction.

---

### US-09 : Page Brand DNA vue consultation — contenu dynamique IA
**Priorité:** HIGH — la page est vide actuellement
**Files:**
- Modify: `src/app/(dashboard)/dashboard/brand-dna/page.tsx`
- Create: `src/components/brand-dna/causse-insights.tsx` — explications neuropsychologiques
- Create: `src/components/brand-dna/persona-generator.tsx` — personas IA
- Create: `src/components/brand-dna/tone-preview-generator.tsx` — vrais exemples de posts

**Action:**
- Section Palette Causse : afficher l'effet neuropsychologique de chaque couleur, compatibilité sectorielle, adaptation culturelle
- Section Audience : générer 3 personas via Claude Haiku (~$0.001)
- Section Ton éditorial : générer un vrai exemple de post par plateforme au lieu de texte générique

---

### US-10 : Directives de marque (charte)
**Priorité:** MEDIUM — équivalent Canva Directives
**Files:**
- Create: `src/app/(dashboard)/dashboard/brand-dna/guidelines/page.tsx`
- Create: `src/components/brand-dna/brand-guidelines-editor.tsx`

**Action:** Éditeur rich-text simple (histoire de marque, valeurs, règles d'utilisation). Stocké en JSONB dans brand_dna.

---

### US-11 : Types de campagnes marketing dans le workflow visuel
**Priorité:** HIGH — gap Canva
**Files:**
- Modify: `src/components/visual/GenerateForm.tsx`
- Modify: `src/lib/services/brand-dna/prompt-compiler.ts`

**Action:** Ajouter un sélecteur de type de campagne avant le brief :
- Mode de vie, Story Instagram, Les mots d'abord, Listicle, Montage, Comparaison, Étude de cas, Encadré RP
Chaque type enrichit le prompt-compiler avec des contraintes spécifiques.

---

### US-12 : Palette accordéon — fix mode expert
**Priorité:** HIGH — bug confirmé par screenshot
**Files:**
- `src/components/brand-dna/color-palette-picker.tsx`

**Action:** Débugger pourquoi le mode accordéon ne s'active pas malgré `useExpertMode()`. Vérifier que le hook `useSyncExternalStore` se synchronise correctement entre le toggle et le picker.

**Test:** Activer mode expert, vérifier que la palette est en accordéon, sélectionner une couleur, vérifier auto-avance.

---

## PHASE 3 — WORKFLOW & PUBLISHING (US 13-18)

### US-13 : Mode expert pour le Workflow 7 étapes
**Priorité:** MEDIUM — demandé par l'utilisateur
**Files:**
- Modify: `src/components/workflow/WorkflowClient.tsx`

**Action:** Quand `isExpert === true`, afficher les 7 étapes en accordéons (même pattern que Brand DNA expert). Toutes accessibles librement.

---

### US-14 : Dashboard — remplacer les données mock par des requêtes réelles
**Priorité:** HIGH — mock visible en production
**Files:**
- Modify: `src/app/(dashboard)/dashboard/page.tsx` — `generatedCount = 128` → query DB

**Action:** Ajouter une server action `getDashboardStatsAction()` qui query `generated_assets`, `social_posts`, `brand_dna` pour le tenant.

---

### US-15 : Workflow d'approbation des designs
**Priorité:** MEDIUM — gap Canva
**Files:**
- Create: `src/app/(dashboard)/dashboard/approvals/page.tsx`
- Create: `src/components/approvals/approval-board.tsx`
- Create: `src/components/approvals/approval-card.tsx`
- Modify: `packages/db/schema/social-posts.ts` — ajouter statut `pending_approval`

**Action:** Page Kanban avec colonnes : En attente → Approuvé → Publié. Commentaires in-context sur chaque post. Notification au créateur quand approuvé/rejeté.

---

### US-16 : Publishing OAuth — tester les connexions réelles
**Priorité:** HIGH — core feature
**Files:**
- `src/lib/services/publishing/*.ts` — tous les services
- `src/app/api/oauth/*/route.ts` — tous les flows

**Action:** Smoke test chaque plateforme avec un compte de développement. Vérifier le cycle complet : authorize → callback → refresh → publish.

---

### US-17 : Calendrier — posts drag & drop pour replanifier
**Priorité:** MEDIUM
**Files:**
- Modify: `src/components/scheduler/CalendarGrid.tsx`

**Action:** Permettre le drag & drop d'un post d'une date à une autre pour changer le `scheduled_for`.

---

### US-18 : Analytics — scoring performance et benchmark
**Priorité:** MEDIUM — gap Canva
**Files:**
- Modify: `src/components/analytics/analytics-dashboard.tsx`

**Action:** Ajouter les métriques Canva-like : score de performance par post, coût par engagement (si disponible), benchmark sectoriel via Perplexity.

---

## PHASE 4 — QUALITÉ & ROBUSTESSE (US 19-26)

### US-19 : Tests Playwright — parcours auth
**Priorité:** HIGH — CLAUDE.md exige
**Files:**
- Create/Update: `tests/e2e/auth.spec.ts`

**Tests:** signup → email → dashboard, login valide, login invalide, session expirée, brute force, isolation tenant.

---

### US-20 : Tests Playwright — parcours Brand DNA
**Files:**
- Create/Update: `tests/e2e/onboarding.spec.ts`

**Tests:** wizard 3 étapes, upload logo, override palette, mode expert.

---

### US-21 : Tests Playwright — workflow création de post
**Files:**
- Create/Update: `tests/e2e/workflow.spec.ts`

**Tests:** workflow complet 7 étapes, génération visuelle, export ZIP.

---

### US-22 : Tests Playwright — publication
**Files:**
- Create/Update: `tests/e2e/publishing.spec.ts`

**Tests:** scheduling, publish now, token révoqué, char limit warning.

---

### US-23 : Tests Playwright — billing
**Files:**
- Create/Update: `tests/e2e/billing.spec.ts`

**Tests:** upgrade Free → Solo, paiement Stripe, quota atteint, annulation.

---

### US-24 : Tests Playwright — sécurité
**Files:**
- Create/Update: `tests/e2e/security.spec.ts`

**Tests:** XSS dans brief, injection SQL search, route sans auth, feature sans plan, API sans token.

---

### US-25 : npm audit — zéro vulnérabilité critique
**Action:** `npm audit --audit-level=critical` — fixer toutes les vulnérabilités critiques.

---

### US-26 : Lint + Typecheck — zéro erreur
**Action:** `npm run lint && npm run typecheck` — fixer toutes les erreurs.

---

## PHASE 5 — I18N FINITIONS & TRADUCTIONS RÉELLES (US 27-30)

### US-27 : Traduire les clés fallback (français) dans les 7 fichiers de langues
**Priorité:** HIGH — 1064 clés par locale sont en français fallback
**Files:**
- `messages/en.json`, `ar.json`, `es.json`, `pt.json`, `de.json`, `tr.json`, `zh.json`

**Action:** Lancer un agent par langue pour traduire toutes les clés qui sont encore en français (celles ajoutées après la création initiale des fichiers de langues).

---

### US-28 : RTL polish pour l'arabe
**Files:** Tous les composants layout

**Action:** Tester chaque page en arabe, corriger les alignements RTL cassés (icônes, marges, padding directionnels).

---

### US-29 : Ajouter les traductions pour les nouvelles features (US 6-18)
**Action:** Chaque nouvelle feature doit ajouter ses clés dans `fr.json` puis `node scripts/sync-translations.js`.

---

### US-30 : Valider toutes les langues — smoke test visuel
**Action:** Ouvrir chaque page dans les 8 langues, vérifier qu'aucune clé brute n'apparaît.

---

## PHASE 6 — DEPLOY & PRODUCTION (US 31-38)

### US-31 : Variables d'environnement production
**Action:** Vérifier que toutes les variables de `.env.example` sont configurées sur Vercel + Railway.

---

### US-32 : Migrations Supabase production
**Action:** `supabase db push` sur la DB de production. Vérifier les RLS policies.

---

### US-33 : Sentry configuration production
**Action:** Configurer le DSN Sentry réel, vérifier les alertes.

---

### US-34 : PostHog events tracking
**Action:** Vérifier que tous les events (signup, brand_dna_completed, visual_generated, post_published) sont trackés.

---

### US-35 : DNS rami.ai-mpower.com → Vercel
**Action:** Configurer le DNS, vérifier le certificat SSL.

---

### US-36 : Smoke test staging
**Action:** Déployer sur `rami-staging.ai-mpower.com`, parcourir tous les parcours critiques.

---

### US-37 : Deploy production
**Action:** `vercel deploy --prod`, vérifier les webhooks Stripe, confirmer Sentry actif.

---

### US-38 : Post-deploy monitoring
**Action:** Surveiller Sentry pendant 24h, vérifier les métriques PostHog, confirmer zéro erreur critique.

---

## MATRICE DE DÉPENDANCES

```
US-01 ──────────────────────────────────────┐
US-02 ──────────────────────────────────────┤
US-03 ──────────────────────────────────────┤──→ US-26 (lint+typecheck)
US-04 ──────────────────────────────────────┤
US-05 ──────────────────────────────────────┘

US-06 (typography) ─────────────────────────┐
US-07 (assets) ─────────────────────────────┤
US-08 (extract guidelines) ── dépend US-06 ─┤
US-09 (brand DNA view) ────────────────────┤──→ US-29 (traductions)
US-10 (directives) ────────────────────────┤
US-11 (types campagnes) ───────────────────┤
US-12 (fix palette accordion) ─────────────┘

US-13 (expert workflow) ────────────────────┐
US-14 (dashboard réel) ────────────────────┤
US-15 (approbations) ──────────────────────┤──→ US-29 (traductions)
US-16 (publishing test) ───────────────────┤
US-17 (calendar drag) ────────────────────┤
US-18 (analytics scoring) ─────────────────┘

US-19 à US-26 ──→ Peuvent être parallélisés
US-27 à US-30 ──→ Après US-29
US-31 à US-38 ──→ Séquentiels, après tout le reste
```

## ESTIMATION

| Phase | US | Effort estimé |
|-------|-----|--------------|
| Phase 1 — Bugs critiques | US 1-5 | 5 US rapides |
| Phase 2 — Brand DNA gaps | US 6-12 | 7 US structurantes |
| Phase 3 — Workflow & Publishing | US 13-18 | 6 US moyennes |
| Phase 4 — Tests & Qualité | US 19-26 | 8 US tests |
| Phase 5 — i18n finitions | US 27-30 | 4 US traductions |
| Phase 6 — Deploy | US 31-38 | 8 US ops |
| **Total** | **38 US** | — |
