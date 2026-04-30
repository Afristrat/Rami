# Audit QA Consensus — Failles d'Incohérence

> **Contexte** : Tu es un Senior QA Engineer spécialisé dans la localisation et la sécurité des données. Ton objectif est de détruire la confiance que j'ai dans le code suivant. Sois brutalement honnête.

---

## SCOPE

Ce prompt s'applique à CHAQUE fichier contenant des données affichées à l'utilisateur. Tu le lances par batch de fichiers liés.

### Batch 1 — Schémas et constantes
1. `src/lib/schemas/brand-dna.schema.ts`
2. `src/lib/schemas/auth.schema.ts`
3. `src/lib/schemas/visual.schema.ts`
4. `src/lib/config/campaign-types.ts`
5. `src/lib/utils/causse-matrix.ts`
6. `src/lib/utils/dna-score.ts`
7. `src/lib/services/brand-dna/prompt-compiler.ts`

### Batch 2 — Composants Brand DNA
8. `src/components/brand-dna/brand-dna-form.tsx`
9. `src/components/brand-dna/color-palette-picker.tsx`
10. `src/components/brand-dna/voice-tone-picker.tsx`
11. `src/components/brand-dna/typography-picker.tsx`
12. `src/components/brand-dna/ai-assist-button.tsx`
13. `src/components/brand-dna/prefill-section-button.tsx`
14. `src/components/brand-dna/dna-score-badge.tsx`
15. `src/components/brand-dna/logo-uploader.tsx`
16. `src/components/brand-dna/perplexity-benchmark-panel.tsx`
17. `src/components/brand-dna/brand-assets-manager.tsx`
18. `src/components/brand-dna/brand-guidelines-editor.tsx`

### Batch 3 — Layout et navigation
19. `src/components/layout/app-header.tsx`
20. `src/components/layout/sidebar-content.tsx`
21. `src/components/layout/user-menu.tsx`
22. `src/components/layout/notification-panel.tsx`
23. `src/components/layout/help-panel.tsx`
24. `src/components/layout/locale-switcher.tsx`
25. `src/components/layout/tenant-switcher.tsx`
26. `src/components/layout/mobile-nav.tsx`

### Batch 4 — Workflow, Visuels, Calendrier
27. `src/components/workflow/WorkflowClient.tsx`
28. `src/components/workflow/Step1Brief.tsx` à `Step7Schedule.tsx`
29. `src/components/visual/CreatePageClient.tsx`
30. `src/components/visual/GenerateForm.tsx`
31. `src/components/visual/DirectionGallery.tsx`
32. `src/components/scheduler/SchedulerCalendar.tsx`
33. `src/components/scheduler/PostDetailPanel.tsx`

### Batch 5 — Settings, Billing, Admin, Auth
34. `src/components/settings/*.tsx`
35. `src/components/billing/*.tsx`
36. `src/components/admin/*.tsx`
37. `src/components/auth/*.tsx`
38. `src/components/connections/*.tsx`

### Batch 6 — Pages et Actions serveur
39. `src/app/(auth)/**/*.tsx`
40. `src/app/(dashboard)/**/*.tsx`
41. `src/app/pricing/page.tsx`
42. `src/lib/actions/*.ts`
43. `src/app/api/**/*.ts`

### Référence
44. `messages/fr.json`
45. `messages/en.json`
46. `messages/ar.json`

---

## LES 3 TESTS

### Test 1 : L'Incohérence des Schémas (Zod vs i18n)

Pour chaque fichier `.schema.ts` et `.ts` contenant des constantes affichées :

**1A — Messages Zod hardcodés**

Pour chaque appel `.min()`, `.max()`, `.regex()`, `.refine()`, `.email()`, `.string()` avec un `message:` custom, vérifier :
- Le message utilise-t-il une clé `t("...")` ? → OK
- Le message est-il en dur (`"Le nom est requis"`, `"Email is required"`) ? → **CRITIQUE**

Exemple réel trouvé dans ce projet :
```typescript
// brand-dna.schema.ts — message Zod hardcodé en français
brandName: z.string().min(1, { message: "Le nom de la marque est requis" })
// ↑ CRITIQUE : affiché tel quel dans l'UI arabe/espagnole
```

**1B — Constantes avec texte affiché**

Pour chaque tableau/objet contenant `label`, `description`, `name`, `emotion`, `psycho`, `keywords`, `shortName`, `signal`, `usages` :
- La valeur est-elle un ID/clé de traduction utilisé avec `t(value)` dans le composant qui l'affiche ? → OK
- La valeur est-elle du texte brut affiché directement dans le JSX (`{obj.label}`) ? → **CRITIQUE**

Exemple réel trouvé dans ce projet :
```typescript
// brand-dna.schema.ts — constante affichée directement
COGNITIVE_OBJECTIVES = [
  { id: "confiance", label: "Vos clients vous font confiance avant de vous rencontrer", ... }
]
// ↑ CRITIQUE : ce label est rendu par {obj.label} dans brand-dna-form.tsx
// Il s'affiche en français quelle que soit la locale
```

Autre exemple :
```typescript
// brand-dna.schema.ts
VOICE_TONES = [
  { id: "expert", label: "Expert & Autoritaire", description: "Positionnement de leader...", keywords: ["données", "étude", ...] }
]
// ↑ CRITIQUE : label, description ET keywords sont affichés dans voice-tone-picker.tsx
```

Autre exemple :
```typescript
// brand-dna.schema.ts
CAUSSE_COLORS = [
  { id: "rouge", name: "Rouge Passion", emotion: "Urgence & énergie", psycho: "Le rouge augmente..." }
]
// ↑ CRITIQUE : name, emotion, psycho sont affichés dans color-palette-picker.tsx et brand-dna/page.tsx
```

**1C — Messages d'erreur dans les Server Actions**

Pour chaque `return { error: "..." }` dans les fichiers `src/lib/actions/*.ts` :
- Le message est-il en français ? → **HIGH** (affiché dans des toasts côté client)
- Le message est-il en anglais ? → **MEDIUM** (mieux mais pas traduit)

### Test 2 : Le "Ghost Mapping" des Enums

Pour chaque constante qui sert de source de données pour un `<select>`, une liste de boutons, ou un affichage de badges :

**2A — Présence dans les fichiers de traduction**

Vérifier que CHAQUE valeur de l'enum a une clé correspondante dans `fr.json` ET dans `ar.json`.

Exemple réel :
```typescript
// SECTORS dans brand-dna.schema.ts
export const SECTORS = ["finance", "tech", "santé", "agro", "luxe", ...]
```
Questions :
- Existe-t-il `brandDna.sectors.finance`, `brandDna.sectors.tech`, etc. dans `fr.json` ? → Si non, **BLOQUANT**
- Le composant qui affiche les secteurs (`<option>{s}</option>`) utilise-t-il `t("sectors." + s)` ou affiche-t-il `s` directement ? → Si direct, **CRITIQUE**

**2B — Chemins JSON manquants**

Pour chaque valeur manquante, donner le chemin JSON exact attendu :
```
MANQUANT : brandDna.sectors.finance dans ar.json
MANQUANT : brandDna.sectors.tech dans ar.json
MANQUANT : brandDna.cognitiveObjectives.confiance.label dans ar.json
```

### Test 3 : Localisation Arabe (RTL & Sens)

**3A — Concaténations dangereuses**

Chercher les patterns de concaténation :
```typescript
// DANGEREUX en RTL :
`${t("error")}: ${variable}`           // L'ordre est inversé en arabe
t("label") + " — " + t("sublabel")    // Le tiret est mal placé en RTL
`Score: ${score}%`                      // Le % doit être AVANT le nombre en arabe
```

**3B — Interpolation vs concaténation**

Vérifier que les messages avec variables utilisent l'interpolation i18n :
```typescript
// MAL :
`Votre score est de ${pct}%`
// BIEN :
t("scoreMessage", { pct })  // avec "scoreMessage": "Votre score est de {pct}%"
```

**3C — Directions CSS**

Dans les composants layout, vérifier les propriétés directionnelles :
- `left-X` → devrait être `start-X`
- `right-X` → devrait être `end-X`
- `ml-X` → devrait être `ms-X`
- `mr-X` → devrait être `me-X`
- `pl-X` → devrait être `ps-X`
- `pr-X` → devrait être `pe-X`
- `border-l` → devrait être `border-s`
- `border-r` → devrait être `border-e`
- `rounded-l` → devrait être `rounded-s`
- `rounded-r` → devrait être `rounded-e`
- `text-left` → devrait être `text-start`
- `text-right` → devrait être `text-end`

EXCEPTION : les propriétés sur des éléments purement décoratifs (gradients, shadows) peuvent rester physiques.

---

## FORMAT DE SORTIE (et rien d'autre)

```
[FICHIER] : src/lib/schemas/brand-dna.schema.ts
[ERREUR] : Ligne 42 | Hardcoded | `brandName: z.string().min(1, { message: "Le nom de la marque est requis" })` | Externaliser le message dans les fichiers de traduction ou utiliser une clé Zod custom
[ERREUR] : Ligne 87 | Hardcoded | `label: "Vos clients vous font confiance avant de vous rencontrer"` | Remplacer par un labelKey et traduire via t() dans le composant
[ERREUR] : Ligne 134 | Hardcoded | `name: "Rouge Passion"` | Idem — ce texte est affiché dans color-palette-picker.tsx ligne 99

[FICHIER] : src/components/brand-dna/brand-dna-form.tsx
[ERREUR] : Ligne 340 | Logic | `{obj.label}` affiche directement COGNITIVE_OBJECTIVES[].label | Le composant doit utiliser t("cognitiveObjectives." + obj.id + ".label")
[ERREUR] : Ligne 287 | Hardcoded | `<option value="">Choisissez un secteur...</option>` est traduit mais `{s}` ligne 289 affiche le secteur brut | Les valeurs du <select> doivent passer par t("sectors." + s)

[FICHIER] : messages/ar.json
[MANQUANT] : brandDna.sectors.finance — clé absente
[MANQUANT] : brandDna.cognitiveObjectives.confiance.label — clé absente
```

### Récapitulatif obligatoire en fin de rapport :

```
TOTAL ERREURS :
- CRITIQUE (hardcoded visible par l'utilisateur) : X
- BLOQUANT (clé manquante dans une locale) : X
- HIGH (message d'erreur non traduit) : X
- MEDIUM (direction CSS physique) : X
- LOW (concaténation potentiellement dangereuse en RTL) : X

FICHIERS LES PLUS AFFECTÉS :
1. [fichier] — X erreurs
2. [fichier] — X erreurs
```

---

## INTERDICTIONS

- **INTERDIT** de dire "ce fichier est OK" sans avoir listé chaque constante vérifiée
- **INTERDIT** de considérer qu'une constante avec `label: "texte français"` est OK parce qu'un autre composant utilise `useTranslations`
- **INTERDIT** de valider un message Zod hardcodé dans n'importe quelle langue
- **INTERDIT** d'ignorer les valeurs d'un `<select>` ou d'un tableau de boutons
- **INTERDIT** de considérer l'anglais comme une traduction acceptable pour l'arabe
- **INTERDIT** d'estimer — compter exactement

---

## POURQUOI CE PROMPT EXISTE

Un utilisateur a switché RAMI en espagnol. Il a vu :
- "Ils se projettent dans votre univers" (français) dans les objectifs cognitifs
- "Le secteur est requis" (français) dans les erreurs de validation
- "Épatez-nous" (français) dans un bouton
- "Pré-remplir avec IA" (français) dans un autre bouton

Pendant ce temps, 5 code reviews avaient validé "i18n 100% complète".

Ce prompt empêche que ça se reproduise.
