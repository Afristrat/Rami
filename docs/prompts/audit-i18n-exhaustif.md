# Audit i18n Exhaustif — Prompt Implacable

> **Objectif** : Identifier CHAQUE chaîne de caractères visible par un utilisateur qui n'est pas passée par le système de traduction `next-intl`. Zéro tolérance. Zéro raccourci. Zéro estimation.

---

## RÈGLES DU JEU

1. Tu dois **LIRE INTÉGRALEMENT** chaque fichier listé. Pas un survol, pas un grep, pas une estimation. LIRE ligne par ligne.
2. Pour chaque fichier lu, tu produis un tableau avec : `ligne | texte trouvé | type (label/placeholder/error/hint/aria/title/comment-visible/constant/badge) | verdict (OK/HARDCODED/MIXED)`.
3. Un texte est **HARDCODED** s'il est en français, anglais, ou toute langue écrit directement dans le JSX, un tableau const, un objet de config, un message Zod, un placeholder, un aria-label, un title, un alt, un toast, ou un commentaire affiché à l'utilisateur (sr-only, etc.).
4. Un texte est **OK** uniquement s'il passe par `t("key")`, `tForm("key")`, `tCommon("key")` ou tout appel `useTranslations`.
5. Les noms propres (RAMI, Brand DNA, LinkedIn, etc.) et les valeurs techniques (HEX, URLs) sont exemptés.
6. Tu ne résumes JAMAIS un fichier par "ce fichier est OK" sans avoir listé chaque chaîne vérifiée.

---

## PHASE 1 — SOURCES DE DONNÉES (les plus dangereuses, les plus oubliées)

Ces fichiers contiennent des constantes affichées dans l'UI mais qui ne passent JAMAIS par i18n.

### 1.1 Schéma Brand DNA
**Fichier** : `src/lib/schemas/brand-dna.schema.ts`

Lire INTÉGRALEMENT. Chercher :
- [ ] `SECTORS` — tableau de secteurs. Chaque valeur est-elle une clé i18n ou du texte brut affiché dans un `<option>` ?
- [ ] `CULTURES` — tableau avec `label`, `flag`. Les labels sont-ils traduits ou hardcodés ?
- [ ] `COGNITIVE_OBJECTIVES` — tableau avec `label`, `description`, `shortName`, `visualStyles`. CHAQUE champ texte est-il traduit ?
- [ ] `VOICE_TONES` — tableau avec `label`, `description`, `keywords`. Chaque champ est-il traduit ?
- [ ] `CAUSSE_COLORS` — tableau avec `name`, `emotion`, `psycho`. Ces textes sont-ils traduits ?
- [ ] `FONT_FAMILIES`, `FONT_WEIGHTS` — les labels sont-ils traduits ?
- [ ] `SECTOR_COLOR_RULES` — contient `avoidReason`, `avoidAlternative`. Traduits ?
- [ ] `CULTURE_COLOR_NOTES` — contient des phrases entières par culture × couleur. Traduites ?
- [ ] Messages de validation Zod : `.min()`, `.max()`, `.regex()` — ont-ils des messages custom ? En quelle langue ?

### 1.2 Schéma Auth
**Fichier** : `src/lib/schemas/auth.schema.ts`

- [ ] Messages de validation Zod (email requis, mot de passe trop court, etc.) — en quelle langue ?

### 1.3 Schéma Visual
**Fichier** : `src/lib/schemas/visual.schema.ts`

- [ ] Messages de validation Zod — en quelle langue ?

### 1.4 Schéma Workflow
**Fichier** : `src/lib/schemas/workflow.schema.ts` (si existe)

- [ ] Messages de validation Zod — en quelle langue ?

### 1.5 Config Campaign Types
**Fichier** : `src/lib/config/campaign-types.ts`

- [ ] `labelKey` et `descriptionKey` utilisent-ils des clés i18n ou du texte brut ?
- [ ] `promptModifier` — c'est du texte technique pour l'IA, pas affiché. OK.
- [ ] `suggestedPlatforms` — noms de plateformes. OK si c'est des IDs.

### 1.6 Matrice Causse
**Fichier** : `src/lib/utils/causse-matrix.ts`

- [ ] `GESTALT_SHAPES` — les champs `signal`, `usages`, `prompt_keywords` sont-ils affichés dans l'UI ? Si oui, traduits ?
- [ ] `EMOTION_TO_COLOR_MAP` — les clés sont-elles des IDs ou du texte affiché ?
- [ ] `getRecommendedColors` — retourne-t-il du texte affiché ?

### 1.7 Plans et Billing
**Fichier** : `src/lib/billing/plans.ts` (ou équivalent)

- [ ] Noms de plans, descriptions, features — traduits ou hardcodés ?
- [ ] Limites et labels affichés dans les modals d'upgrade

### 1.8 Publishing Platform Config
**Fichier** : `src/lib/services/publishing/index.ts` ou tout fichier définissant les plateformes

- [ ] Labels des plateformes, descriptions — traduits ou hardcodés ?

---

## PHASE 2 — COMPOSANTS UI (fichier par fichier)

Pour CHAQUE fichier `.tsx` dans `src/components/`, vérifier :

### 2.1 Brand DNA
Lire CHAQUE fichier dans `src/components/brand-dna/` :
- [ ] `brand-dna-form.tsx` — CHAQUE chaîne dans le JSX, CHAQUE hint, CHAQUE placeholder, CHAQUE texte de bouton, CHAQUE label d'accordéon, CHAQUE message de succès/erreur, CHAQUE texte dans ExpertBrandUpload, CHAQUE texte dans StepRecap
- [ ] `color-palette-picker.tsx` — badges "Conseillé"/"Éviter", labels de rôle, descriptions
- [ ] `voice-tone-picker.tsx` — les tons sont-ils affichés via t() ou directement depuis VOICE_TONES ?
- [ ] `typography-picker.tsx` — labels, preview text
- [ ] `logo-uploader.tsx` — textes drag & drop, messages succès
- [ ] `ai-assist-button.tsx` — labels boutons, messages suggestion
- [ ] `prefill-section-button.tsx` — labels, messages countdown
- [ ] `dna-score-badge.tsx` — labels de score, niveaux
- [ ] `brand-dna-overview-client.tsx` — boutons, labels
- [ ] `perplexity-benchmark-panel.tsx` — sections, labels
- [ ] `brand-assets-manager.tsx` — tabs, upload zone, messages
- [ ] `brand-guidelines-editor.tsx` — sections, labels, placeholders
- [ ] `brand-dna-nav.tsx` — liens de navigation

### 2.2 Layout
Lire CHAQUE fichier dans `src/components/layout/` :
- [ ] `app-header.tsx`
- [ ] `sidebar-content.tsx`
- [ ] `sidebar-nav.tsx`
- [ ] `mobile-nav.tsx`
- [ ] `user-menu.tsx`
- [ ] `tenant-switcher.tsx`
- [ ] `notification-panel.tsx`
- [ ] `help-panel.tsx`
- [ ] `locale-switcher.tsx`
- [ ] `app-sidebar.tsx`

### 2.3 Workflow
Lire CHAQUE fichier dans `src/components/workflow/` :
- [ ] `WorkflowClient.tsx`
- [ ] `WorkflowStepper.tsx` (si existe)
- [ ] `WorkflowSidebar.tsx`
- [ ] `WorkflowActions.tsx`
- [ ] `Step1Brief.tsx` à `Step7Schedule.tsx` — CHAQUE étape
- [ ] Tout autre fichier dans ce dossier

### 2.4 Visual
Lire CHAQUE fichier dans `src/components/visual/` :
- [ ] `CreatePageClient.tsx`
- [ ] `GenerateForm.tsx`
- [ ] `DirectionGallery.tsx`
- [ ] `VisualCard.tsx`
- [ ] `MultiFormatPanel.tsx`
- [ ] `VideoGeneratorClient.tsx`
- [ ] Tout autre fichier dans ce dossier

### 2.5 Auth
Lire CHAQUE fichier dans `src/components/auth/` :
- [ ] `auth-card.tsx` — AuthHeader, AuthDivider, FormAlert, FieldError

### 2.6 Scheduler
Lire CHAQUE fichier dans `src/components/scheduler/` :
- [ ] `SchedulerCalendar.tsx`
- [ ] `CalendarGrid.tsx`
- [ ] `PostChip.tsx`
- [ ] `PostDetailPanel.tsx`
- [ ] `NewPostDialog.tsx`
- [ ] `MonthSummary.tsx`
- [ ] `UpcomingPostsList.tsx`
- [ ] `DraftPostsList.tsx`

### 2.7 Settings
Lire CHAQUE fichier dans `src/components/settings/` :
- [ ] `general-settings-client.tsx`
- [ ] `profile-form.tsx`
- [ ] `settings-nav.tsx`
- [ ] `notification-preferences.tsx`
- [ ] `danger-zone.tsx`
- [ ] `team-manager.tsx`
- [ ] `billing-settings-client.tsx`
- [ ] `connections-banners.tsx`
- [ ] Tout autre fichier

### 2.8 Billing
Lire CHAQUE fichier dans `src/components/billing/` :
- [ ] `billing-dashboard.tsx`
- [ ] `pricing-card.tsx`
- [ ] `upgrade-modal.tsx`
- [ ] `quota-badge.tsx`

### 2.9 Admin
Lire CHAQUE fichier dans `src/components/admin/` :
- [ ] `admin-nav.tsx`
- [ ] `tenants-table.tsx`
- [ ] `users-table.tsx`
- [ ] `providers-client.tsx`
- [ ] `provider-keys-panel.tsx`
- [ ] `prompts-table.tsx`
- [ ] `prompt-edit-dialog.tsx`
- [ ] `add-user-dialog.tsx`
- [ ] `edit-user-dialog.tsx`
- [ ] `edit-tenant-dialog.tsx`
- [ ] `provision-client-dialog.tsx`
- [ ] `fallback-chains-panel.tsx`
- [ ] `model-picker.tsx`
- [ ] `confirm-dialog.tsx`

### 2.10 Autres composants
- [ ] `src/components/approvals/approval-board.tsx`
- [ ] `src/components/approvals/approval-card.tsx`
- [ ] `src/components/analytics/*.tsx` — CHAQUE fichier
- [ ] `src/components/leads/*.tsx` — CHAQUE fichier
- [ ] `src/components/documents/*.tsx` — CHAQUE fichier
- [ ] `src/components/transcriptions/*.tsx` — CHAQUE fichier
- [ ] `src/components/library/*.tsx` — CHAQUE fichier
- [ ] `src/components/presentations/*.tsx` — CHAQUE fichier
- [ ] `src/components/connections/*.tsx` — CHAQUE fichier
- [ ] `src/components/dashboard/*.tsx` — CHAQUE fichier
- [ ] `src/components/ui/expert-mode-toggle.tsx`
- [ ] `src/components/providers/posthog-provider.tsx`

---

## PHASE 3 — PAGES (Server Components)

Pour CHAQUE fichier `page.tsx` dans `src/app/` :

- [ ] Vérifier que `generateMetadata()` utilise `getTranslations` (pas `export const metadata`)
- [ ] Vérifier que tout texte rendu côté serveur passe par `getTranslations`
- [ ] Vérifier les composants rendus — passent-ils des props texte hardcodées ?

Lister TOUS les `page.tsx` :
```
src/app/(auth)/login/page.tsx
src/app/(auth)/register/page.tsx
src/app/(auth)/reset-password/page.tsx
src/app/(auth)/reset-password/update/page.tsx
src/app/(dashboard)/dashboard/page.tsx
src/app/(dashboard)/dashboard/brand-dna/page.tsx
src/app/(dashboard)/dashboard/brand-dna/edit/page.tsx
src/app/(dashboard)/dashboard/brand-dna/assets/page.tsx
src/app/(dashboard)/dashboard/brand-dna/guidelines/page.tsx
src/app/(dashboard)/dashboard/calendar/page.tsx
src/app/(dashboard)/dashboard/library/page.tsx
src/app/(dashboard)/dashboard/analytics/page.tsx
src/app/(dashboard)/dashboard/leads/page.tsx
src/app/(dashboard)/dashboard/documents/page.tsx
src/app/(dashboard)/dashboard/transcriptions/page.tsx
src/app/(dashboard)/dashboard/transcriptions/[id]/page.tsx
src/app/(dashboard)/dashboard/competitors/page.tsx
src/app/(dashboard)/dashboard/tenants/page.tsx
src/app/(dashboard)/dashboard/invoices/page.tsx
src/app/(dashboard)/dashboard/approvals/page.tsx
src/app/(dashboard)/dashboard/video/page.tsx
src/app/(dashboard)/dashboard/create/page.tsx
src/app/(dashboard)/create/page.tsx
src/app/(dashboard)/create/video/page.tsx
src/app/(dashboard)/billing/page.tsx
src/app/(dashboard)/settings/**/*.tsx
src/app/(dashboard)/presentations/**/*.tsx
src/app/pricing/page.tsx
src/app/onboarding/page.tsx
src/app/(admin)/admin/**/*.tsx
```

---

## PHASE 4 — API ROUTES ET SERVER ACTIONS

### 4.1 Server Actions
Pour CHAQUE fichier dans `src/lib/actions/` :
- [ ] Messages d'erreur retournés au client — traduits ou hardcodés ?
- [ ] Messages de succès — traduits ou hardcodés ?
- [ ] Toast messages construits côté serveur

### 4.2 API Routes
Pour CHAQUE fichier dans `src/app/api/` :
- [ ] Messages d'erreur dans les `NextResponse.json()` — langue ?
- [ ] Messages de validation — langue ?

---

## PHASE 5 — FICHIERS DE TRADUCTION

### 5.1 Cohérence structurelle
- [ ] Exécuter `node scripts/check-untranslated.js` — reporter les chiffres exacts
- [ ] Vérifier que CHAQUE clé dans `fr.json` a une traduction RÉELLE (pas un fallback français) dans `en.json`
- [ ] Spot-check 20 clés aléatoires dans `ar.json` — sont-elles en arabe réel ou en français/anglais ?
- [ ] Spot-check 20 clés aléatoires dans `zh.json` — sont-elles en chinois réel ou en latin ?

### 5.2 Clés manquantes
- [ ] Pour chaque texte HARDCODED trouvé dans les phases 1-4, vérifier si une clé existe déjà dans `fr.json` mais n'est simplement pas utilisée
- [ ] Lister toutes les clés nécessaires à créer

---

## PHASE 6 — VALIDATION CROISÉE

### 6.1 Grep systématique
Exécuter ces commandes et reporter les résultats EXACTS (nombre de lignes, pas "quelques") :

```bash
# Textes français courants dans le code
grep -rn "Choisissez\|Sélectionnez\|Veuillez\|Optionnel\|Obligatoire\|Enregistrer\|Supprimer\|Modifier\|Annuler\|Confirmer\|Rechercher\|Ajouter\|Retour\|Suivant\|Précédent\|Fermer\|Ouvrir\|Télécharger\|Importer\|Exporter" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v messages/ | grep -v "\.test\." | grep -v "\.spec\."

# Placeholders non traduits
grep -rn 'placeholder="[A-Za-zÀ-ÿ]' src/ --include="*.tsx" | grep -v node_modules | grep -v 'placeholder={' | grep -v 'placeholder="••'

# Labels hardcodés dans JSX
grep -rn '>[A-ZÀ-Ÿ][a-zà-ÿ].*</\(p\|span\|h[1-6]\|label\|button\|div\)>' src/components/ --include="*.tsx" | grep -v node_modules | grep -v '{' | head -50

# aria-label hardcodés
grep -rn 'aria-label="[A-Za-zÀ-ÿ]' src/ --include="*.tsx" | grep -v node_modules | grep -v 'aria-label={'

# title hardcodés
grep -rn 'title="[A-Za-zÀ-ÿ]' src/ --include="*.tsx" | grep -v node_modules | grep -v 'title={' | grep -v '.svg'

# Messages d'erreur hardcodés dans les actions
grep -rn '"error":\|"success":\|error:' src/lib/actions/ --include="*.ts" | grep -v node_modules | grep '"[A-Za-zÀ-ÿ]'

# Textes dans les tableaux/objets const (les plus dangereux)
grep -rn 'label:\s*"[A-Za-zÀ-ÿ]\|description:\s*"[A-Za-zÀ-ÿ]\|hint:\s*"[A-Za-zÀ-ÿ]\|message:\s*"[A-Za-zÀ-ÿ]' src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v messages/ | grep -v "\.test\." | grep -v "\.spec\."
```

### 6.2 Vérification visuelle
Pour chaque langue supportée (fr, en, ar, es, pt, de, tr, zh), naviguer mentalement dans le flux :
1. Login → les labels sont-ils dans la bonne langue ?
2. Dashboard → les KPI labels, les noms de colonnes ?
3. Brand DNA edit → les steps, les labels de champs, les objectifs cognitifs, les tons de voix, les couleurs ?
4. Pricing → les noms de plans, les features, la FAQ ?
5. Settings → les sections, les labels ?

---

## FORMAT DE SORTIE OBLIGATOIRE

Le rapport DOIT contenir :

### Tableau récapitulatif
| # | Fichier | Ligne | Texte hardcodé | Type | Langue | Correction |
|---|---------|-------|---------------|------|--------|------------|

### Statistiques
- Nombre total de chaînes hardcodées trouvées : X
- Répartition par type : labels (X), placeholders (X), errors (X), constants (X), hints (X), aria (X), badges (X)
- Répartition par langue : français (X), anglais (X), mixte (X)
- Fichiers les plus problématiques : top 10

### Clés i18n à créer
Liste exhaustive des nouvelles clés nécessaires avec leur namespace et valeur française proposée.

### Actions correctives par priorité
1. CRITIQUE — constantes de schéma (COGNITIVE_OBJECTIVES, SECTORS, CULTURES, VOICE_TONES, CAUSSE_COLORS)
2. CRITIQUE — messages de validation Zod
3. HIGH — placeholders et hints dans les formulaires
4. HIGH — messages d'erreur dans les server actions
5. MEDIUM — aria-labels et titles
6. LOW — commentaires sr-only

---

## INTERDICTIONS

- **INTERDIT** de dire "ce fichier semble OK" sans l'avoir lu intégralement
- **INTERDIT** de regrouper des fichiers par "ce dossier est OK"
- **INTERDIT** d'estimer un nombre — compter exactement
- **INTERDIT** de conclure avant d'avoir exécuté TOUS les grep de la Phase 6
- **INTERDIT** de marquer une US comme "100% complète" sans preuve ligne par ligne
- **INTERDIT** de sauter un fichier parce qu'il "a déjà été reviewé"
- **INTERDIT** de considérer qu'un texte en anglais dans une interface arabe/espagnole est "OK"

---

## NOTE FINALE

Ce prompt existe parce que 5 code reviews précédentes ont validé à "100%" un code qui affiche "Ils se projettent dans votre univers" en espagnol et "Le secteur est requis" en arabe. Chaque validation "100%" sans preuve est un mensonge. Ce prompt force la preuve.
