# Audit Total Implacable — RAMI

> **Objectif** : Lire CHAQUE fichier du projet ligne par ligne. Identifier CHAQUE bug, CHAQUE texte hardcodé, CHAQUE valeur qui devrait être une variable d'environnement, CHAQUE placeholder factice, CHAQUE faille de sécurité, CHAQUE violation des règles CLAUDE.md, CHAQUE incohérence, CHAQUE code mort. Zéro raccourci. Zéro estimation. Zéro "semble OK".

---

## RÈGLES ABSOLUES

1. Tu **LIS INTÉGRALEMENT** chaque fichier. Pas de grep, pas de survol, pas de "ce fichier est probablement OK".
2. Pour chaque fichier lu, tu produis un rapport structuré avec numéro de ligne exact.
3. Tu ne conclus **JAMAIS** "ce fichier est clean" sans avoir listé chaque élément vérifié.
4. Tu exécutes **TOUTES** les commandes de vérification demandées et reportes les résultats **EXACTS** (nombre de lignes, pas "quelques" ou "plusieurs").
5. Si un fichier a 500 lignes, tu lis 500 lignes. Pas 50.
6. Ce prompt existe parce que 5 reviews précédentes ont menti en validant à "100%". Chaque affirmation doit être prouvée.

---

## CATÉGORIE 1 — i18n (textes visibles par l'utilisateur)

### 1.1 Sources de données (constantes, schémas, configs)

Pour CHAQUE fichier ci-dessous, lire intégralement et vérifier que CHAQUE chaîne affichée dans l'UI passe par `useTranslations` ou `getTranslations` :

**Schémas Zod et constantes :**
- [ ] `src/lib/schemas/brand-dna.schema.ts` — SECTORS[], CULTURES[], COGNITIVE_OBJECTIVES[], VOICE_TONES[], CAUSSE_COLORS[], FONT_FAMILIES[], FONT_WEIGHTS[], SECTOR_COLOR_RULES{}, CULTURE_COLOR_NOTES{}, messages de validation Zod (.min/.max/.regex avec message custom)
- [ ] `src/lib/schemas/auth.schema.ts` — messages de validation Zod
- [ ] `src/lib/schemas/visual.schema.ts` — messages de validation Zod
- [ ] `src/lib/schemas/workflow.schema.ts` — messages de validation Zod (si existe)
- [ ] `src/lib/schemas/social-post.schema.ts` — messages de validation Zod (si existe)
- [ ] `src/lib/schemas/tenant.schema.ts` — messages de validation Zod (si existe)

**Configs :**
- [ ] `src/lib/config/campaign-types.ts` — labels, descriptions
- [ ] `src/lib/utils/causse-matrix.ts` — GESTALT_SHAPES (signal, usages), EMOTION_TO_COLOR_MAP
- [ ] `src/lib/billing/plans.ts` (ou équivalent) — noms de plans, descriptions, features
- [ ] `src/lib/services/brand-dna/prompt-compiler.ts` — DIRECTION_TEMPLATES (name, style, composition, emotion) — affichés dans DirectionGallery
- [ ] `src/lib/services/publishing/connection-tester.ts` — messages de status
- [ ] `src/lib/utils/dna-score.ts` — labels de niveaux (si affichés)

### 1.2 Composants UI

Pour CHAQUE fichier `.tsx` dans `src/components/`, vérifier CHAQUE :
- Texte entre balises JSX (`>texte</`)
- Attribut `placeholder="..."`
- Attribut `aria-label="..."`
- Attribut `title="..."`
- Attribut `alt="..."`
- Prop `label="..."`, `hint="..."`, `description="..."`
- Texte dans les template literals `` `...${var}...` ``
- Messages toast (`toast.success("...")`, `toast.error("...")`)
- Textes dans les tableaux/objets inline (`{ label: "..." }`)
- Textes passés comme props children
- Textes sr-only (screen reader)

**Lister CHAQUE dossier et CHAQUE fichier :**
- [ ] `src/components/brand-dna/*.tsx` — CHAQUE fichier
- [ ] `src/components/layout/*.tsx` — CHAQUE fichier
- [ ] `src/components/workflow/*.tsx` — CHAQUE fichier
- [ ] `src/components/visual/*.tsx` — CHAQUE fichier
- [ ] `src/components/auth/*.tsx` — CHAQUE fichier
- [ ] `src/components/scheduler/*.tsx` — CHAQUE fichier
- [ ] `src/components/settings/*.tsx` — CHAQUE fichier
- [ ] `src/components/billing/*.tsx` — CHAQUE fichier
- [ ] `src/components/admin/*.tsx` — CHAQUE fichier
- [ ] `src/components/approvals/*.tsx` — CHAQUE fichier
- [ ] `src/components/analytics/*.tsx` — CHAQUE fichier
- [ ] `src/components/leads/*.tsx` — CHAQUE fichier
- [ ] `src/components/documents/*.tsx` — CHAQUE fichier
- [ ] `src/components/transcriptions/*.tsx` — CHAQUE fichier
- [ ] `src/components/library/*.tsx` — CHAQUE fichier
- [ ] `src/components/presentations/*.tsx` — CHAQUE fichier
- [ ] `src/components/connections/*.tsx` — CHAQUE fichier
- [ ] `src/components/dashboard/*.tsx` — CHAQUE fichier
- [ ] `src/components/ui/*.tsx` — CHAQUE fichier custom (pas shadcn)
- [ ] `src/components/providers/*.tsx` — CHAQUE fichier

### 1.3 Pages

Pour CHAQUE `page.tsx` et `layout.tsx` dans `src/app/` :
- [ ] Metadata : utilise `generateMetadata()` avec `getTranslations` ? Ou `export const metadata` hardcodé ?
- [ ] Texte rendu côté serveur — passe par `getTranslations` ?
- [ ] Props texte passées aux composants enfants — hardcodées ?

### 1.4 Server Actions et API Routes

Pour CHAQUE fichier dans `src/lib/actions/` et `src/app/api/` :
- [ ] Messages d'erreur retournés au client (`{ error: "..." }`) — en quelle langue ?
- [ ] Messages de succès — en quelle langue ?
- [ ] Textes dans les emails envoyés (Resend) — traduits ?

---

## CATÉGORIE 2 — VALEURS HARDCODÉES QUI DEVRAIENT ÊTRE DES VARIABLES

### 2.1 URLs et endpoints

Chercher dans TOUT `src/` :
- [ ] URLs hardcodées (`https://...`) qui devraient être dans `.env` — APIs tierces, webhooks, CDN
- [ ] Ports hardcodés (`3000`, `9000`)
- [ ] Domaines hardcodés (`ai-mpower.com`, `supabase.co`)

### 2.2 Clés, tokens, secrets

Chercher dans TOUT `src/` :
- [ ] Clés API en clair (même des fausses comme `sk-ant-...`, `pk_test_...`)
- [ ] Tokens hardcodés
- [ ] Mots de passe par défaut
- [ ] DSN Sentry hardcodé

### 2.3 Limites et seuils

Chercher dans TOUT `src/` :
- [ ] Tailles max de fichiers hardcodées (`10 * 1024 * 1024`) — devraient être des constantes nommées ou des env vars
- [ ] Limites de rate limiting hardcodées
- [ ] Quotas hardcodés par plan (devraient venir de la config plans)
- [ ] Timeouts hardcodés
- [ ] Nombres magiques sans explication

### 2.4 Couleurs et styles

- [ ] Couleurs HEX hardcodées dans le code (`#7c3bed`, `#0A66C2`) qui ne viennent pas du design system (tailwind config)
- [ ] Tailles hardcodées qui devraient être responsive

---

## CATÉGORIE 3 — BUGS ET ERREURS LOGIQUES

### 3.1 TypeScript

Exécuter et reporter le résultat EXACT :
```bash
npx tsc --noEmit 2>&1
```
Chaque erreur doit être listée avec fichier + ligne + message.

### 3.2 Lint

Exécuter et reporter :
```bash
npm run lint 2>&1
```
Chaque erreur/warning avec fichier + ligne.

### 3.3 Code mort

Chercher dans TOUT `src/` :
- [ ] Imports non utilisés
- [ ] Variables déclarées mais jamais lues
- [ ] Fonctions exportées mais jamais importées ailleurs
- [ ] Composants créés mais jamais rendus
- [ ] Fichiers qui n'ont aucun import entrant

### 3.4 Gestion d'erreurs

Pour CHAQUE `try/catch` dans `src/` :
- [ ] Le `catch` fait-il quelque chose d'utile ? (pas juste `catch {}` vide)
- [ ] L'erreur est-elle loggée via le logger structuré ? (pas console.log)
- [ ] L'utilisateur reçoit-il un feedback ? (toast, message d'erreur)

### 3.5 Race conditions et state

- [ ] `useEffect` avec des dépendances manquantes ou incorrectes
- [ ] `useState` initialisé avec une valeur qui dépend de props sans `useEffect` de sync
- [ ] Appels `fetch` sans gestion de composant démonté (abort controller)
- [ ] `startTransition` utilisé correctement ?

### 3.6 Données mock / placeholder

Chercher dans TOUT `src/` :
- [ ] `MOCK_`, `mock_`, `DEMO_`, `FAKE_`, `TODO`, `FIXME`, `HACK`, `XXX`, `PLACEHOLDER`
- [ ] Données factices qui seront visibles en production (noms "Agence Alpha", "Brand Beta", etc.)
- [ ] IDs hardcodés (`"1"`, `"2"`, `"3"`)
- [ ] Dates hardcodées
- [ ] Montants hardcodés (`485.75`, `$0`)

---

## CATÉGORIE 4 — SÉCURITÉ

### 4.1 OWASP Top 10

- [ ] **A01 Broken Access Control** : Chaque Server Action vérifie `auth.getUser()` ? Chaque query filtre par `tenant_id` ?
- [ ] **A02 Cryptographic Failures** : Tokens OAuth chiffrés AES-256 avant stockage ? Clé de chiffrement via env var ?
- [ ] **A03 Injection** : Toutes les queries Supabase sont paramétrées ? Pas de SQL brut avec concaténation ?
- [ ] **A04 Insecure Design** : RLS activé sur TOUTES les tables ? Vérifier la migration `20260314000001_fix_rls_gaps.sql`
- [ ] **A05 Security Misconfiguration** : `SUPABASE_SERVICE_ROLE_KEY` jamais exposé côté client ? Headers de sécurité dans next.config.ts ?
- [ ] **A07 Authentication Failures** : Rate limiting sur login ? Session expiration configurée ?
- [ ] **A08 Data Integrity** : Stripe webhook signature vérifiée ? `eval()` ou `dangerouslySetInnerHTML` utilisé ?
- [ ] **A09 Logging** : Toutes les actions sensibles loggées dans audit_log ?
- [ ] **A10 SSRF** : Pas de `fetch()` avec URL fournie par l'utilisateur sans validation ?

### 4.2 Secrets dans le code

Exécuter :
```bash
grep -rn "sk-ant-\|sk_live\|sk_test\|whsec_\|re_\|phc_\|eyJ" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".env"
```

### 4.3 XSS

- [ ] Utilisation de `dangerouslySetInnerHTML` — chaque occurrence est-elle sanitisée ?
- [ ] Inputs utilisateur rendus dans le DOM sans échappement ?
- [ ] Prompt injection : les briefs utilisateur sont-ils sanitisés avant envoi au LLM ?

### 4.4 CORS et CSP

- [ ] `next.config.ts` — la CSP est-elle complète ? Domaines autorisés corrects ?
- [ ] CORS trop permissif sur les API routes ?

---

## CATÉGORIE 5 — PERFORMANCE

### 5.1 Bundles

- [ ] Imports dynamiques (`next/dynamic`) utilisés pour les composants lourds ?
- [ ] `"use client"` seulement quand nécessaire ? (pas sur des composants purement d'affichage)
- [ ] Images optimisées avec `next/image` ? Pas de `<img>` non optimisé (sauf logos dataURL) ?

### 5.2 Requêtes

- [ ] N+1 queries ? (boucle qui fait un appel DB par itération)
- [ ] Données chargées côté serveur quand possible ? (pas de `useEffect` + `fetch` pour des données statiques)
- [ ] Pagination sur les listes longues ?

### 5.3 Re-renders

- [ ] Composants coûteux mémorisés avec `React.memo` ou `useMemo` ?
- [ ] Callbacks stables avec `useCallback` pour les props de composants enfants ?
- [ ] `useWatch` (react-hook-form) utilisé de manière ciblée ? (pas de watch sur tout le formulaire)

---

## CATÉGORIE 6 — ACCESSIBILITÉ (a11y)

- [ ] Chaque `<img>` a un `alt` ?
- [ ] Chaque `<button>` a un texte ou un `aria-label` ?
- [ ] Chaque `<input>` a un `<label>` associé ?
- [ ] Navigation au clavier fonctionne ? (`tabIndex`, `focus-visible`)
- [ ] Contraste suffisant ? (pas de texte gris clair sur fond blanc)
- [ ] Formulaires : messages d'erreur associés aux champs via `aria-describedby` ?
- [ ] Modals : focus trap ? `aria-modal` ?
- [ ] Rôles ARIA corrects ? (`role="dialog"`, `role="tab"`, etc.)

---

## CATÉGORIE 7 — CONFORMITÉ CLAUDE.md

Relire le CLAUDE.md et vérifier CHAQUE règle :

- [ ] Jamais de secrets hardcodés → vérifié ?
- [ ] Lint + typecheck zéro erreur → vérifié ?
- [ ] RLS sur toutes les tables → vérifié ?
- [ ] Jamais de `any` TypeScript sans commentaire → vérifié ?
- [ ] Jamais de `console.log` en production → vérifié ?
- [ ] Validation Zod sur tous les inputs → vérifié ?
- [ ] Tests Playwright sur les parcours critiques → vérifié ?
- [ ] Variables d'environnement documentées dans `.env.example` → vérifié ?
- [ ] Pas de `eval()`, pas de `dangerouslySetInnerHTML` sans sanitisation → vérifié ?
- [ ] Uploads validés par type MIME → vérifié ?

---

## CATÉGORIE 8 — COHÉRENCE ET CONVENTIONS

### 8.1 Naming

- [ ] Fichiers composants en PascalCase ?
- [ ] Hooks custom commencent par `use` ?
- [ ] Server actions finissent par `Action` ?
- [ ] Types/interfaces en PascalCase ?
- [ ] Constantes en SCREAMING_SNAKE_CASE ?

### 8.2 Structure

- [ ] Chaque composant dans son propre fichier ?
- [ ] Pas de composants définis dans un fichier de page ?
- [ ] Imports relatifs vs alias `@/` — cohérent ?

### 8.3 Patterns

- [ ] Server Actions vs API Routes — usage cohérent ?
- [ ] State management — Zustand vs React state vs React Query — cohérent ?
- [ ] Error handling pattern — cohérent entre les actions ?
- [ ] Toast pattern — cohérent (sonner partout) ?

---

## COMMANDES DE VÉRIFICATION OBLIGATOIRES

Exécuter CHAQUE commande et reporter le résultat EXACT (nombre de lignes) :

```bash
# 1. TypeScript
npx tsc --noEmit 2>&1 | wc -l

# 2. Lint errors only
npm run lint 2>&1 | grep "error" | wc -l

# 3. console.log en production
grep -rn "console\." src/lib src/app --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v scripts/ | grep -v "eslint-disable" | wc -l

# 4. Locales hardcodées
grep -rn '"fr-FR"\|"en-US"\|"ar-SA"' src/ --include="*.ts" --include="*.tsx" | grep -v format-locale.ts | grep -v node_modules | wc -l

# 5. Textes français dans le code (hors messages/)
grep -rn "Choisissez\|Sélectionnez\|Veuillez\|Enregistrer\|Supprimer\|Modifier\|Annuler\|Confirmer\|Rechercher\|Ajouter\|Retour\|Suivant\|Précédent\|Fermer\|Ouvrir\|Télécharger\|Importer\|Exporter\|Optionnel\|Obligatoire\|Bienvenue\|Connexion\|Déconnexion\|Paramètres\|Sauvegarde\|Erreur\|Succès\|Attention" src/ --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v messages/ | grep -v "\.test\.\|\.spec\." | wc -l

# 6. Placeholders hardcodés (pas via {t()})
grep -rn 'placeholder="[A-Za-zÀ-ÿ]' src/ --include="*.tsx" | grep -v node_modules | grep -v 'placeholder={' | grep -v 'placeholder="••' | wc -l

# 7. aria-label hardcodés
grep -rn 'aria-label="[A-Za-zÀ-ÿ]' src/ --include="*.tsx" | grep -v node_modules | grep -v 'aria-label={' | wc -l

# 8. title hardcodés
grep -rn ' title="[A-Za-zÀ-ÿ]' src/ --include="*.tsx" | grep -v node_modules | grep -v 'title={' | wc -l

# 9. label: "texte" dans des objets (constantes non traduites)
grep -rn 'label:\s*"[A-Za-zÀ-ÿ]\|description:\s*"[A-Za-zÀ-ÿ]\|hint:\s*"[A-Za-zÀ-ÿ]\|message:\s*"[A-Za-zÀ-ÿ]' src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v messages/ | grep -v "\.test\.\|\.spec\." | wc -l

# 10. TODO/FIXME/HACK/XXX
grep -rn "TODO\|FIXME\|HACK\|XXX\|PLACEHOLDER" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l

# 11. Données mock
grep -rn "MOCK_\|mock_\|DEMO_\|FAKE_\|dummy\|placeholder" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "\.test\.\|\.spec\." | wc -l

# 12. any TypeScript
grep -rn ": any\|as any" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v "\.test\.\|\.spec\." | wc -l

# 13. Secrets potentiels
grep -rn "sk-\|pk_\|whsec_\|eyJh\|Bearer " src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v ".env" | grep -v "\.test\.\|\.spec\." | wc -l

# 14. dangerouslySetInnerHTML
grep -rn "dangerouslySetInnerHTML\|eval(" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l

# 15. Images non optimisées
grep -rn '<img ' src/ --include="*.tsx" | grep -v node_modules | grep -v "next/image" | grep -v "eslint-disable" | wc -l

# 16. Catch vides
grep -rn "catch\s*{" src/ --include="*.ts" --include="*.tsx" | grep -v node_modules | wc -l

# 17. Fichiers sans "use client" qui utilisent des hooks
grep -rln "useState\|useEffect\|useCallback\|useRef\|useTranslations\|useRouter\|usePathname" src/components/ --include="*.tsx" | while read f; do head -1 "$f" | grep -q "use client" || echo "MISSING: $f"; done

# 18. Clés i18n
node -e "['fr','en','ar','es','pt','de','tr','zh'].forEach(l=>{const j=JSON.parse(require('fs').readFileSync('messages/'+l+'.json','utf8'));const c=(o)=>Object.keys(o).reduce((a,k)=>a+(typeof o[k]==='object'&&o[k]!==null?c(o[k]):1),0);console.log(l+': '+c(j))})"

# 19. npm audit
npm audit --audit-level=moderate 2>&1 | tail -5

# 20. Taille du bundle (estimation)
du -sh src/ && find src/ -name "*.tsx" -o -name "*.ts" | wc -l
```

---

## FORMAT DE SORTIE OBLIGATOIRE

### Pour chaque fichier lu :
```
## [chemin/fichier.tsx] — X problèmes trouvés

| # | Ligne | Problème | Catégorie | Sévérité | Texte/Code exact |
|---|-------|----------|-----------|----------|-----------------|
| 1 | 42 | Label hardcodé FR | i18n | CRITIQUE | `label: "Identité"` |
| 2 | 87 | Catch vide | Bug | HIGH | `catch {}` |
```

### Tableau récapitulatif global :
| Catégorie | Critique | High | Medium | Low | Total |
|-----------|----------|------|--------|-----|-------|
| i18n | X | X | X | X | X |
| Sécurité | X | X | X | X | X |
| Bugs | X | X | X | X | X |
| Performance | X | X | X | X | X |
| a11y | X | X | X | X | X |
| Conventions | X | X | X | X | X |
| **Total** | **X** | **X** | **X** | **X** | **X** |

### Top 20 fichiers les plus problématiques :
| # | Fichier | Problèmes | Plus grave |
|---|---------|-----------|-----------|

### Actions correctives par priorité :
Numérotées, avec fichier exact et ligne exacte.

---

## INTERDICTIONS

- **INTERDIT** de dire "ce fichier est OK" sans preuve ligne par ligne
- **INTERDIT** de regrouper des fichiers par "ce dossier est clean"
- **INTERDIT** d'estimer un nombre — COMPTER exactement
- **INTERDIT** de conclure avant d'avoir exécuté les 20 commandes de vérification
- **INTERDIT** de sauter un fichier
- **INTERDIT** de considérer qu'un texte en anglais dans une interface arabe est "OK"
- **INTERDIT** de considérer qu'une constante avec `label: "texte"` est OK parce que le composant parent utilise `useTranslations`
- **INTERDIT** de valider un `catch {}` vide comme acceptable
- **INTERDIT** de valider un `any` TypeScript sans commentaire justificatif
- **INTERDIT** de valider des données mock visibles en production
- **INTERDIT** d'ignorer un `console.log` en production même dans un catch
- **INTERDIT** de considérer un message Zod hardcodé comme acceptable
- **INTERDIT** d'affirmer "100%" sans avoir vérifié chaque ligne

---

## NOTE FINALE

Ce prompt existe parce que 5 audits précédents ont produit des rapports affirmant "100% complété" alors que :
- Les objectifs cognitifs s'affichent en français en espagnol
- Les messages de validation Zod sont en français en arabe
- Les constantes SECTORS/CULTURES/VOICE_TONES sont hardcodées en français
- Des `catch {}` vides avalent des erreurs silencieusement
- Des données mock sont visibles en production

Chaque "100%" sans preuve est un mensonge. Ce prompt force la preuve.
