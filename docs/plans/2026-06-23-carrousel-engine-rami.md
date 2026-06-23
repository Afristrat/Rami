# Moteur de Carrousel natif RAMI (document LinkedIn) — Spec

```
Date    : 2026-06-23
Statut  : SPEC — design-first, exécution incrémentale
Décision: Amine délègue le « comment » → best practices, zéro cyclicité, bon du premier coup
Origine : le carrousel Hermès (HTML→Chromium) cassait les accents (publication), se publiait
          en LIEN (URL collée dans la légende) et avait une mise en page tronquée. RAMI devient
          le hub carrousel : génération + aperçu fidèle + PDF + publication en document natif.
```

## Principe directeur

Un **carrousel = un deck de slides typées rendues en composants React**. Conséquences :
- **Aperçu fidèle gratuit** : la slide affichée EST le composant React final (aucun pdf.js, aucun
  Chromium, aucune entorse CSP).
- **PDF via `@react-pdf/renderer`** (déjà dans la stack, pur JS) : mêmes slides en primitives
  @react-pdf, polices **Noto Sans** embarquées (`public/fonts/`) → **accents garantis**.
- **Publication = upload du PDF en DOCUMENT LinkedIn natif** (carrousel swipeable), jamais un lien.

## Format

- Ratio **4:5 (1080×1350)** — recommandé pour les documents LinkedIn (plus de surface verticale).
- Marges de sécurité généreuses (~7%). Typo à forte hiérarchie. Couleur d'accent = **Brand DNA**.
- Indicateur de progression (n° de slide). Pied de page constant (auteur / marque). **Zéro chrome
  navigateur** (le défaut Hermès : date + `file://` + n° imprimés par Chromium).

## Modèle de données — `src/lib/schemas/carousel.schema.ts` (Zod, parse-salvage par slide)

```
Carousel = { theme: "dark"|"light", accentHex: string, handle?: string, author?: string, slides: CarouselSlide[] }
CarouselSlide (discriminé par `type`) :
  - cover       { eyebrow?, title, subtitle?, author? }
  - point       { index?, heading, body?, bullets?: string[] }
  - stat        { value, label, context? }
  - quote       { text, attribution? }
  - comparison  { leftTitle, leftItems[], rightTitle, rightItems[] }
  - cta         { heading, body?, action? }
```

## Composants

- `src/components/carousel/CarouselSlide.tsx` — rend UNE slide en 4:5 (responsive, `aspect-ratio`),
  design soigné par type, accent Brand DNA, polices, safe-zone, n° de slide. **Source unique de
  vérité du design.**
- `src/components/carousel/CarouselPreview.tsx` — carrousel swipeable de `CarouselSlide` (réutilise
  les points/nav) → **aperçu #3**. Intégré au poste de pilotage `/dashboard/review` et au workflow.

## Étapes (incrémentales, chacune testable, gates verts)

1. **DESIGN D'ABORD** : schema + `CarouselSlide` + `CarouselPreview` + **route démo** `/carousel-demo`
   remplie avec le contenu « négociation » → **Amine valide le rendu** (comparaison directe au PDF
   Hermès). *Aucune autre brique tant que le design n'est pas validé.* ← anti-cyclicité.
2. **Génération** : `createCarouselAction` — LLM produit le deck JSON (prompts concis/punchy/MECE,
   **DÉFCON chiffres** : jamais inventer ; accents soignés), persiste (documents type=`carousel`).
3. **PDF** : `src/lib/services/documents/carousel/carousel-pdf.tsx` (@react-pdf, 1080×1350, Noto
   embarqué) → mêmes slides → PDF multi-pages, stocké **s3-rami** (CSP déjà OK).
4. **Publication LinkedIn document** : étendre `linkedin.ts` pour uploader le PDF en DOCUMENT natif
   (registerUpload `feedshare-document` / UGC `media` document) → carrousel swipeable.
5. **Poste de pilotage** : éditer le texte des slides + presets de correction + régénérer un slide
   ou tout, AVANT approbation (réutilise `correction-presets` + le verrou).

## Hors-scope (pour l'instant)

- Réparer le PDF Hermès existant (host minio tiers) — on le remplace, on ne le rafistole pas.
- Éditeur canvas drag-drop (positions libres) — le deck typé suffit et garantit la cohérence.

## « Done » étape 1 (design)

Route démo affiche le carrousel « négociation » en slides React 4:5, accents parfaits, design net
(hiérarchie, accent Brand DNA, n° de slide, pied de page), **aucune troncature, aucun chrome**,
sur desktop ET mobile. Amine valide → on passe à la génération.
```
