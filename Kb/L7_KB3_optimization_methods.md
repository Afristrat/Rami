# KB3 — 22 MÉTHODES D'OPTIMISATION + INTELLIGENCE DIAGNOSTIQUE (Level 7)
## Système de diagnostic contextuel et optimisation itérative

---

## INTELLIGENCE DIAGNOSTIQUE

### Protocole du Gem

Le Gem ne se contente PAS de mapper symptôme → méthode. Il suit ce protocole :

```
1. ÉCOUTER → L'utilisateur décrit le résultat (points forts ET faibles)
2. DIAGNOSTIQUER → Identifier la cause racine, pas juste le symptôme
3. QUESTIONNER → Poser 1 question de précision AVANT de recommander
4. PRIORISER → Recommander 1-2 méthodes maximum (pas une liste de 5)
5. PERSONNALISER → Adapter le prompt d'optimisation au contexte spécifique
6. VÉRIFIER → Après application, demander si le problème est résolu
```

### Diagnostic composé

Un symptôme peut avoir plusieurs causes. Le Gem identifie la cause PROBABLE et confirme :

| Symptôme | Cause possible A | Cause possible B | Question discriminante |
|----------|-----------------|-----------------|----------------------|
| "C'est ennuyeux" | Pas de narration (M2) | Pas d'ancrage (M1) | "C'est ennuyeux parce que c'est plat (pas d'histoire) ou parce qu'il n'y a pas de fait marquant dès le début ?" |
| "C'est pas crédible" | Manque de preuves (M4) | Données mal présentées (M13) | "Il manque des preuves, ou les données sont là mais mal formulées ?" |
| "C'est confus" | Jargon (M5) | Structure (M14) | "C'est confus à cause du vocabulaire ou de l'organisation ?" |
| "C'est moche" | Visuels faibles (M3) | Surcharge (M9) | "Il y a trop d'éléments, ou les éléments sont là mais pas beaux ?" |
| "C'est trop long" | Pas de priorisation (M14) | Pas de narration (M2) | "Il y a trop de contenu, ou le contenu traîne sans avancer ?" |

### Applicabilité par format

| Méthode | Podcast | Infographie | Présentation |
|---------|---------|-------------|-------------|
| M1 Anchoring | ✅ Hook audio | ✅ Pull-quote | ✅ Slide d'ouverture |
| M2 Story | ✅ Arc narratif | ⚡ Séquence visuelle | ✅ Flow des slides |
| M3 Visual | ❌ | ✅ Hero visual | ✅ Slide design |
| M4 Credibility | ✅ Citations audio | ✅ Data points | ✅ Evidence slide |
| M5 Clarity | ✅ Explication orale | ✅ Simplification | ✅ Pre-training slide |
| M6 Peak-End | ✅ Moments forts audio | ⚡ Layout emphasis | ✅ 3 slides clés |
| M7 Fluency | ✅ Rythme oral | ✅ Lisibilité texte | ✅ Lisibilité slides |
| M8 Conclusion Titles | ⚡ Transitions audio | ✅ Headers | ✅ Titres de slides |
| M9 Whitespace | ❌ | ✅ Respiration visuelle | ✅ Densité slides |
| M10 Labels | ❌ | ✅ Légendes intégrées | ✅ Graphiques slides |
| M11 Chart Type | ❌ | ✅ Choix graphiques | ✅ Choix graphiques |
| M12 Contrast | ❌ | ✅ Typographie | ✅ Typographie |
| M13 Positive Frame | ✅ Formulation | ✅ Framing données | ✅ Framing données |
| M14 Segment Chunker | ✅ Sections audio | ✅ Groupes visuels | ✅ Nombre d'éléments/slide |
| M15 Hero Image | ❌ | ✅ Image dominante | ✅ Visuel principal |
| M16 Social Proof | ✅ Citations nommées | ✅ Témoignages | ✅ Slide preuves |
| M17 Pre-Training | ✅ Intro définitions | ⚡ Encadré définitions | ✅ Slide dédiée |
| M18 Transition | ✅ Ponts audio | ⚡ Connexions visuelles | ✅ Transitions slides |
| M19 CTA | ✅ Closing audio | ✅ Footer/CTA | ✅ Dernière slide |
| M20 Vocal Emphasis | ✅ Clé pour podcast | ❌ | ❌ |
| M21 Distinctiveness | ❌ | ✅ Élément mémorable | ✅ Slide rupture |
| M22 Axis Zero | ❌ | ✅ Intégrité données | ✅ Intégrité données |

✅ = Directement applicable | ⚡ = Applicable avec adaptation | ❌ = Non applicable

### Priorisation par impact

SI l'utilisateur ne sait pas par où commencer, recommander dans cet ordre :
1. **M6 (Peak-End)** — Impact maximal, touche 3 moments clés
2. **M1 (Anchoring)** — Le hook détermine si l'audience continue
3. **M8 (Conclusion Titles)** — 2x recall pour un effort minimal
4. **M9 (Whitespace)** — Amélioration visuelle immédiate
5. **M5 (Clarity)** — Critique si l'audience est non-experte

### Mémoire des optimisations appliquées

Le Gem garde trace (dans la conversation) de ce qui a déjà été appliqué :
- NE PAS re-recommander une méthode déjà appliquée
- SI un problème persiste après optimisation → suggérer une méthode DIFFÉRENTE qui cible la même dimension
- Après 3+ optimisations → proposer un récapitulatif : "Vous avez optimisé [liste]. Voulez-vous un check global ?"

---

## QUAND UTILISER CES MÉTHODES ?

Ces méthodes s'appliquent APRÈS la génération initiale (Stage 3). Elles servent à :
- Renforcer l'impact d'un contenu déjà généré
- Corriger des faiblesses identifiées lors de la review
- Optimiser un format spécifique (podcast, infographie, présentation)

**Principe** : Chaque méthode cible une dimension spécifique. L'utilisateur n'a pas besoin de toutes les appliquer — seulement celles pertinentes pour son cas.

---

## INDEX DES 22 MÉTHODES

| # | Nom | Cible | Recherche | Quand l'utiliser |
|---|-----|-------|-----------|-----------------|
| M1 | The Anchoring Insight | Données | Kahneman anchoring + Borkin | L'ouverture manque d'impact |
| M2 | The Story Architect | Narration | McGill narrative + Kahneman peak-end | Le contenu est une liste, pas une histoire |
| M3 | The Visual Strategist | Visuels | Bar-Ilan image size + Von Restorff | Les visuels sont génériques ou oubliables |
| M4 | The Credibility Collector | Crédibilité | Stanford + Spiegel | Pas assez de preuves sociales |
| M5 | The Clarity Scout | Clarté | Mayer + Reber/Schwarz | Jargon ou complexité non adaptée |
| M6 | Peak-End Architect | Impact | Kahneman peak-end rule | Opening, peak et closing manquent de punch |
| M7 | Fluency Maximizer | Lisibilité | Rennekamp (2012) | Le texte est difficile à lire = moins crédible |
| M8 | Conclusion Title Rewriter | Titres | Borkin memorability | Titres descriptifs au lieu de conclusions |
| M9 | Whitespace Enforcer | Mise en page | Pracejus (JCR) | Slides trop chargées |
| M10 | Label Integrator | Graphiques | Cleveland perceptual research | Légendes séparées au lieu d'intégrées |
| M11 | Chart Type Corrector | Dataviz | Pie chart avoidance research | Pie charts ou mauvais types de graphiques |
| M12 | Maximum Contrast Enforcer | Typographie | Reber/Schwarz fluency | Texte peu contrasté = moins crédible |
| M13 | Positive Frame Flipper | Données | Positive framing research | Statistiques formulées négativement |
| M14 | Segment Chunker | Structure | Cognitive load theory | Trop d'info par section |
| M15 | Hero Image Maximizer | Visuels | Bar-Ilan PNAS 2022 | Images trop petites ou génériques |
| M16 | Social Proof Specififier | Crédibilité | Spiegel specificity | Témoignages vagues sans attribution |
| M17 | Pre-Training Slide Adder | Clarté | Mayer pre-training (d=0.85) | Audience a besoin de définitions avant le contenu |
| M18 | Transition Smoother | Flow | Narrative coherence | Passages brusques entre sections |
| M19 | Call-to-Action Sharpener | Closing | CTA research | Fin vague sans action claire |
| M20 | Vocal Emphasis Mapper | Podcast | Audio engagement | Podcast monotone, sans variation |
| M21 | Distinctiveness Maximizer | Mémorabilité | Higdon et al. (2025) | Rien ne se démarque visuellement |
| M22 | Axis Zero Enforcer | Dataviz | Data integrity | Axes de graphiques ne commençant pas à zéro |

---

## MÉTHODES DÉTAILLÉES

### [M6] PEAK-END ARCHITECT
**Quand l'utiliser** : Le deck est généré mais l'ouverture, le moment clé et la fin manquent d'impact.
**Science** : Kahneman a montré que les gens retiennent principalement le pic émotionnel et la fin d'une expérience.

```
OPTIMIZATION: Peak-End Redesign

Redesign only these three slides with DRAMATICALLY more visual impact:
1. Opening slide (hook)
2. Peak moment slide (highest intellectual/emotional point)
3. Closing slide (final call-to-action)

For these three slides specifically:
- Use LARGER typography
- Bolder imagery recommendations
- More dramatic design compared to functional middle slides
- More whitespace for emphasis
- Colors concentrated on these slides only

Consider: Run as TWO-PASS generation
- First: Full deck (functional)
- Second: These three key slides regenerated with maximum impact

Result: Opening hooks immediately, peak lands powerfully, closing unforgettable.
```

---

### [M7] FLUENCY MAXIMIZER
**Quand l'utiliser** : Le texte est difficile à lire, ce qui réduit sa crédibilité perçue.
**Science** : L'information facile à traiter est perçue comme plus vraie (Reber & Schwarz, 1999 ; Rennekamp, 2012).

```
OPTIMIZATION: Maximum Readability = Credibility

Regenerate with focus on processing fluency:

REQUIREMENTS:
- MAXIMUM contrast on all text (dark on light OR light on dark, nothing subtle)
- NO text below 24-point size
- Sans-serif fonts ONLY
- Generous whitespace around text elements
- Simple sentence structures using short, common words
- If hard to read → not believed

IMPLEMENT:
- Light gray text on white: NEVER (undermines credibility despite looking "sophisticated")
- Test by SQUINTING: if you can't read while squinting, redo it
```

---

### [M8] CONCLUSION TITLE REWRITER
**Quand l'utiliser** : Les titres des slides sont descriptifs ("Financial Results") au lieu d'être des conclusions ("Revenue Up 40%").
**Science** : Les titres formulés comme des conclusions sont 2x mieux mémorisés (Borkin, Harvard/MIT).

```
OPTIMIZATION: Rewrite ALL Titles as Conclusions

Review every slide title and rewrite as conclusion statement:

INSTEAD OF: "Q3 Performance" → USE: "Revenue Up 40% in Q3"
INSTEAD OF: "Customer Feedback" → USE: "95% Satisfaction Rate Achieved"
INSTEAD OF: "Market Analysis" → USE: "120M MAD Market, Zero Natural Players"

TEST: Read ONLY the titles in sequence.
Do they tell the complete story? If not, rewrite until they do.
Reading just the titles should communicate the full argument.
```

---

### [M9] WHITESPACE ENFORCER
**Quand l'utiliser** : Les slides sont trop chargées, trop d'éléments.
**Science** : L'espace blanc augmente la perception de qualité premium (Pracejus et al., Journal of Consumer Research).

```
OPTIMIZATION: Enforce Whitespace

Regenerate ensuring:
- MINIMUM 40% of each slide is empty space
- Maximum 3-5 elements per slide
- When a slide feels "sparse" — it's WORKING
- Whitespace is NOT wasted space. It's DESIGN space.

REDUCE each slide to:
- ONE core idea
- ONE focal point
- Supporting elements as quiet background
- Everything else: REMOVE IT
```

---

### [M10] LABEL INTEGRATOR
**Quand l'utiliser** : Les graphiques ont des légendes séparées au lieu d'étiquettes intégrées.
**Science** : Les labels intégrés directement dans les visuels réduisent la charge cognitive (Cleveland perceptual research).

```
OPTIMIZATION: Integrate All Labels

For every chart, graph, or visual:
- Place labels DIRECTLY on data points or bars
- REMOVE all separate legends
- REMOVE all keys that require eye movement between legend and data

WHY: Separate legends force audiences to look back and forth.
Direct labels = instant comprehension = more persuasive.
```

---

### [M11] CHART TYPE CORRECTOR
**Quand l'utiliser** : Le contenu contient des pie charts ou des types de graphiques inadaptés.
**Science** : Les bar charts sont dramatiquement meilleurs pour l'interprétation humaine que les pie charts.

```
OPTIMIZATION: Correct Chart Types

Review all data visualizations:
- Replace ALL pie charts with horizontal bar charts
- Use dot plots for correlations
- Use line charts ONLY for time-series data
- Ensure all axes start at zero

WHY pie charts fail: Humans are bad at comparing angles.
We're excellent at comparing lengths (bars).
Same data, dramatically better comprehension.
```

---

### [M13] POSITIVE FRAME FLIPPER
**Quand l'utiliser** : Les statistiques sont formulées négativement (problèmes évités, pertes prévenues).
**Science** : Le cadrage positif est plus persuasif à information égale.

```
REFRAME DATA (Pre-generation optimization):

For every statistic, reframe positively:

INSTEAD OF: "We reduced customer complaints by 40%"
USE: "Customer satisfaction increased 40%"

INSTEAD OF: "Only 5% failure rate"
USE: "95% success rate"

Both are accurate, but positive frame is more persuasive.

Apply to:
- Titles on data slides
- Statistics in speaker notes
- Achievement statements
- Outcome summaries
```

---

### [M15] HERO IMAGE MAXIMIZER
**Quand l'utiliser** : Les images sont trop petites ou génériques.
**Science** : Les grandes images pertinentes sont 1.5x mieux retenues (Bar-Ilan, PNAS 2022).

```
OPTIMIZATION: Maximize Hero Images

For key slides (opening, peak, closing, proof points):
- Images should fill SIGNIFICANT slide space (at least 50%)
- PRIORITY: Real people over abstract concepts
- SPECIFIC scenarios over generic stock photos
- ONE large image > multiple small ones

Example:
BAD: Small icon of a person + lots of text
GOOD: Full-bleed photo of real customer, text overlay minimal
```

---

### [M16] SOCIAL PROOF SPECIFIFIER
**Quand l'utiliser** : Les témoignages sont vagues ("great service", "many satisfied clients").
**Science** : Attribution complète (nom, titre, entreprise) + résultats spécifiques = +270% conversion (Spiegel Research).

```
OPTIMIZATION: Make Social Proof SPECIFIC

Replace ALL vague social proof:

VAGUE: "Our clients love our service"
SPECIFIC: "40 clients in Morocco, 95% satisfaction, including Maroc Telecom"

VAGUE: "Great results achieved"
SPECIFIC: "Revenue increased 40% in 6 months for ClientX (CEO Name, Company)"

Every testimonial MUST have: Full name, Title, Company, Specific metric.
If missing → either find it or remove the testimonial entirely.
Vague praise is WORSE than no praise (signals you have nothing specific to show).
```

---

### [M17] PRE-TRAINING SLIDE ADDER
**Quand l'utiliser** : L'audience a besoin de comprendre des termes techniques avant le contenu principal.
**Science** : Le pré-entraînement a un effect size de d=0.85, répliqué 23 fois sur 23 (Mayer). C'est l'un des effets les plus robustes en sciences de l'éducation.

```
OPTIMIZATION: Add Pre-Training Definitions

If content contains 3+ technical terms:
Add a DEFINITIONS SLIDE early (slide 2 or 3):

Format:
- 3-5 most important terms
- Each with ONE SENTENCE plain-language definition
- Visual metaphor if helpful (e.g., "API = a waiter carrying your order between kitchen and table")

WHY: When audiences encounter unfamiliar terms, they stop processing.
Pre-defining terms = smoother comprehension = more persuasive.
```

---

### [M19] CALL-TO-ACTION SHARPENER
**Quand l'utiliser** : La fin est vague, "Questions ?" ou "Merci" sans action claire.
**Science** : Un CTA spécifique convertit dramatiquement mieux qu'une fin ouverte.

```
OPTIMIZATION: Sharpen Final Call-to-Action

Rewrite closing slide to be SPECIFIC and ACTIONABLE:

BAD: "Questions?" / "Thank you" / "Contact us"
GOOD: "Schedule a 30-min demo this week → calendly.com/name"
GOOD: "Approve Phase 2 budget: 5M MAD → Impact: 300K citizens"
GOOD: "Download the framework → [specific URL]"

The last slide should tell the audience EXACTLY what to do next.
No ambiguity. One action. Clear next step.

NEVER end with "Questions?" or "Thank You" alone.
```

---

### [M21] DISTINCTIVENESS MAXIMIZER
**Quand l'utiliser** : Rien ne se démarque visuellement, tout est au même niveau.
**Science** : Un élément visuellement distinctif est mémorisé bien mieux que des éléments uniformes (Von Restorff effect ; Higdon et al., 2025 : distinctiveness > decoration).

```
OPTIMIZATION: Make Key Content VISUALLY DISTINCTIVE

For maximum memorability, make key information stand out through:
- SIZE contrast (key text significantly larger than supporting)
- COLOR contrast (accent color ONLY on most important element)
- SPATIAL isolation (key point surrounded by whitespace)
- TYPOGRAPHIC distinction (bold or different weight)

Distinctiveness matters more than decoration.
A distinctive word can be as memorable as an image.

For each slide:
- What is the ONE thing audiences must remember?
- Make that distinctly visible (large, colored, isolated)
- Everything else: quiet, supporting role
```

---

## MATRICE DE RECOMMANDATION PAR PROBLÈME

| Problème identifié | Méthodes recommandées |
|--------------------|-----------------------|
| "L'ouverture est faible" | M1 (Anchoring) + M6 (Peak-End) + M8 (Conclusion Titles) |
| "C'est ennuyeux, pas d'histoire" | M2 (Story) + M18 (Transitions) |
| "Visuellement fade" | M3 (Visual) + M15 (Hero Images) + M21 (Distinctiveness) |
| "Pas crédible" | M4 (Credibility) + M16 (Social Proof Specififier) |
| "Trop technique / confus" | M5 (Clarity) + M17 (Pre-Training) + M7 (Fluency) |
| "Slides trop chargées" | M9 (Whitespace) + M14 (Segment Chunker) |
| "Graphiques pas clairs" | M10 (Labels) + M11 (Chart Types) + M22 (Axis Zero) |
| "Stats pas persuasives" | M13 (Positive Frame) + M8 (Conclusion Titles) |
| "La fin est faible" | M6 (Peak-End) + M19 (CTA Sharpener) |
| "Podcast monotone" | M20 (Vocal Emphasis) + M6 (Peak-End) |

---

## SOURCES SCIENTIFIQUES COMPLÈTES

| Méthode | Recherche | Auteur | Effet |
|---------|-----------|--------|-------|
| Anchoring Insight | Anchoring bias | Kahneman | L'ancre définit le cadre de référence |
| Anchoring Insight | Memorability | Borkin (Harvard/MIT) | Titre en conclusion = 2x recall |
| Story Architect | Narrative retention | McGill University (2025) | 45% meilleure rétention |
| Story Architect | Peak-end rule | Kahneman | L'impression finale domine |
| Visual Strategist | Image size | Bar-Ilan (PNAS 2022) | Grandes images = 1.5x mieux |
| Visual Strategist | Isolation effect | Von Restorff | Éléments distinctifs retenus |
| Credibility | Social proof impact | Stanford Web Credibility | +270% conversion |
| Credibility | Named testimonials | Spiegel Research | Spécifique > vague |
| Clarity | Pre-training | Mayer (23/23 replications) | d=0.85 effect size |
| Clarity | Processing fluency | Reber & Schwarz (1999) | Facile à lire = perçu comme vrai |
| Peak-End | Experience memory | Kahneman | Peak & fin disproportionnés |
| Fluency | Readability = trust | Rennekamp (2012) | Fluency = crédibilité |
| Distinctiveness | Picture superiority | Higdon et al. (2025) | Distinctiveness > decoration |
| Whitespace | Product quality | Pracejus et al. (JCR) | Espace = qualité premium |
