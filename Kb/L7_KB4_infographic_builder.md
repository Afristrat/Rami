# KB4 — INFOGRAPHIC PROMPT BUILDER + RECOMMANDATION INTELLIGENTE (Level 7)
## Système adaptatif de génération de prompts d'infographie

---

## INTELLIGENCE DE RECOMMANDATION

### Principe Level 7

Le Gem ne présente JAMAIS les 12 layouts × 38 styles × 8 palettes brut. Il pré-sélectionne 2-3 options pertinentes par choix, basées sur le profil + secteur + contenu du notebook.

### Protocole adaptatif selon le niveau

**Débutant :**
```
"Pour votre infographie, je recommande ce setup :
- Layout : [RECOMMANDÉ] — [raison en 1 phrase]
- Style : [RECOMMANDÉ] — [raison en 1 phrase]
- Couleurs : [celles du persona]
Ça vous convient, ou vous préférez explorer d'autres options ?"
```
→ 1 recommandation directe. L'utilisateur ajuste SI il veut.

**Intermédiaire :**
```
"Pour votre infographie, voici mes 3 recommandations :
Layout : A) [option 1] B) [option 2] C) [option 3]
Style : A) [option 1] B) [option 2] C) [option 3]
Lequel vous parle le plus ?"
```
→ 3 options par choix. Guidé mais avec du choix.

**Expert :**
```
"Voici ma recommandation : [full setup]. 
Catalogue complet : 12 layouts disponibles [liste], 38 styles en 5 catégories [liste].
Voulez-vous mon recommandé ou autre chose ?"
```
→ Recommandation + accès au catalogue complet.

### Matrice de recommandation automatique

| Profil + Contenu | Layout | Style | Palette |
|-----------------|--------|-------|---------|
| Entrepreneur + données chiffrées | Dashboard (L9) ou Avant/Après (L10) | TED Talk ou Minimalist | Persona ou Corporate Blue |
| Entrepreneur + processus | Processus (L3) ou Funnel (L11) | Minimalist ou Flat Design | Persona ou Startup Fresh |
| Consultant + méthodologie | Processus (L3) ou Roadmap (L4) | McKinsey ou Dashboard | Persona ou Corporate |
| Consultant + benchmark | Comparaison (L5) ou Dashboard (L9) | Data-Heavy ou Scientific | Persona ou Neutral Pro |
| Académique + résultats | Dashboard (L9) ou Timeline (L2) | Scientific ou Blueprint | Persona ou Academic |
| Académique + concepts | Mind map (L8) ou Pyramide (L6) | Scientific ou Whiteboard | Persona ou Clean Mono |
| Formateur + parcours | Processus (L3) ou Timeline (L2) | Sketchnote ou Whiteboard | Persona ou Pastel |
| Formateur + concepts | Mind map (L8) ou Pyramide (L6) | Anime Éducatif ou Kawaii | Persona ou Pastel |
| Marketing + conversion | Funnel (L11) ou Avant/Après (L10) | Magazine ou Pop Art | Persona OBLIGATOIRE |
| Marketing + comparaison | Comparaison (L5) | Pop Art ou Néon | Persona OBLIGATOIRE |
| Industriel + processus | Processus (L3) ou Timeline (L2) | Blueprint ou Technical | Persona ou Industrial |
| Industriel + KPIs | Dashboard (L9) ou Heatmap (L12) | Dashboard ou Corporate | Persona ou Steel |
| Fonctionnaire + bilan | Dashboard (L9) ou Timeline (L2) | Corporate ou Institutionnel | Drapeau/Institution |
| Fonctionnaire + projet | Roadmap (L4) ou Processus (L3) | Corporate ou Clean | Institutionnel |

### Qualité — Contraintes automatiques dans tout prompt infographie

Ces contraintes sont TOUJOURS intégrées dans le prompt final, quel que soit le choix :

```
MANDATORY QUALITY CONSTRAINTS:
- NO pie charts (use horizontal bars instead)
- NO 3D effects
- Minimum 40% whitespace
- Maximum 6 words per bullet point
- Maximum 3 bullet groups per section
- Integrated labels on all charts (no separate legends)
- Hero visual ≥ 1/3 of total surface
- Maximum 3 colors + 1 accent
- All text must be readable at arm's length
- Include source attribution in footer
```

### Recovery — Problèmes courants avec Nano Banana

| Problème | Cause probable | Fix |
|----------|---------------|-----|
| Texte illisible | Trop de contenu ou police trop petite | Réduire le contenu de 30%, augmenter la taille de police dans le prompt |
| Fautes d'orthographe | Limitation Nano Banana | Ajouter les corrections de la section 6 (Nano Banana corrections) |
| Couleurs incohérentes | Couleurs non spécifiées en hex | Toujours spécifier les codes hex exacts dans le prompt |
| Layout ignoré | Keyword trop vague | Utiliser les keywords exacts de la table des layouts |
| Style non respecté | Conflit entre style et contenu | Simplifier le contenu si le style est chargé, ou changer de style |
| Résultat trop chargé | Trop de données | Limiter à 5-7 data points maximum, prioriser |

---

## LOGIQUE DE CONSTRUCTION DU PROMPT INFOGRAPHIE

Le Gem guide à travers 6 choix AVANT de générer le prompt final. Chaque choix impacte directement le prompt.

**Prérequis (3 étapes complétées) :**
1. **Persona configuré (KB5)** — Les couleurs et le style alimentent les choix 3-4. Couleurs du persona en priorité.
2. **Notebook scanné** — Accès à l'intégralité du contenu.
3. **Stage 1 + Stage 2 complétés** — Le Strategy_Master alimente le contenu.

---

## CHOIX 1 : TYPE DE LAYOUT (12 options)

Demander : "Quel type de mise en page correspond le mieux à votre contenu ?"

| # | Layout | Quand l'utiliser | Keyword prompt EN |
|---|--------|-----------------|-------------------|
| L1 | Liste / Bullets | Énumérer 4-5 points clés | "bullet-point list layout with 4-5 key items" |
| L2 | Chronologie / Timeline | Montrer une évolution dans le temps | "horizontal/vertical timeline layout showing progression" |
| L3 | Processus / Étapes | Expliquer un processus en 5-7 étapes | "step-by-step process flow with 5-7 numbered stages" |
| L4 | Feuille de route / Roadmap | Planifier des phases futures | "strategic roadmap layout with phases and milestones" |
| L5 | Comparaison | Comparer 2-3 options côte à côte | "side-by-side comparison layout with 2-3 columns" |
| L6 | Hiérarchie / Pyramide | Montrer des niveaux d'importance | "hierarchical pyramid layout showing levels" |
| L7 | Circulaire / Cycle | Illustrer un processus cyclique | "circular cycle diagram showing continuous flow" |
| L8 | Carte mentale / Mind map | Organiser des idées autour d'un thème central | "central mind map with branching subtopics" |
| L9 | Dashboard / KPI | Afficher des métriques clés | "KPI dashboard layout with metrics and indicators" |
| L10 | Avant / Après | Montrer une transformation | "before-and-after split layout showing transformation" |
| L11 | Entonnoir / Funnel | Illustrer une conversion ou filtrage | "funnel diagram showing progressive filtering" |
| L12 | Heatmap / Carte thermique | Visualiser intensité ou distribution | "heatmap visualization showing intensity distribution" |

### Recommandation automatique par profil :
- **Entrepreneur pitch** → L5 (Comparaison) ou L10 (Avant/Après) ou L11 (Funnel)
- **Consultant méthodologie** → L3 (Processus) ou L4 (Roadmap)
- **Fonction publique rapport** → L9 (Dashboard) ou L2 (Timeline)
- **Formateur** → L3 (Processus) ou L8 (Mind map)
- **Marketing** → L11 (Funnel) ou L10 (Avant/Après)

---

## CHOIX 2 : STYLE VISUEL (38 styles en 5 catégories)

Demander : "Quel style visuel souhaitez-vous ? Voici les catégories disponibles :"

### Catégorie TECH (8 styles)
| Style | Keyword EN | Idéal pour |
|-------|-----------|------------|
| Dashboard SaaS | "clean SaaS dashboard style, sharp lines, tech aesthetic" | Startups tech, produits SaaS |
| Wireframe | "wireframe blueprint style, technical schematic look" | Architecture technique |
| Mode sombre / Dark mode | "dark mode interface style, glowing accents on dark background" | Tech audience, présentations screen |
| Electronic | "electronic circuit board style, neon traces on dark" | IoT, hardware, deep tech |
| Notion Kanban | "Notion-inspired Kanban board style, clean cards layout" | Gestion projet, productivité |
| Gamified | "gamified UI style, achievement badges, progress bars" | Engagement, formation tech |
| Holographique | "holographic futuristic style, translucent glowing elements" | Innovation, vision future |
| Pixel art | "retro pixel art style, 8-bit aesthetic" | Gaming, tech culture |

### Catégorie PRO (8 styles)
| Style | Keyword EN |
|-------|-----------|
| Corporate clean | "corporate clean style, professional blue-white palette" |
| TED Talk | "TED talk presentation style, bold statements, large typography" |
| McKinsey / Consulting | "management consulting slide style, structured frameworks" |
| Newspaper | "newspaper editorial layout, columns, serif headlines" |
| Magazine | "glossy magazine editorial style, photo-rich layout" |
| Tableau blanc / Whiteboard | "whiteboard sketch style, hand-drawn markers on white" |
| Mode sombre pro | "dark professional style, premium gold accents on black" |
| Flat design | "modern flat design style, solid colors, no gradients, clean icons" |

### Catégorie ANIMÉ (7 styles)
| Style | Keyword EN |
|-------|-----------|
| Manga / Anime | "anime manga illustration style, dynamic panels" |
| Anime Battle | "anime battle scene style, intense dramatic poses" |
| Comic book | "vintage comic book style, halftone dots, speech bubbles" |
| Cartoon moderne | "modern cartoon illustration style, rounded friendly shapes" |
| Chibi | "chibi kawaii style, cute miniature characters" |
| Claymation | "claymation clay modeling style, 3D sculpted characters" |
| Lego / Blocky | "Lego brick 3D style, blocky characters and structures" |

### Catégorie SCOLAIRE (7 styles)
| Style | Keyword EN |
|-------|-----------|
| Tableau noir / Chalkboard | "chalkboard chalk drawing style, white on dark green/black" |
| Sketchnote | "sketchnote hand-drawn style, doodles and handwriting" |
| Aquarelle | "watercolor painting style, soft blended colors" |
| Crayonné | "pencil crayon drawing style, natural hand-drawn texture" |
| Paper cutout / Collage | "paper cutout collage style, torn paper layers" |
| Cahier d'écolier | "school notebook style, ruled lines, margin notes" |
| Sticker / Autocollant | "sticker collection style, die-cut shapes, playful labels" |

### Catégorie ART / CLASSIC (8 styles)
| Style | Keyword EN |
|-------|-----------|
| Da Vinci | "Leonardo da Vinci Renaissance sketch style, sepia parchment" |
| Bauhaus | "Bauhaus design movement style, geometric primary colors" |
| Wes Anderson | "Wes Anderson symmetrical pastel style, centered composition" |
| Pop Art / Lichtenstein | "Roy Lichtenstein pop art style, bold outlines, Ben-Day dots" |
| Vintage poster | "vintage retro poster style, aged paper, classic typography" |
| Risograph | "Risograph printing style, grainy texture, limited color layers" |
| Urban Graffiti | "urban street art graffiti style, spray paint textures" |
| London Metro | "London Underground map style, clean colored lines, station dots" |

### Recommandation automatique par profil :
- **Entrepreneur B2B** → Corporate clean, TED Talk, Flat design
- **Startup tech** → Dashboard SaaS, Gamified, Mode sombre
- **Consultant** → McKinsey, Whiteboard, TED Talk
- **Fonction publique** → Corporate clean, Flat design, Newspaper
- **Formateur** → Sketchnote, Whiteboard, Aquarelle
- **Marketing** → Magazine, Pop Art, Animé
- **Audience enfants** → Lego, Aquarelle, Cartoon, Chibi

---

## CHOIX 3 : PALETTE COULEURS (8 options)

| # | Palette | Keyword EN | Quand |
|---|---------|-----------|-------|
| C0 | Auto (selon style) | "" (ne pas spécifier) | Par défaut |
| C1 | Corporate (bleu/blanc) | "corporate blue and white color palette" | B2B, institutionnel |
| C2 | Chaud (orange/rouge/ocre) | "warm color palette with orange, red, and ochre tones" | Énergie, passion |
| C3 | Pastel (doux) | "soft pastel color palette, gentle and reassuring" | Bien-être, éducation |
| C4 | Néon (futuriste) | "neon glowing colors on dark background" | Tech, innovation |
| C5 | Naturel (vert/marron) | "natural earthy palette with green, brown, and beige" | Écologie, bio, agriculture |
| C6 | Monochromatique | "monochromatic single-hue palette with value variations" | Élégance, simplicité |
| C7 | Vives (fond blanc) | "vibrant bold colors on clean white background" | Impact, jeune audience |

---

## CHOIX 4 : FORMAT / ASPECT RATIO (4 options)

| # | Format | Dimensions | Keyword EN | Usage |
|---|--------|-----------|-----------|-------|
| F1 | 16:9 Paysage | 1920x1080 | "16:9 landscape format" | Présentations, écran |
| F2 | 1:1 Carré | 1080x1080 | "1:1 square format" | Instagram, LinkedIn |
| F3 | 9:16 Portrait | 1080x1920 | "9:16 portrait/vertical format" | Mobile, Pinterest, Stories |
| F4 | A4 Impression | 2480x3508 | "A4 printable format" | Documents imprimés |

**Note** : L'aspect ratio n'est effectif que dans Gemini/Nano Banana direct. Dans NotebookLM Studio, le format est prédéfini.

---

## CHOIX 5 : NIVEAU DE DÉTAIL (3 options)

| Niveau | Description | Keyword EN |
|--------|------------|-----------|
| Minimaliste | Peu de texte, maximum d'espace, impact visuel | "minimalist with very sparse text and maximum whitespace" |
| Standard | Équilibre texte/visuel | "balanced level of detail with clear text and visuals" |
| Détaillé | Dense en information, données complètes | "detailed with comprehensive data and supporting text" |

---

## CHOIX 6 : CORRECTIONS NANO BANANA (options avancées)

| Option | Description | Ajout prompt EN |
|--------|------------|----------------|
| Correction typographie | Corrige les majuscules/minuscules dans les titres | "IMPORTANT: Use correct title case typography for ALL headings and labels. Capitalize the first letter of each significant word." |
| Vérification orthographe | Réduit les fautes dans les textes | "CRITICAL: Double-check ALL text for correct spelling before rendering. No typos allowed." |

---

## ASSEMBLAGE DU PROMPT FINAL

Le Gem assemble le prompt en combinant les choix de l'utilisateur avec les données extraites du Stage 2 (Strategy_Master). Structure d'assemblage :

```
Create a [ASPECT_RATIO] infographic about [SUBJECT] using [STYLE] style.

LAYOUT: Use a [LAYOUT_TYPE] structure.

CONTENT (from source analysis):
- Main title: [CONCLUSION_TITLE from P1]
- Key data points: [TOP 3-5 STATS from extraction]
- Story flow: [NARRATIVE_ARC from P2]
- Focal point: [ONE KEY ELEMENT from P3]

VISUAL STYLE:
- Style: [SELECTED_STYLE with full keyword]
- Color palette: [SELECTED_PALETTE with keyword]
- Detail level: [SELECTED_DETAIL_LEVEL]

AUDIENCE: [AUDIENCE_TYPE] — adapt visual complexity and language accordingly.

DESIGN RULES:
- ONE focal element that commands attention, everything else quiet
- Labels directly ON data (NO separate legends)
- Bar charts or dot plots ONLY (NEVER pie charts)
- Maximum contrast on all text
- Sans-serif fonts only
- Generous whitespace around all elements

[TYPOGRAPHY_CORRECTION if selected]
[SPELLING_CORRECTION if selected]

GENERATE NOW — show me [1 version / 3 style variations].
```

---

## EXEMPLES DE PROMPTS ASSEMBLÉS

### Exemple 1 : Entrepreneur cosmétique → Investisseurs
```
Create a 16:9 landscape infographic about "Morocco Natural Beauty Market Opportunity" using TED talk presentation style.

LAYOUT: Use a side-by-side comparison layout showing market gap.

CONTENT:
- Main title: "120M MAD Market, Zero Natural Players"
- Key data: Market size 120M MAD, 0% natural segment, 85% women prefer natural, 40% willing to pay premium
- Focal point: The "0% competition" statistic in large bold

VISUAL STYLE:
- Style: TED talk presentation style, bold statements, large typography
- Color palette: vibrant bold colors on clean white background
- Detail level: minimalist with very sparse text and maximum whitespace

AUDIENCE: Investors — high visual impact, data-driven, credibility-focused.

DESIGN RULES:
- ONE focal element: "0%" must dominate the visual
- Bar chart comparing market segments
- Maximum contrast, sans-serif fonts
- Generous whitespace

IMPORTANT: Use correct title case typography for ALL headings.

GENERATE NOW — show me 3 style variations.
```

### Exemple 2 : Fonction publique → Ministre
```
Create a 16:9 landscape infographic about "Digital Transformation Results: 3 Years" using corporate clean style.

LAYOUT: Use a KPI dashboard layout with metrics and indicators.

CONTENT:
- Main title: "73% Processing Time Reduction Achieved"
- Key data: 15,000 citizens trained, 70% employment rate, 45→12 days processing, 60% online requests
- Focal point: Before/after processing time comparison

VISUAL STYLE:
- Style: corporate clean style, professional blue-white palette
- Color palette: corporate blue and white color palette
- Detail level: balanced level of detail with clear text and visuals

AUDIENCE: Government minister — institutional tone, impact-focused, budget justification.

DESIGN RULES:
- ONE focal element: "73% reduction" as hero number
- Bar chart comparing before vs after
- Labels directly on data points
- Maximum contrast, professional typography

CRITICAL: Double-check ALL text for correct spelling.

GENERATE NOW.
```

### Exemple 3 : Formateur → Apprenants
```
Create a 9:16 portrait infographic about "5 Steps to Master NotebookLM" using sketchnote hand-drawn style.

LAYOUT: Use a step-by-step process flow with 5 numbered stages.

CONTENT:
- Main title: "From Document to 3 Professional Assets in 3 Hours"
- Steps: 1.Upload source 2.Extract (5 prompts) 3.Synthesize 4.Generate formats 5.Deploy
- Focal point: The transformation "1 document → 3 assets"

VISUAL STYLE:
- Style: sketchnote hand-drawn style, doodles and handwriting
- Color palette: vibrant bold colors on clean white background
- Detail level: balanced level of detail

AUDIENCE: Training participants — pedagogical, engaging, easy to follow.

DESIGN RULES:
- Each step visually distinct with icons
- Numbered progression clear
- Generous whitespace between steps

GENERATE NOW.
```

---

## MATRICE DE RECOMMANDATION RAPIDE

| Profil | Layouts recommandés | Styles recommandés | Palettes |
|--------|--------------------|--------------------|----------|
| Entrepreneur pitch | Comparaison, Avant/Après, Funnel | TED Talk, Flat design | Vives, Corporate |
| Startup tech | Dashboard, Processus | SaaS Dashboard, Mode sombre | Néon, Monochromatique |
| Consultant | Processus, Roadmap, Comparaison | McKinsey, Whiteboard | Corporate, Pastel |
| Fonction publique | Dashboard, Timeline | Corporate, Flat design | Corporate, Naturel |
| Formateur | Processus, Mind map | Sketchnote, Whiteboard | Pastel, Vives |
| Marketing | Funnel, Avant/Après | Magazine, Pop Art | Vives, Chaud |
| ONG / Impact | Avant/Après, Timeline | Aquarelle, Paper cutout | Naturel, Pastel |
