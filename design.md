# RAMI — Design System & Brand DNA Compliance-by-Design

> **Loi de design.** Toute page, tout composant, tout moteur de création (présent
> ou futur) qui produit un artefact destiné à un tenant — visuel, carrousel,
> présentation, PDF, document, aperçu — **doit** appliquer l'identité de marque
> du tenant via le **Brand DNA Resolver**. Un artefact « joli mais hors-marque »
> est un bug, pas un compromis acceptable.

Ce document existe parce qu'une dette transverse a été prouvée (2026-06-25) : le
Brand DNA était **capturé** à l'onboarding mais **pas appliqué** visuellement
(couleurs d'accent hardcodées `#7C3BED`/`#F59E0B`/`#7C3AED`, logo jamais
réutilisé, formes ignorées, contraste deviné). Plus jamais.

---

## 1. Source unique de vérité : le Brand DNA Resolver

`src/lib/services/brand-dna/resolver.ts` → `resolveBrandIdentity(rawBrandDna, { tenantName })`.

C'est le **seul** point d'entrée autorisé pour obtenir des tokens de marque. Il
renvoie une `BrandIdentity` :

| Token | Garantie |
|---|---|
| `accent` (HEX) | Couleur de marque réelle (IDs Causse résolus) ou fallback sûr `#1D4ED8`. |
| `onAccent` (HEX) | **Texte lisible** sur `accent`, calculé par luminance (WCAG ≥ 4.5). |
| `palette` (HEX[]) | Palette complète du tenant. |
| `secondary` | 2ᵉ couleur de marque si disponible. |
| `hasBrandColor` | `false` si l'accent vient du fallback (pas une vraie couleur de marque). |
| `logoDataUrl` / `hasLogo` | Logo validé (png/jpeg/webp/svg, ≤ 1,5 Mo) ou `null`. |
| `monogram` | Initiales de repli — **toujours présent** (présence de marque garantie sans logo). |
| `shapeKey` + `shapeSignal` + `shapePromptKeywords` | Forme Gestalt dérivée du **secteur** (mapping exhaustif des 30 secteurs). |
| `headingFamily` / `bodyFamily` | Typo du tenant si renseignée. |
| `sector` / `cognitiveObjective` / `culture` / `tone` | Contexte pour le texte et les prompts. |

---

## 2. Règles NON négociables

1. **Zéro couleur d'accent hardcodée dans un renderer.** L'accent vient TOUJOURS
   de `resolveBrandIdentity(...).accent`. Une valeur par défaut au cas où le DNA
   est absent est gérée *dans le resolver*, pas dans le composant.
2. **Jamais de texte sur une couleur de marque sans `onAccent`.** N'utilise
   jamais une devinette `theme === "dark" ? noir : blanc` : prends `onAccent`.
3. **Présence de marque obligatoire** sur tout artefact composé par le code :
   logo si disponible, **sinon monogramme** (pastille `accent` + texte `onAccent`).
   La forme de la pastille suit `shapeKey` (cercle/carré/courbes/anguleux).
4. **Forme Gestalt = psychologie du secteur**, pas décoratif aléatoire. Dérivée
   via `sectorToShapeKey(sector)` (resolver) — source unique, jamais re-mappée
   localement.
5. **Images IA** : la palette HEX complète + la forme Gestalt + l'émotion +
   la culture sont injectées dans le prompt via `compileBrandDNAToPrompts`
   (`prompt-compiler.ts`). Un seul compilateur pour TOUS les moteurs d'images
   (workflow ET `/create`) — jamais de prompt « simplifié » parallèle.
6. **Logo dans une image IA = compositing**, jamais via le prompt (un modèle
   text-to-image ne reproduit pas un logo exact). Incruster en bout de chaîne.
7. **Conformité mesurée, jamais bloquante.** Le `Brand Preflight Score`
   (`preflight.ts`) produit un badge « Conformité marque X% ». Il ne bloque
   AUCUNE publication — le seul verrou reste l'approbation humaine.

---

## 3. Frontière : interface RAMI vs artefacts du tenant

- **L'interface de l'application RAMI** (dashboard, sidebar, boutons) reste le
  thème RAMI (violet/bleu) — identité produit cohérente, contraste maîtrisé.
  **NE PAS** repeindre tout le chrome aux couleurs du tenant (risque contraste +
  surface de bug + perte d'identité).
- **L'accent de marque s'applique** : (a) à tous les artefacts générés
  (visuels, carrousels, présentations, PDF) ; (b) aux **aperçus fidèles** de ces
  artefacts (pastille de marque, accent des slides). C'est « l'accent ciblé ».

---

## 4. Typographie — décision

Les rendus composés par le code (post-visuel via Satori/next-og, carrousel et
PDF via @react-pdf) utilisent **Noto Sans** embarqué, car c'est ce qui **garantit
les accents** (FR + AR) dans Satori/@react-pdf. La typo personnalisée du tenant
n'est donc **pas** imposée sur ces sorties tant qu'on ne peut pas embarquer une
police arbitraire sans casser la garantie d'accents. `headingFamily`/`bodyFamily`
sont exposés par le resolver et peuvent être utilisés dans les surfaces HTML
(web/aperçus) où la police se charge sans risque. Décision révisable si on ajoute
un pipeline de polices embarquées validé.

---

## 5. Checklist — nouvelle surface de création (compliance-by-design)

Avant de merger un nouveau moteur/format qui produit un artefact tenant :

- [ ] Il appelle `resolveBrandIdentity` (jamais `normalizeBrandDNA` seul pour le visuel).
- [ ] Son accent = `identity.accent` ; aucun HEX d'accent en dur.
- [ ] Le texte sur l'accent = `identity.onAccent`.
- [ ] Logo (`identity.logoDataUrl`) sinon monogramme (`identity.monogram`) rendu.
- [ ] La forme suit `identity.shapeKey`.
- [ ] Pour une image IA : prompt via `compileBrandDNAToPrompts`.
- [ ] Un `Brand Preflight Score` est calculé et exposé (badge, non bloquant).
- [ ] Le test de conformité `tests/unit/brand-compliance.test.ts` couvre le nouveau fichier.
- [ ] Gates : `tsc` 0, `lint` 0 (0 warning), `jest` vert. Browser-verify en prod.

---

## 6. Modules de référence

| Rôle | Fichier |
|---|---|
| Resolver (source unique) | `src/lib/services/brand-dna/resolver.ts` |
| Preflight Score | `src/lib/services/brand-dna/preflight.ts` |
| Compilateur prompt image | `src/lib/services/brand-dna/prompt-compiler.ts` |
| Matrice Causse / Gestalt | `src/lib/utils/causse-matrix.ts` |
| Post-visuel composé | `src/lib/services/post-visual/render.tsx` |
| Carrousel (React + PDF) | `src/components/carousel/CarouselSlide.tsx`, `src/lib/services/documents/carousel/carousel-pdf.tsx` |
| Présentations (PPTX + écran) | `src/lib/services/documents/pptx/deck-pptx.ts`, `src/components/presentations/SlideRenderer.tsx` |
| PDF offres/rapports | `src/lib/services/documents/pdf/branding.ts`, `PdfShell.tsx` |
| Garde anti-régression | `tests/unit/brand-compliance.test.ts` |
