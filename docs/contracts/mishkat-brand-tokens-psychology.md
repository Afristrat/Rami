# Contrat — `BrandTokens.psychology` (RAMI → Mishkāt)

> **Statut** : v1, 2026-06-29. Émis par RAMI (`src/lib/services/mishkat/psychology.ts`),
> à **consommer par le renderer Mishkāt**. C'est la pièce qui rend une vidéo
> « pensée pour l'impact » au lieu d'un template motion-text générique.

## Pourquoi

RAMI possède un moteur psychologique (matrice **Causse** couleur×émotion×culture +
**Gestalt** forme×secteur). Jusqu'ici, le pont vidéo n'envoyait qu'une palette
figée et le studio rendait un fond générique en **ignorant même `palette.bg`/`text`**.

Désormais RAMI calcule, depuis le Brand DNA (objectif cognitif + secteur + culture)
+ l'objectif/ton de la vidéo, un **spec calibré** et l'envoie dans
`BrandTokens.psychology`. Le renderer doit **piloter le rendu depuis ce spec**.

## Schéma

`BrandTokens.psychology` (optionnel ; si absent → fallback souverain du studio) :

```jsonc
{
  "target_emotion": "confiance",          // clé Causse : confiance|expertise|urgence|aspiration|creativite|communaute|joie|croissance|serenite
  "emotion_rationale": "Couleur préférée… Calibrage RAMI : émotion cible « confiance » → composition Blueprint + Scientifique.",
  "palette": {
    "bg":        "#0B1220",               // fond de base calibré à l'émotion — À UTILISER comme fond (plus de gradient bleu/orange générique)
    "text":      "#FFFFFF",               // couleur de TEXTE — lisible sur bg (contraste WCAG AA garanti par RAMI)
    "accent":    "#2563EB",               // accent de marque (réel) ou couleur d'émotion Causse
    "onAccent":  "#FFFFFF",               // texte lisible POSÉ SUR accent (puces, pastilles, CTA)
    "secondary": "#1E3A8A",
    "gradient":  ["#0B1220", "#1E3A8A"]   // 2 arrêts (fond → accent profond) pour un fond à dégradé calibré émotion
  },
  "gestalt": {
    "shape":    "carre",                  // cercle|carre|triangle|diagonales|courbes|grille — forme dominante du secteur
    "signal":   "Stabilité, honnêteté, ordre, fiabilité",
    "keywords": "geometric blocks, structured grid, architectural lines, balanced composition"
  },
  "composition_style": "Blueprint + Scientifique",  // direction de composition recommandée
  "culture": "maroc",                      // null si non défini — pour les codes locaux
  "networks_optimal": ["linkedin", "youtube", "facebook"]
}
```

## Ce que le renderer DOIT faire

1. **Fond** : utiliser `palette.bg` (ou le `palette.gradient` en dégradé) comme fond.
   Ne plus appliquer un dégradé fixe non calibré. Le `bg` encode déjà l'émotion
   (sombre & profond pour aspiration/expertise/confiance/urgence ; clair & chaud
   pour joie/communauté/sérénité/croissance).
2. **Texte** : utiliser `palette.text` pour tout texte posé sur `bg` — il est
   garanti lisible (WCAG AA). Pour le texte sur une pastille/CTA en `accent`,
   utiliser `palette.onAccent`. **Ne pas recalculer** ni deviner ces couleurs.
3. **Accent** : `palette.accent` pour les éléments d'emphase (mots-clés, traits,
   pastille de CTA, logo container).
4. **Forme (Gestalt)** : intégrer `gestalt.keywords` dans la direction visuelle
   (motifs/transitions/composition) — p.ex. `carre`→blocs structurés, `diagonales`
   →mouvement, `courbes`→fluidité. C'est la « psychologie des formes » du pitch.
5. **Composition** : honorer `composition_style` comme direction (densité,
   structure, rythme).
6. **Culture** : si `culture` ∈ {maroc, …}, surclasser les codes universels par
   les codes locaux (cf. matrice Causse).

## Garanties côté RAMI

- Toutes les couleurs sont des **HEX `#RRGGBB`** valides.
- `text`/`bg` et `onAccent`/`accent` respectent un **contraste WCAG AA ≥ 4.5**
  (vérifié par test unitaire `tests/unit/mishkat-brand-tokens.test.ts`).
- `target_emotion` ∈ l'ensemble fini ci-dessus ; `gestalt.shape` ∈
  {cercle, carre, triangle, diagonales, courbes, grille}.

## Dérivation (référence)

- **Émotion** : objectif cognitif du Brand DNA s'il est valide ; sinon ton vidéo
  (override fort : urgence/premium/cinematic/pedagogique/insolent) ; sinon objectif
  vidéo (awareness→confiance, acquisition→aspiration, proof→expertise,
  wrapped_shareable→joie, demo_day→aspiration) ; sinon `confiance`.
- **Palette** : `bg`/`gradient`/composition par émotion (table auditable dans
  `psychology.ts`) ; `accent` = couleur de marque réelle si présente, sinon couleur
  Causse de l'émotion ; overrides critiques (finance islamique→vert, santé+rouge→
  bordeaux).
- **Forme** : `resolveBrandIdentity` (mapping exhaustif des 30 secteurs → Gestalt).

> ⚠️ Tant que le renderer Mishkāt ne consomme pas ce bloc, RAMI l'envoie mais le
> rendu reste générique. **C'est l'étape (b) côté studio.**
