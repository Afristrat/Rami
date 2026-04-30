# RAMI — Prompts Stitch Complets
## « Charité ordonnée commence par soi-même »

> **Principe directeur** : RAMI prône le design neuropsychologique pour ses clients.
> Son propre UI DOIT être la preuve vivante de cette proposition.
> Chaque écran applique Causse (couleurs × émotions), Gestalt (formes × perception),
> et les 22 méthodes d'optimisation (KB3) pour un impact maximal.

---

## PALETTE RAMI (à inclure dans CHAQUE prompt)

```
PALETTE RAMI — Dark Mode Neuropsychologique

Fond principal  : #0A0A0F (noir profond — réduit fatigue cognitive, Causse)
Fond carte      : rgba(255,255,255,0.04) avec backdrop-blur-xl
Bordure carte   : rgba(255,255,255,0.08)
CTA principal   : gradient from #7C3AED (violet-600) to #2563EB (blue-600)
CTA hover       : gradient from #6D28D9 (violet-700) to #1D4ED8 (blue-700)
Accent positif  : #10B981 (vert émeraude — croissance, Causse)
Accent négatif  : #EF4444 (rouge — urgence, Causse)
Accent warning  : #F59E0B (ambre — attention)
Texte principal : #F8FAFC (blanc cassé — contraste max, fluency M7)
Texte secondaire: rgba(255,255,255,0.6)
Texte tertiaire : rgba(255,255,255,0.4)
Input fond      : rgba(255,255,255,0.06)
Input bordure   : rgba(255,255,255,0.08)
Input focus     : ring violet-500/50
Grille subtile  : rgba(255,255,255,0.02) — motif 40px

EFFETS :
- 3 blobs gradient (violet/bleu) en arrière-plan, blur 120px, opacity 0.15
- Cards : rounded-2xl (16px radius — Gestalt : courbes = accessibilité)
- Transitions : 200ms ease — fluency perceptuelle
- Typographie : Inter/Plus Jakarta Sans — fluency maximale (M7)

SIGNAUX NEUROPSYCHOLOGIQUES :
- Violet (#7C3AED) = créativité + premium + expertise (Causse)
- Bleu (#2563EB) = confiance + sécurité + professionnalisme (Causse)
- Gradient violet→bleu = transformation créative → résultat fiable
- Noir profond = sophistication + focus (réduit distractions)
- Vert émeraude = croissance + validation + succès
```

---

## STRUCTURE DU DOCUMENT

| # | Écran | Type Stitch | Priorité |
|---|-------|-------------|----------|
| 01 | Page de connexion | Forms | P0 |
| 02 | Page d'inscription | Forms | P0 |
| 03 | Onboarding Brand DNA — Étape 1 (Identité) | Forms/Wizard | P0 |
| 04 | Onboarding Brand DNA — Étape 2 (Audience) | Forms/Wizard | P0 |
| 05 | Onboarding Brand DNA — Étape 3 (Style) | Forms/Wizard | P0 |
| 06 | Dashboard principal | Dashboard | P0 |
| 07 | Configuration Brand DNA (vue complète) | Dashboard | P0 |
| 08 | Workflow Étape 1 — Brief & Contexte | Forms | P0 |
| 09 | Workflow Étape 2 — Plateformes & Format | Forms | P0 |
| 10 | Workflow Étape 3 — Génération textes | Dashboard | P0 |
| 11 | Workflow Étape 4 — Génération visuels | Dashboard | P0 |
| 12 | Workflow Étape 5 — Review & Édition | Dashboard | P0 |
| 13 | Workflow Étape 6 — Approbation | Forms | P1 |
| 14 | Workflow Étape 7 — Planification | Forms | P0 |
| 15 | Calendrier de publication | Dashboard | P0 |
| 16 | Connexions sociales (OAuth) | Dashboard | P0 |
| 17 | Analytics Dashboard | Dashboard | P1 |
| 18 | Bibliothèque de médias | Dashboard | P0 |
| 19 | Paramètres généraux | Forms | P1 |
| 20 | Gestion d'équipe | Dashboard | P1 |
| 21 | Facturation & Plans | Landing/Forms | P1 |
| 22 | Portail client (approbation externe) | Dashboard | P2 |
| 23 | Documents & Offres commerciales | Dashboard | P2 |
| 24 | Transcription de réunions | Dashboard | P2 |
| 25 | Lead Gen (Apollo) | Dashboard | P2 |
| 26 | Inbox social unifié | Dashboard | P2 |
| 27 | Competitor Analysis | Dashboard | P2 |
| 28 | Landing page marketing RAMI | Landing | P0 |

---

## 01 — PAGE DE CONNEXION

```
Design a dark-themed login page for RAMI, an AI-powered Agency OS for social media.

**Layout:**
- Full-screen split: left 55% brand panel, right 45% login form
- Left panel: deep black (#0A0A0F) with 3 soft gradient blobs (violet #7C3AED, blue #2563EB) blurred at 120px, opacity 15%
- Subtle 40px grid pattern at 2% white opacity over left panel
- RAMI logo centered on left panel: bold wordmark "RAMI" in white with a violet-to-blue gradient underline accent
- Tagline below logo: "L'IA qui vise juste." in rgba(255,255,255,0.6)
- Right panel: slightly lighter dark (#0F0F14) for form area

**Form Section (right panel):**
- Centered card: rgba(255,255,255,0.04) background, backdrop-blur-xl, border rgba(255,255,255,0.08), rounded-2xl (16px)
- Heading: "Connexion" in #F8FAFC, 28px, font-weight 600
- Subheading: "Bienvenue. Connectez-vous pour accéder à votre espace." in rgba(255,255,255,0.6)
- Email field: rgba(255,255,255,0.06) background, rgba(255,255,255,0.08) border, floating label, rounded-xl
- Password field: same style with show/hide toggle icon
- "Mot de passe oublié ?" link in violet (#7C3AED) aligned right
- CTA button: full-width, gradient from #7C3AED to #2563EB, rounded-xl, "Se connecter" in white bold
- Divider: "ou" with thin white/8% lines
- Social login buttons: Google + GitHub, outlined style rgba(255,255,255,0.08) border
- Footer text: "Pas encore de compte ? Créer un compte" with violet link

**Typography:** Inter or Plus Jakarta Sans — clean, modern, high readability
**Spacing:** Spacious (24px gaps between form elements)
**Responsive:** Desktop-first, form card centered on mobile

**Neuropsychological intent:**
- Violet gradient CTA = expertise + créativité (Causse color psychology)
- Dark background = focus + premium perception (reduced cognitive load)
- Rounded corners 16px = Gestalt approachability signal
- High contrast text (#F8FAFC on #0A0A0F) = processing fluency = perceived credibility (Reber & Schwarz)
```

---

## 02 — PAGE D'INSCRIPTION

```
Design a dark-themed registration page for RAMI, an AI-powered Agency OS:

**Layout:**
- Same split layout as login: left 55% brand panel, right 45% form
- Left panel: #0A0A0F with violet-blue gradient blobs, 40px grid
- Left panel content: RAMI logo + 3 benefit bullets with icons:
  • "Contenu calibré neuropsychologiquement" (brain icon)
  • "Publication multi-plateforme en 1 clic" (share icon)
  • "Brand DNA persistant par marque" (DNA helix icon)
- Each bullet: icon in violet gradient circle, text in white/60%

**Form Section (right panel):**
- Card: rgba(255,255,255,0.04), backdrop-blur-xl, border rgba(255,255,255,0.08), rounded-2xl
- Heading: "Créer un compte" in #F8FAFC, 28px
- Subheading: "Commencez gratuitement. Aucune carte requise." in white/60%
- Fields (all rgba(255,255,255,0.06) bg, rgba(255,255,255,0.08) border, rounded-xl):
  1. Nom complet
  2. Email professionnel
  3. Mot de passe (with strength indicator bar: red→amber→green gradient)
  4. Confirmer le mot de passe
- Password requirements checklist below field: 4 items with green checkmarks when met
- CTA: full-width gradient #7C3AED→#2563EB, "Créer mon compte"
- Terms text: "En créant un compte, vous acceptez nos CGU et notre Politique de confidentialité" with violet links
- Divider + social signup (Google, GitHub)
- Footer: "Déjà un compte ? Se connecter" with violet link

**Style:**
- Background: #0A0A0F with gradient blobs
- Cards: rgba(255,255,255,0.04) backdrop-blur-xl
- Accent: gradient #7C3AED to #2563EB
- Typography: Inter/Plus Jakarta Sans
- Border radius: 16px cards, 12px inputs
- Spacing: Spacious

**Gestalt principle:** Progressive disclosure — password requirements appear only when field is focused
**Causse intent:** Green (#10B981) for validation = growth/confirmation signal
```

---

## 03 — ONBOARDING BRAND DNA — ÉTAPE 1 (IDENTITÉ)

```
Design a dark-themed onboarding wizard Step 1 of 3 for RAMI Brand DNA setup:

**Top Section:**
- Stepper/progress bar: 3 steps labeled "Identité", "Audience", "Style visuel"
- Step 1 active: violet gradient dot + bold text
- Steps 2-3: white/40% dots + muted text
- Progress bar: thin line, 33% filled with violet-to-blue gradient

**Page Title:**
- "Définissez l'identité de votre marque" in #F8FAFC, 24px, bold
- Subtitle: "Ces informations guident l'IA pour créer du contenu aligné avec votre positionnement." in white/60%

**Form Card (centered, max-width 720px):**
- Background: rgba(255,255,255,0.04), backdrop-blur-xl, border white/8%, rounded-2xl
- Padding: 32px

**Fields:**
1. "Nom de la marque" — text input, full width
2. "Secteur d'activité" — select dropdown with options: Tech/SaaS, Santé, Finance, Éducation, Luxe, Agroalimentaire, Immobilier, ONG, Autre
3. "Positionnement" — textarea, 3 rows, placeholder "Décrivez votre positionnement en 1-2 phrases"
4. "Proposition de valeur unique (USP)" — text input, placeholder "Qu'est-ce qui vous différencie ?"
5. "Tagline" — text input (optional badge), placeholder "Votre slogan"

**All fields:** rgba(255,255,255,0.06) bg, white/8% border, white/60% labels above, rounded-xl, focus ring violet-500/50

**Bottom Actions:**
- Right-aligned: "Suivant →" button, gradient #7C3AED→#2563EB, rounded-xl
- Left-aligned: "Passer cette étape" text link in white/40%

**Sidebar hint (right side, 280px):**
- Small card with lightbulb icon
- "Conseil IA" header in violet
- "Un positionnement clair permet à l'IA de générer des captions 3x plus pertinents." in white/50%, 13px

**Style:** #0A0A0F background, 3 gradient blobs, 40px grid
**Typography:** Inter, clean and readable
**Gestalt:** Proximity grouping — related fields visually clustered, whitespace between groups
```

---

## 04 — ONBOARDING BRAND DNA — ÉTAPE 2 (AUDIENCE)

```
Design a dark-themed onboarding wizard Step 2 of 3 for RAMI Brand DNA — Audience definition:

**Stepper:** Same as Step 1 but Step 2 active (66% progress), Step 1 completed (green checkmark)

**Page Title:**
- "Définissez votre audience cible" in #F8FAFC, 24px
- Subtitle: "L'IA calibre les émotions et couleurs selon la culture et les personas de vos clients." in white/60%

**Form Card (max-width 800px):**

**Section 1 — Marchés & Culture:**
- "Culture primaire" — select: Maroc, Afrique subsaharienne, Europe francophone, Moyen-Orient, International
- "Cultures secondaires" — multi-select chips (max 5)
- "Langues" — multi-select chips: FR, AR, EN, ES (min 1)

**Section 2 — Personas (repeatable, max 3):**
- Each persona in a sub-card with white/4% background:
  - "Nom du persona" — text input
  - "Tranche d'âge" — range selector (18-65+)
  - "Profession" — text input
  - "Douleur principale" — text input
  - "Objectif" — text input
- "+ Ajouter un persona" button: dashed border white/10%, violet text
- "× Supprimer" on each card header

**Section 3 — Objectif cognitif:**
- Radio card grid (2 columns, 3 rows) with icons:
  • Confiance (shield icon) — "Inspirer la sécurité et la fiabilité"
  • Urgence (lightning icon) — "Créer un sentiment d'action immédiate"
  • Aspiration (star icon) — "Éveiller le désir et l'ambition"
  • Expertise (brain icon) — "Démontrer la maîtrise et l'autorité"
  • Communauté (users icon) — "Fédérer et créer l'appartenance"
  • Joie (heart icon) — "Susciter l'enthousiasme et le positif"
- Selected card: violet gradient border, subtle violet glow

**Bottom Actions:**
- "← Retour" ghost button left
- "Suivant →" gradient button right

**Style:** #0A0A0F, gradient blobs, cards white/4%, inputs white/6%
**Causse signal:** Each cognitive objective card shows its associated Causse color as a subtle side accent
```

---

## 05 — ONBOARDING BRAND DNA — ÉTAPE 3 (STYLE VISUEL)

```
Design a dark-themed onboarding wizard Step 3 of 3 for RAMI Brand DNA — Visual style:

**Stepper:** Step 3 active (100% progress), Steps 1-2 completed (green checkmarks)

**Page Title:**
- "Choisissez votre style visuel" in #F8FAFC, 24px
- Subtitle: "Palette, typographie et ton éditorial — calibrés selon la psychologie des couleurs (Causse)." in white/60%

**Form Card (max-width 900px):**

**Section 1 — Logo Upload:**
- Large drop zone: dashed border white/10%, rounded-2xl, 200px height
- Center icon (upload cloud) + "Glissez votre logo ou cliquez pour sélectionner"
- Accepted formats: PNG, JPG, SVG, WebP (max 10MB)
- After upload: logo preview with "Analyser avec Vision AI" button (violet outline)
- Analysis result panel: extracted colors (3-5 hex swatches), detected shapes, Causse score badge

**Section 2 — Palette de couleurs (Causse):**
- Grid of 8 color cards (4 columns × 2 rows):
  • Rouge (#DC2626) — "Urgence, passion, énergie"
  • Bleu (#1D4ED8) — "Confiance, sécurité, professionnalisme"
  • Vert (#16A34A) — "Croissance, santé, espoir"
  • Violet (#7C3AED) — "Créativité, premium, mystère"
  • Orange (#EA580C) — "Enthousiasme, chaleur, accessibilité"
  • Or (#D4AF37) — "Luxe, excellence, prestige"
  • Noir (#1E1E1E) — "Sophistication, autorité, pouvoir"
  • Turquoise (#0891B2) — "Modernité, clarté, fraîcheur"
- Each card: large color swatch (80px circle), name, emotion keywords, culture note for Maroc
- Multi-select (primary + secondary + accent)
- Warning badge if sector-color mismatch (e.g., red + health sector)

**Section 3 — Ton éditorial:**
- Radio card list (1 column):
  • Expert confiant — "Assertif, data-driven, leadership"
  • Coach motivant — "Encourageant, accessible, chaleureux"
  • Stratège analytique — "Méthodique, chiffré, structuré"
  • Storyteller inspirant — "Narratif, émotionnel, engageant"
  • Minimaliste élégant — "Épuré, factuel, premium"

**Section 4 — Plateformes actives:**
- Checkbox grid with platform icons (colored): LinkedIn, Instagram, X, Facebook, Pinterest, YouTube, TikTok, Mastodon

**Bottom Actions:**
- "← Retour" ghost button
- "Finaliser le Brand DNA ✓" gradient button (larger, with checkmark icon)

**Style:** #0A0A0F, gradient blobs, spacious layout
**Gestalt:** Color cards use Gestalt proximity — related emotions grouped, dissimilar separated
**Causse:** Each color card IS the Causse matrix made tangible — the user experiences the psychology directly
```

---

## 06 — DASHBOARD PRINCIPAL

```
Design a dark-themed main dashboard for RAMI, an AI-powered Agency OS:

**Layout:**
- Left sidebar (260px, collapsible to 64px icons-only):
  - RAMI logo at top (violet-blue gradient mark + "RAMI" text)
  - Nav items with icons (outline style, white/40%, active = violet with white text):
    • Dashboard (grid icon) — ACTIVE
    • Créer (plus-circle icon)
    • Calendrier (calendar icon)
    • Bibliothèque (folder icon)
    • Analytics (bar-chart icon)
    • Connexions (link icon)
    • Brand DNA (dna-helix icon)
    — separator —
    • Documents (file-text icon)
    • Transcriptions (mic icon)
    • Leads (users icon)
    • Facturation (credit-card icon)
    — separator —
    • Paramètres (settings icon)
  - Sidebar bottom: user avatar (40px circle) + name + plan badge (e.g., "PRO")
  - Active item: left violet border accent (3px), bg white/6%

- Top bar (64px):
  - Breadcrumb: "Dashboard" in white
  - Search bar: rounded-xl, white/6% bg, magnifier icon, placeholder "Rechercher..."
  - Right side: notification bell (with red dot badge), user avatar dropdown

- Main content area:

**Row 1 — KPI Cards (4 cards, equal width):**
1. "Posts ce mois" — large number "47", trend arrow up green +12%, mini sparkline
2. "Visuels générés" — "128", trend, mini chart
3. "Score Brand DNA" — "0.87" with circular progress ring (violet gradient fill)
4. "Prochaine publication" — "Dans 2h", platform icon (LinkedIn), post title preview

Each card: white/4% bg, white/8% border, rounded-2xl, 24px padding
Numbers: 36px, bold, #F8FAFC
Labels: 13px, white/50%
Trend indicators: green (#10B981) up or red (#EF4444) down

**Row 2 — Two columns (60/40 split):**

Left (60%) — "Activité récente" card:
- List of 5 recent activities with:
  - Platform icon (colored: LinkedIn blue, Instagram gradient, X black)
  - Action text ("Post publié sur LinkedIn", "Visuel généré — Score 0.92")
  - Timestamp ("il y a 2h")
  - Status badge: published (green), scheduled (blue), draft (gray), failed (red)
- "Voir tout →" link in violet

Right (40%) — "Répartition par plateforme" card:
- Horizontal bar chart (5 platforms):
  - LinkedIn: 35% (blue bar)
  - Instagram: 28% (gradient bar)
  - X: 18% (white bar)
  - Facebook: 12% (blue bar)
  - Pinterest: 7% (red bar)
- Each bar: rounded-full, labeled with platform name and count

**Row 3 — Full width "Calendrier aperçu" card:**
- Week view strip: Mon-Sun, current day highlighted with violet border
- Each day shows 0-3 colored dots (platform colors) for scheduled posts
- Hover on day: tooltip with post titles
- "Voir le calendrier complet →" link

**Style:**
- Background: #0A0A0F
- 3 blobs: top-left violet (#7C3AED at 12% opacity), center blue (#2563EB at 8%), bottom-right violet-blue mix
- 40px grid pattern at white/2%
- Cards: white/4% bg, white/8% border, rounded-2xl
- Typography: Inter, 13-36px range
- Spacing: 16-24px gaps

**Neuropsychological design:**
- Score Brand DNA as circular ring = Gestalt closure principle — invites completion
- Platform colors maintain real-brand associations = cognitive fluency
- Violet sidebar accent = expertise/creativity signal persistent across navigation
- KPI cards follow Peak-End rule (M6): most important metrics first and last
```

---

## 07 — CONFIGURATION BRAND DNA (VUE COMPLÈTE)

```
Design a dark-themed Brand DNA overview page for RAMI:

**Layout:** Same sidebar + top bar as dashboard

**Hero Section (full width, 200px):**
- Large heading: "Brand DNA — [Nom de la marque]" in #F8FAFC
- Score badge: large circular gauge (120px), score "0.87/1.00", violet gradient fill
- Score label: "Score de cohérence" in white/50%
- "Modifier le Brand DNA" button (violet outline) + "Exporter JSON" button (ghost)

**Section 1 — Identité (card):**
- 2-column layout:
  - Left: logo preview (rounded-xl, white/6% bg), brand name, sector badge, tagline
  - Right: positioning text, USP text
- Section header with pen/edit icon

**Section 2 — Palette Causse (card):**
- Row of 3-5 large color circles (64px) with:
  - HEX code below
  - Causse emotion label (e.g., "Confiance")
  - Usage recommendation (e.g., "CTA + headers")
- Color harmony indicator: "Complémentaire" or "Analogique" with visual diagram
- Causse culture note: "Contexte Maroc : le vert est fortement associé à l'Islam" in amber/warning if applicable

**Section 3 — Audience & Personas (card):**
- 3 persona cards side by side:
  - Avatar placeholder (circle with initials)
  - Name, age range, profession
  - Pain point (red accent dot)
  - Goal (green accent dot)
- Cognitive objective badge: e.g., "Confiance" with shield icon, blue accent

**Section 4 — Ton éditorial (card):**
- Selected tone: large text "Expert confiant"
- 3 example posts generated by AI (LinkedIn, Instagram, X) in mini preview cards
- "Régénérer les exemples" button

**Section 5 — Plateformes actives (card):**
- Row of platform icons (colored when active, gray when inactive)
- Connection status: green dot = connected, amber = token expiring, red = disconnected

**Section 6 — Recommandations IA (card):**
- 3-4 recommendation items:
  - Icon (lightbulb) + text + action button
  - Example: "Ajoutez un persona B2C pour diversifier votre audience" → "Ajouter"
  - Example: "Votre palette manque de contraste pour Instagram Stories" → "Optimiser"
- Each recommendation has an impact score: Élevé/Moyen/Faible with colored dot

**Style:** #0A0A0F, gradient blobs, cards white/4%, spacious sections with 32px gaps
**Gestalt:** Cards grouped by proximity (identity together, palette together)
**Causse:** Palette section IS the Causse matrix — live demonstration of the product's core value
```

---

## 08 — WORKFLOW ÉTAPE 1 — BRIEF & CONTEXTE

```
Design a dark-themed content creation workflow Step 1 of 7 for RAMI:

**Top Section:**
- Workflow stepper: 7 steps as numbered circles connected by lines
  - Steps: 1.Brief, 2.Plateformes, 3.Textes, 4.Visuels, 5.Review, 6.Approbation, 7.Planification
  - Step 1 active: violet gradient fill, white number
  - Other steps: white/10% fill, white/30% numbers
- Progress: 14% bar, violet gradient

**Page Title:**
- "Décrivez votre contenu" in #F8FAFC, 24px
- Brand DNA context badge: "[Marque X] — Confiance — Bleu/Or" in small pill, white/6% bg

**Main Card (max-width 800px, centered):**

**Section A — Brief:**
- Large textarea (6 rows): white/6% bg, rounded-xl
- Placeholder: "Décrivez le sujet de votre post. L'IA enrichira votre brief avec le Brand DNA..."
- Character counter: "0/2000" in white/30%
- AI assist button below: "✨ Enrichir avec l'IA" (violet outline, small)

**Section B — Objectif cognitif (pré-rempli depuis Brand DNA):**
- Radio cards (2 columns × 3 rows), same as onboarding Step 2 but with Brand DNA default selected
- Pre-selected card has violet glow border

**Section C — Angle éditorial:**
- 3 angle suggestion chips generated by AI (after brief is entered):
  - e.g., "Étude de cas client", "Chiffre clé du secteur", "Behind the scenes"
  - Each chip: white/6% bg, white/8% border, clickable, selected = violet border
  - "+ Autre angle" text input for custom

**Sidebar (right, 300px):**
- "Brand DNA actif" card:
  - Mini palette swatches (3 colors)
  - Active platforms icons
  - Tone: "Expert confiant"
  - Score: "0.87"
- "Historique" card:
  - Last 3 content sessions with dates
  - Click to reuse a brief

**Bottom Actions:**
- "Suivant →" gradient button (disabled until brief min 10 chars)
- Auto-save indicator: "Brouillon sauvegardé" with green checkmark

**Style:** #0A0A0F, gradient blobs, spacious
**KB integration:** Angle suggestions use KB1 P1 (Anchoring Insight) logic — find the fact that reframes everything
```

---

## 09 — WORKFLOW ÉTAPE 2 — PLATEFORMES & FORMAT

```
Design a dark-themed workflow Step 2 of 7 for RAMI — Platform selection:

**Stepper:** Step 2 active (28%), Step 1 completed (green check)

**Title:** "Choisissez vos plateformes" + subtitle "Le contenu sera adapté au format et aux contraintes de chaque réseau."

**Main Card:**

**Platform Selection Grid (3 columns):**
Each platform as a selectable card (white/4% bg, rounded-2xl):
- Platform icon (full color, 48px)
- Platform name bold
- Character limit info: "LinkedIn: 3000 car." in white/30%
- Best posting time: "Mar-Jeu 8h-10h" in white/30%
- Checkbox in top-right corner
- Selected: violet border + subtle violet bg glow
- Platforms: LinkedIn, Instagram, X (Twitter), Facebook, Pinterest, YouTube, TikTok, Mastodon

**Format Options (appears after platform selection):**
- Per selected platform, format chips:
  - LinkedIn: Post texte, Carrousel, Article, Newsletter
  - Instagram: Post simple, Carrousel, Story, Reel
  - X: Tweet, Thread
  - Facebook: Post, Story, Reel
  - YouTube: Short, Vidéo
- Multi-select chips per platform
- Visual preview mockup (phone frame) showing selected format dimensions

**Content Adaptation Preview:**
- Live preview of character count adaptation per platform
- Warning if brief exceeds platform limit: amber badge

**Bottom:** "← Retour" + "Suivant →"

**Style:** #0A0A0F, cards, gradient accents
**Causse:** Platform icons in their real brand colors = cognitive fluency, instant recognition
```

---

## 10 — WORKFLOW ÉTAPE 3 — GÉNÉRATION TEXTES

```
Design a dark-themed workflow Step 3 of 7 for RAMI — AI text generation:

**Stepper:** Step 3 active (42%), Steps 1-2 completed

**Title:** "Textes générés par l'IA" + subtitle "Calibrés selon votre Brand DNA, votre audience et l'objectif cognitif."

**Layout: 2 columns (55% left, 45% right)**

**Left Column — Generated Content:**
- Tab bar per selected platform (LinkedIn | Instagram | X...)
- Active tab: violet underline, bold text

Per platform tab:
- "Caption" section:
  - Generated text in editable textarea (white/6% bg)
  - Character count + limit indicator (green if under, amber if near, red if over)
  - Tone badge: "Expert confiant" in pill

- "Hashtags" section:
  - Generated hashtag chips (10-20): white/6% bg, clickable to remove
  - "+ Ajouter" to add custom
  - Mix indicator: "5 volume élevé, 5 moyen, 5 niche" in white/40%

- "Hook" section:
  - 3 hook variants generated:
    1. Question hook
    2. Chiffre/stat hook (KB1 P1 Anchoring)
    3. Affirmation hook
  - Radio select, selected = violet border
  - "Régénérer" button per hook

**Right Column — Brand DNA Context:**
- Fixed panel:
  - "Objectif cognitif : Confiance" with blue accent
  - "Ton : Expert confiant"
  - "Palette : Bleu #1D4ED8 + Or #D4AF37"
  - "Personas ciblés :" with mini cards
  - Score projection: "Alignement Brand DNA estimé : 0.91" with gauge

**Bottom Actions:**
- "← Retour" + "Générer les visuels →" gradient button
- "Régénérer tout" ghost button

**Style:** #0A0A0F, cards, editable fields with clear focus states
**KB integration:** Hook variants follow KB1 P1 (Anchoring) + KB video hook structure (character details → pause → twist)
```

---

## 11 — WORKFLOW ÉTAPE 4 — GÉNÉRATION VISUELS

```
Design a dark-themed workflow Step 4 of 7 for RAMI — Visual generation with Brand DNA scoring:

**Stepper:** Step 4 active (57%), Steps 1-3 completed

**Title:** "Vos visuels calibrés" + subtitle "4 directions artistiques × 5 visuels chacune. Score Brand DNA par visuel."

**Layout:**

**Direction Tabs (horizontal, scrollable):**
- 4 tabs: "Direction 1: Blueprint", "Direction 2: Narratif", "Direction 3: Machine", "Direction 4: Carte"
- Each tab shows the Causse-derived style name
- Active tab: violet underline

**Visual Gallery (per direction, 5 images):**
- Grid: 5 images in a row (or 3+2 on smaller screens)
- Each image card:
  - Image preview (rounded-xl, aspect ratio matching target platform)
  - Overlay on hover: "Score: 0.92" badge in top-right (green if ≥0.7, amber if 0.5-0.7, red if <0.5)
  - Bottom bar: dominant color swatch + detected shape icon (Gestalt) + provider badge (Fal.ai/Replicate)
  - Selection checkbox (top-left, violet checkmark when selected)
  - Actions on hover: Download, Regenerate, Full-screen preview

**Selected Visuals Panel (bottom, collapsible):**
- Horizontal strip of selected images as thumbnails
- Count: "3/20 sélectionnés"
- "Exporter ZIP" button + "Exporter WebP optimisé" button

**Generation Status (if in progress):**
- Progress bar per direction (violet gradient)
- Provider fallback indicator: "Fal.ai → Replicate (fallback)" in white/30%
- Estimated time: "~15s restantes"

**Right Sidebar (280px):**
- "Prompt utilisé" collapsible section:
  - Positive prompt text in code-style font, white/50%
  - Negative prompt
  - Parameters: guidance_scale, steps, seed
- "Régénérer cette direction" button
- "Ajouter une direction +" button (max 6)

**Bottom:** "← Retour" + "Review & Édition →"

**Style:** #0A0A0F, image-heavy layout, minimal chrome around visuals
**Causse live demo:** Score badges ARE the Causse validation — user sees the neuropsychology working in real-time
**KB4 integration:** Direction names map to KB4 infographic styles (Blueprint, Scientific, Narrative, Dashboard)
```

---

## 12 — WORKFLOW ÉTAPE 5 — REVIEW & ÉDITION

```
Design a dark-themed workflow Step 5 of 7 for RAMI — Final review and editing:

**Stepper:** Step 5 active (71%)

**Title:** "Revue finale" + subtitle "Vérifiez et ajustez votre contenu avant approbation."

**Layout: 3-column (preview | editor | checklist)**

**Left (40%) — Live Preview:**
- Device frame mockup (phone for Instagram/TikTok, desktop for LinkedIn)
- Switchable between platforms via tabs
- Shows: selected visual + caption + hashtags as they would appear on the platform
- Platform-accurate rendering (LinkedIn post card, Instagram square, X tweet)

**Center (35%) — Editor:**
- Editable caption textarea (pre-filled from Step 3)
- Hashtag editor (drag to reorder, click to remove)
- Visual swap: click image → opens gallery modal to change selection
- CTA text field (optional)
- UTM parameters (collapsible advanced section):
  - Source, Medium, Campaign auto-generated
  - Override fields

**Right (25%) — Quality Checklist:**
- Automated checks with green/amber/red status:
  ✅ Character count within limit
  ✅ Brand DNA score ≥ 0.7
  ✅ Hashtag count optimal (10-20)
  ⚠️ No CTA detected — "Ajoutez un appel à l'action"
  ✅ Image resolution sufficient
  ✅ No prohibited content detected
- Overall readiness score: "4/6 checks passés"
- "Tout est prêt" button glows green when 6/6

**Bottom:** "← Retour" + "Soumettre pour approbation →" or "Planifier directement →"

**Style:** #0A0A0F, 3-panel layout, device mockup prominent
**KB3 M19:** CTA Sharpener check — warns if no CTA detected
**KB3 M7:** Fluency check — flags text readability issues
```

---

## 13 — WORKFLOW ÉTAPE 6 — APPROBATION

```
Design a dark-themed approval workflow Step 6 of 7 for RAMI:

**Stepper:** Step 6 active (85%)

**Title:** "Approbation" + subtitle "Envoyez pour validation avant publication."

**Layout: 2 columns (60/40)**

**Left (60%) — Content Preview Cards:**
- One card per platform with:
  - Platform icon + name header
  - Visual thumbnail
  - Caption preview (truncated, expandable)
  - Hashtags as small pills
  - Scheduled date/time
  - Status: "En attente d'approbation" (amber badge)

**Right (40%) — Approval Settings:**
- "Approbateur" section:
  - Dropdown: select team member or client
  - OR "Lien d'approbation externe" toggle:
    - Generates unique URL (no login required)
    - Expiration: 24h/48h/7 jours selector
    - Copy link button
    - QR code option

- "Message pour l'approbateur" textarea:
  - Placeholder: "Contexte ou instructions pour le reviewer..."

- "Envoyer pour approbation" gradient button
  - OR "Auto-approuver" toggle (for tenant owner only)

- "Historique des approbations" collapsible:
  - List: date, approver name, status (approved/rejected), comment

**Approval States:**
- Pending: amber dot + "En attente"
- Approved: green dot + "Approuvé par [Nom]" + timestamp
- Rejected: red dot + "Refusé" + rejection comment displayed
- Revision requested: amber dot + "Modifications demandées" + comment

**Bottom:** "← Retour" + "Planifier →" (enabled only when approved or auto-approved)

**Style:** #0A0A0F, status-driven design with clear color coding
**Market need:** This is the #2 most requested feature by agencies (Reddit audit P5) — "Un utilisateur a créé son propre SaaS pour résoudre ce problème"
```

---

## 14 — WORKFLOW ÉTAPE 7 — PLANIFICATION

```
Design a dark-themed scheduling Step 7 of 7 for RAMI:

**Stepper:** Step 7 active (100%), all previous completed

**Title:** "Planification" + subtitle "Choisissez quand publier votre contenu."

**Layout:**

**Publishing Options (3 radio cards, full width):**
1. "Publier maintenant" — lightning icon, "Votre contenu sera publié immédiatement sur les plateformes sélectionnées"
2. "Planifier" — calendar icon, "Choisissez une date et heure de publication"
3. "Enregistrer en brouillon" — file icon, "Sauvegardez pour publier plus tard"

Selected card: violet gradient border

**If "Planifier" selected:**
- Date picker: calendar widget (dark theme, violet accent for selected date)
- Time picker: 24h format, 15-min intervals
- Timezone: auto-detected with override option
- "Meilleur moment IA" suggestion: "LinkedIn : Mardi 9h15 — engagement optimal estimé +23%" with violet star icon
  - Button: "Utiliser cette suggestion"

**Per-Platform Schedule (if multiple platforms):**
- Toggle: "Publier tout en même temps" (default) or "Horaires différents par plateforme"
- If different: per-platform date/time picker rows

**Publication Summary Card:**
- Table showing:
  | Plateforme | Date | Heure | Statut | Connexion |
  - Green checkmark if OAuth connected
  - Red warning if not connected → "Connecter" link

**Bottom Actions:**
- "← Retour"
- "Confirmer la publication" gradient button (large, with rocket icon)
- Confirmation modal: "Vous êtes sur le point de publier sur 3 plateformes. Confirmer ?" with Cancel/Confirmer

**Post-confirmation:**
- Success animation: checkmark burst with confetti particles (violet/blue)
- "Publié avec succès !" or "Planifié pour [date]"
- Next actions: "Voir dans le calendrier" | "Créer un nouveau contenu" | "Retour au dashboard"

**Style:** #0A0A0F, clean and decisive layout
**KB3 M19:** CTA Sharpener — the final action is crystal clear, no ambiguity
```

---

## 15 — CALENDRIER DE PUBLICATION

```
Design a dark-themed publication calendar for RAMI:

**Layout:** Sidebar + top bar (same as dashboard)

**Top Section:**
- Month navigation: "← Mars 2026 →" with prev/next arrows
- View toggles: Mois | Semaine | Jour (pill buttons, active = violet fill)
- "Nouveau post +" button (gradient, top-right)
- Month summary strip: "47 publiés | 12 planifiés | 3 brouillons" with colored dots

**Calendar Grid (Month view):**
- 7 columns (Lun-Dim), 5-6 rows
- Each day cell:
  - Day number (white/60%, current day = violet circle bg)
  - Up to 3 post chips visible:
    - Each chip: platform icon (small, colored) + truncated title (12 chars)
    - Color-coded border: published (green), scheduled (blue), draft (gray), failed (red)
  - If more than 3: "+2 autres" overflow badge
  - Click on day: opens day detail sidebar

**Day Detail Sidebar (right, 360px, slide-in):**
- Date header: "Mardi 12 mars 2026"
- List of posts for this day:
  - Each post card:
    - Platform icon + account name
    - Post content preview (2 lines)
    - Visual thumbnail (48px square)
    - Time: "09:15"
    - Status badge
    - Actions: Edit, Duplicate, Delete, Reschedule
  - Drag-to-reorder for scheduling order
- "+ Ajouter un post" button at bottom

**Week View:**
- 7 day columns with hour rows (6h-23h)
- Posts as colored blocks at scheduled time
- Drag-and-drop to reschedule

**Upcoming Posts Strip (below calendar):**
- Horizontal scrollable list of next 10 scheduled posts
- Each: platform icon, title, date, visual thumb, edit button

**Style:** #0A0A0F, gradient blobs subtle, grid lines at white/5%
**Platform colors:** LinkedIn (#0A66C2), Instagram (gradient), X (#000), Facebook (#1877F2), Pinterest (#E60023), YouTube (#FF0000)
**Gestalt:** Grid alignment creates visual rhythm — consistent cell sizing, predictable chip placement
```

---

## 16 — CONNEXIONS SOCIALES (OAUTH)

```
Design a dark-themed social connections management page for RAMI:

**Layout:** Sidebar + top bar, settings sub-navigation

**Settings Navigation (horizontal tabs):**
- Connexions (active, violet underline) | Général | Équipe | Facturation

**Title:** "Connexions aux réseaux sociaux" + subtitle "Connectez vos comptes pour publier directement depuis RAMI."

**Platform Cards Grid (2 columns):**
Each platform as a large card (white/4% bg, rounded-2xl):

**Connected state:**
- Platform icon (64px, full color) + platform name (bold)
- Account info: "@account_name" + avatar mini (24px circle)
- Connection status: green dot + "Connecté" + "Expire dans 47 jours"
- Scopes: "read, write, publish" as small pills
- Last used: "Dernier post il y a 3h"
- Actions: "Déconnecter" (red ghost button) + "Rafraîchir le token" (ghost button)

**Disconnected state:**
- Platform icon (64px, grayscale/desaturated)
- Platform name + "Non connecté" in white/40%
- "Connecter" button: violet outline, rounded-xl
- Required scopes listed: "Permissions : publication, lecture du profil"

**Token Expiry Warning state:**
- Same as connected but with amber border
- Warning badge: "⚠ Token expire dans 2 jours — Rafraîchir"

**Platforms to show (6 cards):**
1. LinkedIn — Connected ✓
2. Instagram (via Meta) — Connected ✓
3. X (Twitter) — Disconnected
4. Facebook — Connected, token expiring ⚠
5. Pinterest — Disconnected
6. YouTube — Disconnected

**Bottom Info Card:**
- "Sécurité" header with lock icon
- "Vos tokens OAuth sont chiffrés AES-256 avant stockage. RAMI n'a jamais accès à vos mots de passe."
- RGPD badge: "Conforme CNDP & RGPD"

**Style:** #0A0A0F, cards with platform-colored accents when connected
**Causse:** Green connected dots = growth/safety | Red disconnect = urgency/danger — intuitive status signaling
```

---

## 17 — ANALYTICS DASHBOARD

```
Design a dark-themed analytics dashboard for RAMI:

**Layout:** Sidebar + top bar

**Top Section:**
- "Performance" heading
- Date range picker: "7 derniers jours" dropdown (7j | 30j | 90j | Custom)
- Platform filter: all | individual platform pills
- Export button: "Exporter PDF" (ghost)

**Row 1 — KPI Cards (5 cards):**
1. Impressions totales: "124,500" with trend +18% (green arrow)
2. Engagement total: "3,240" with trend +7%
3. Taux d'engagement: "2.6%" with trend (compare to industry avg)
4. Clics liens: "890" with trend
5. Meilleur post: thumbnail preview + platform icon + "3.2K impressions"

Each card: white/4% bg, large number, sparkline mini-chart, comparison period toggle

**Row 2 — Charts (2 columns):**

Left (60%) — "Impressions & Engagement" line chart:
- Dual-axis: impressions (area fill, violet gradient) + engagement (line, blue)
- X-axis: dates, Y-axis: values
- Hover tooltip with exact numbers
- Legend: Impressions (violet) | Engagement (blue)

Right (40%) — "Répartition par plateforme" donut chart:
- Segments colored by platform brand colors
- Center: total impressions number
- Legend below with platform name + % + actual number

**Row 3 — Performance Table:**
- Sortable columns: Post | Plateforme | Date | Impressions | Engagement | Taux | Score DNA
- Each row: visual thumbnail (32px), caption preview, platform icon
- Sortable by any column (click header)
- Pagination: 10 per page

**Row 4 — "Recommandations IA" card:**
- 3 insight cards:
  1. "Vos posts LinkedIn ont 40% plus d'engagement le mardi matin" — "Planifier pour mardi" button
  2. "Les visuels avec palette bleue ont un score DNA 15% supérieur" — "Voir la palette" link
  3. "Le format carrousel génère 2.3x plus de partages sur Instagram" — "Créer un carrousel" button
- Each with lightbulb icon, violet accent

**Style:** #0A0A0F, data-rich but clean, chart colors = platform brand colors
**KB3 M11:** Chart Type Corrector — NO pie charts, horizontal bars for comparison, line for time series
**KB3 M10:** Label Integrator — labels directly on data points, no separate legend boxes
```

---

## 18 — BIBLIOTHÈQUE DE MÉDIAS

```
Design a dark-themed media library for RAMI:

**Layout:** Sidebar + top bar

**Top Section:**
- "Bibliothèque" heading
- Search bar: "Rechercher par nom, tag, couleur..." with filter icon
- View toggles: Grille (active) | Liste (pill buttons)
- Sort: "Plus récents" dropdown (récents | anciens | score DNA | taille)
- Upload button: "+ Importer" gradient

**Filter Bar (horizontal, scrollable chips):**
- Format: Tous | Images | Vidéos | Documents
- Platform: All | LinkedIn | Instagram | X | Facebook | Pinterest | YouTube
- Score: Tous | ≥0.9 | ≥0.7 | <0.7
- Date: Today | This week | This month | Custom

**Grid View:**
- Masonry-style grid, 4 columns
- Each item card:
  - Image preview (rounded-xl, aspect ratio preserved)
  - Overlay on hover (dark gradient from bottom):
    - Filename (truncated)
    - Dimensions: "1080×1080"
    - Score DNA badge (top-right): "0.92" in green pill
    - Format badge (bottom-left): "WebP" in small pill
    - Actions: Download, Copy URL, Delete, Use in post
  - Selection checkbox (top-left, appears on hover)

**Bulk Actions Bar (appears when items selected):**
- "3 sélectionnés" counter
- Actions: "Télécharger ZIP" | "Supprimer" | "Utiliser dans un post" | "Tout désélectionner"

**Empty State (if no assets):**
- Illustration: abstract folder with violet accent
- "Votre bibliothèque est vide"
- "Créez votre premier contenu pour commencer" + "Créer →" button

**Upload Modal (on "+ Importer"):**
- Drag & drop zone: dashed border, 300px height
- "ou choisissez des fichiers" link
- Accepted formats listed: PNG, JPG, SVG, WebP, MP4 (max 50MB)
- Upload progress: per-file progress bars
- Auto-analysis: "Analyse Vision AI en cours..." → Score DNA displayed after

**Style:** #0A0A0F, image-focused, minimal chrome
**Gestalt:** Masonry grid = similarity principle — consistent card style across varied content
```

---

## 19 — PARAMÈTRES GÉNÉRAUX

```
Design a dark-themed general settings page for RAMI:

**Layout:** Sidebar + top bar + settings sub-nav

**Settings Navigation:** Général (active) | Connexions | Équipe | Facturation

**Section 1 — Profil (card):**
- Avatar upload (80px circle) + "Modifier" overlay on hover
- Nom complet — text input
- Email — text input (with verified badge)
- Fuseau horaire — select dropdown
- Langue de l'interface — select: Français | English | العربية
- "Enregistrer" button (violet gradient, compact)

**Section 2 — Espace de travail (card):**
- Nom de l'espace — text input
- Slug — text input with ".rami.ai-mpower.com" suffix
- Plan actuel — badge: "PRO — $149/mois" with "Changer de plan" link
- Quota utilisé:
  - Générations: progress bar "320/500" with percentage
  - Storage: progress bar "12.4GB/50GB"
  - Tenants: "7/10"

**Section 3 — Notifications (card):**
- Toggle rows:
  - "Publication réussie" — toggle ON (green)
  - "Publication échouée" — toggle ON
  - "Token OAuth expirant" — toggle ON
  - "Rapport hebdomadaire" — toggle ON
  - "Nouvelles fonctionnalités" — toggle OFF
- Channel: Email | Push | Les deux — radio per notification

**Section 4 — Danger Zone (card with red/10% border):**
- "Exporter toutes mes données" — button (ghost)
- "Supprimer mon compte" — button (red outline) with confirmation modal

**Style:** #0A0A0F, form-focused, clear section separation
**RGPD:** Export and delete buttons = CNDP compliance (droit d'accès, portabilité, suppression)
```

---

## 20 — GESTION D'ÉQUIPE

```
Design a dark-themed team management page for RAMI:

**Layout:** Sidebar + settings sub-nav

**Settings Navigation:** Général | Connexions | Équipe (active) | Facturation

**Title:** "Gestion de l'équipe" + "Inviter un membre" gradient button (top-right)

**Team Members Table:**
- Columns: Membre | Email | Rôle | Dernière activité | Actions
- Each row:
  - Avatar (32px) + name
  - Email
  - Role dropdown: Owner | Admin | Éditeur | Viewer
  - Last active: "il y a 2h" or "Jamais"
  - Actions: kebab menu → Edit role, Remove

**Roles Description Card:**
- 4 role cards in a row:
  - Owner: "Accès total + facturation + suppression" (violet accent)
  - Admin: "Tout sauf facturation et suppression" (blue accent)
  - Éditeur: "Créer, modifier, publier du contenu" (green accent)
  - Viewer: "Lecture seule, commentaires" (gray accent)

**Pending Invitations Section:**
- List of pending invites:
  - Email + role + "Envoyé il y a 3h"
  - Actions: "Renvoyer" | "Annuler"

**Invite Modal:**
- Email input (multiple, comma-separated)
- Role selector
- Personal message (optional textarea)
- "Envoyer l'invitation" gradient button

**Style:** #0A0A0F, table with subtle row hover (white/4%)
```

---

## 21 — FACTURATION & PLANS

```
Design a dark-themed billing and pricing page for RAMI:

**Layout:** Sidebar + settings sub-nav (Facturation active)

**Section 1 — Plan actuel (hero card):**
- Large card with violet gradient border (2px)
- Plan name: "PRO" in 36px bold
- Price: "$149/mois" with "facturé mensuellement" subtitle
- Renewal date: "Prochain renouvellement : 11 avril 2026"
- Usage bars:
  - Générations: 320/500 (64%)
  - Tenants: 7/10 (70%)
  - Storage: 12.4/50 GB (25%)
- "Changer de plan" button + "Annuler l'abonnement" text link (red)

**Section 2 — Tous les plans (pricing cards, 5 columns):**
Each plan card (white/4% bg, rounded-2xl):
- FREE: $0 — "1 tenant, 10 gén/mois, watermark"
- SOLO: $59 — "3 tenants, 150 gén/mois"
- PRO: $149 — "10 tenants, 500 gén/mois" (CURRENT = violet border + "Plan actuel" badge)
- AGENCY: $399 — "Illimité tenants, 2000 gén/mois"
- AGENCY+: $699 — "Illimité, API publique, white-label"

Each card:
- Plan name (bold, 20px)
- Price (36px) + "/mois"
- Feature list (8-10 items with checkmarks)
- Highlighted features in violet
- CTA: "Choisir" (gradient for upgrade, disabled for current, outline for downgrade)
- "Plus populaire" badge on AGENCY (violet pill)

**Section 3 — Historique de facturation (table):**
- Columns: Date | Description | Montant | Statut | Facture
- Status: Payé (green), En attente (amber), Échoué (red)
- Invoice: "Télécharger PDF" link

**Section 4 — Méthode de paiement:**
- Card on file: "**** **** **** 4242" with Visa icon
- "Modifier" link → Stripe Customer Portal
- Billing address preview

**Style:** #0A0A0F, pricing cards with clear visual hierarchy
**KB3 M21:** Distinctiveness — most popular plan visually stands out (violet border, larger, badge)
**Causse:** Gradient CTA on upgrade = aspiration + action | Red on cancel = deliberate friction
```

---

## 22 — PORTAIL CLIENT (APPROBATION EXTERNE)

```
Design a dark-themed client approval portal for RAMI (public, no login required):

**Layout:** Single page, centered content, no sidebar

**Header:**
- RAMI logo (small, top-left)
- Agency branding: "[Agency Name] vous invite à approuver du contenu" in white/60%
- Expiration badge: "Ce lien expire dans 47h" (amber if <24h)

**Content Cards (vertical stack):**
Per post to approve:
- Large card (max-width 700px, centered):
  - Platform icon + "Post LinkedIn" header
  - Visual preview (large, 400px height, rounded-xl)
  - Caption text below (full, readable)
  - Hashtags as pills
  - Scheduled date/time
  - Brand DNA score badge

**Action Buttons (sticky bottom bar):**
- "✓ Approuver tout" — large green button
- "✗ Demander des modifications" — amber outline button
- On "modifications": opens comment textarea per post + "Envoyer le feedback" button

**Modification Request:**
- Per-post inline comment box
- Highlight specific text feature (select text → "Commenter cette partie")
- Annotation on image (click to place comment pin)

**Success State:**
- "Merci ! Votre approbation a été enregistrée." with green checkmark animation
- "L'équipe [Agency] a été notifiée."

**Style:** #0A0A0F but slightly lighter (#12121A) for public-facing, RAMI branding subtle
**Market validation:** SocialPilot and Planable identified as best-in-class for this flow (audit P3)
```

---

## 23 — DOCUMENTS & OFFRES COMMERCIALES

```
Design a dark-themed document engine page for RAMI:

**Layout:** Sidebar + top bar

**Title:** "Documents" + "+ Créer un document" gradient button

**Document Types (3 large cards at top):**
1. "Offre commerciale" — briefcase icon, "Générez une proposition personnalisée avec l'IA"
2. "Rapport client" — chart icon, "Rapport de performance PDF brandé"
3. "Présentation" — slides icon, "Deck de présentation style Gamma"

Each card: white/4% bg, icon (48px, violet accent), description, "Créer →" button

**Recent Documents Table:**
- Columns: Document | Type | Client | Date | Statut | Actions
- Status: Brouillon (gray), En cours (amber), Finalisé (green), Envoyé (blue)
- Actions: Ouvrir, Dupliquer, Télécharger PDF, Supprimer

**Document Editor (modal or new page):**
- Left: WYSIWYG editor with brand-aware formatting
- Right: AI assistant panel — "Enrichir cette section" | "Ajouter des données" | "Reformuler"
- Brand DNA integration: auto-applied colors, fonts, tone
- Export options: PDF, PPTX, Google Slides link

**Style:** #0A0A0F, document-focused, minimal distraction
**KB1 integration:** Document generation uses P1 (Anchoring) for opening, P4 (Credibility) for proof section, P19 (CTA) for closing
```

---

## 24 — TRANSCRIPTION DE RÉUNIONS

```
Design a dark-themed meeting transcription page for RAMI:

**Layout:** Sidebar + top bar

**Title:** "Transcriptions" + "+ Importer un audio" gradient button

**Upload Zone:**
- Drag & drop area: "Glissez un fichier audio (MP3, MP4, WAV — max 500MB)"
- Accepted formats listed
- Upload progress bar during import

**Transcription List:**
- Cards per transcription:
  - Title (editable): "Réunion client — 12 mars 2026"
  - Duration: "47:23"
  - Date transcribed: "il y a 2h"
  - Status: En cours (spinning icon) | Terminé (green check) | Erreur (red)
  - Actions: Ouvrir, Télécharger (.txt/.docx), Extraire verbatims, Supprimer

**Transcription Detail View:**
- Split view:
  - Left (60%): Full transcript text with speaker identification
  - Right (40%): "Verbatims clés" extracted by AI
    - Each verbatim: quote in italic + speaker name + timestamp
    - "Utiliser dans un post" button per verbatim
    - "Utiliser dans une offre commerciale" button
- Audio player bar at top: play/pause, scrub, speed (1x/1.5x/2x)
- Click on transcript text → audio jumps to that timestamp

**Style:** #0A0A0F, text-heavy, clean reading experience
**KB video integration:** Voice-to-content concept — audio → text → social content pipeline
```

---

## 25 — LEAD GEN (APOLLO)

```
Design a dark-themed lead generation page for RAMI (Apollo.io integration):

**Layout:** Sidebar + top bar

**Title:** "Leads" + "Rechercher des prospects" gradient button

**Search Panel (expandable card):**
- Fields:
  - Titre de poste: "Directeur Marketing" (text input)
  - Secteur: select dropdown
  - Localisation: "Casablanca, Maroc" (text with autocomplete)
  - Taille entreprise: multi-select chips (1-10, 11-50, 51-200, 201-1000, 1000+)
  - Technologies: tag input
- "Lancer la recherche" gradient button
- "Crédits restants : 847/1000" indicator

**Results Table:**
- Columns: Nom | Titre | Entreprise | Email | Tél | Score | Actions
- Score: AI-calculated fit score (0-100) with colored badge
- Actions: "Enrichir" | "Ajouter à séquence" | "Voir profil"
- Bulk select + bulk actions bar

**Lead Detail Sidebar (on click):**
- Full profile card:
  - Name, title, company, location
  - Email (verified/unverified badge)
  - Phone (if available)
  - LinkedIn URL
  - Company info: size, revenue, sector
- "Créer une offre commerciale" button (links to Documents)
- "Ajouter aux contacts" button
- Activity timeline: enrichment history

**Style:** #0A0A0F, CRM-style data density, clean table
```

---

## 26 — INBOX SOCIAL UNIFIÉ

```
Design a dark-themed unified social inbox for RAMI:

**Layout:** Sidebar + top bar

**Title:** "Inbox" with unread count badge (red dot + "12")

**3-Panel Layout:**

**Left (25%) — Conversation List:**
- Filter tabs: Tous | DMs | Commentaires | Mentions
- Platform filter chips: All | LinkedIn | Instagram | X | Facebook
- Search conversations
- List items:
  - Avatar (32px) + sender name
  - Platform icon (small, 16px)
  - Message preview (1 line, truncated)
  - Timestamp: "il y a 5min"
  - Unread: bold + blue dot
  - Sentiment indicator: 😊 positive (green) | 😐 neutral | 😡 negative (red)

**Center (50%) — Conversation Thread:**
- Header: sender name + platform + "Voir le post original" link
- Message thread: bubbles style
  - Incoming: white/6% bg, left-aligned
  - Outgoing: violet/10% bg, right-aligned
  - Timestamp on each message
- Reply box at bottom:
  - Text input + emoji picker + attachment
  - "Répondre" gradient button
  - AI assist: "✨ Suggestion IA" button generates a response draft based on Brand DNA tone

**Right (25%) — Contact Info:**
- Profile card: avatar, name, handle, platform
- Previous interactions count
- Sentiment history (sparkline)
- Brand DNA alignment note: "Ce contact correspond au persona 'PME Manager'"
- Quick actions: "Ajouter aux leads" | "Bloquer" | "Marquer comme spam"

**Style:** #0A0A0F, messaging-app feel, real-time indicators
**Market need:** #4 most requested feature (audit P5) — unified inbox, currently only Sprout at $499/user
```

---

## 27 — COMPETITOR ANALYSIS

```
Design a dark-themed competitor analysis dashboard for RAMI:

**Layout:** Sidebar + top bar

**Title:** "Analyse concurrentielle" + "Ajouter un concurrent" button

**Competitor Cards (horizontal row, scrollable):**
- Per competitor:
  - Logo/avatar (48px)
  - Name: "@CompetitorHandle"
  - Platform: LinkedIn/Instagram/X
  - Followers: "12.4K"
  - Post frequency: "4.2 posts/semaine"
  - Engagement rate: "3.1%"
  - Remove (X) button

**Comparison Section (below):**

**Chart 1 — Posting Frequency Comparison (bar chart):**
- Your brand vs competitors, side by side
- Per platform breakdown

**Chart 2 — Engagement Rate Trend (line chart):**
- You (violet line) vs competitors (gray lines)
- 30-day trend
- Hover tooltips

**Content Analysis Card:**
- Top performing competitor posts (3 examples):
  - Post screenshot/preview
  - Engagement stats
  - "Insight IA" : why this post worked (analysis based on Causse/Gestalt principles)
- "Inspirer mon prochain post" button

**Gap Analysis Card:**
- Table: Feature | Vous | Concurrent A | Concurrent B
- Green checkmarks vs red X
- "Recommandations" section based on gaps

**Style:** #0A0A0F, data-rich, comparison-focused
**Market need:** Predis.ai does this for $40/mo — RAMI must match + add Brand DNA scoring advantage
```

---

## 28 — LANDING PAGE MARKETING RAMI

```
Design a dark-themed marketing landing page for RAMI — "L'IA qui vise juste":

**Hero Section (full viewport height):**
- Background: #0A0A0F with animated gradient blobs (violet + blue), 40px grid
- Headline: "Vos visuels ne sont pas juste beaux." (white, 48px)
- Headline line 2: "Ils sont conçus pour produire un effet." (gradient violet-to-blue text)
- Subheadline: "RAMI crée du contenu social media calibré neuropsychologiquement — chaque couleur, chaque forme, chaque mot vise l'émotion précise de votre audience." (white/60%, 18px)
- CTA: "Commencer gratuitement" gradient button (large, 56px height) + "Voir la démo" ghost button
- Hero visual: animated dashboard mockup with Brand DNA score animating from 0 to 0.92
- Trust badges below: "Chiffrement AES-256 | Conforme RGPD & CNDP | Infrastructure EU"

**Section 2 — "Comment ça marche" (3 steps):**
- Step 1: "Configurez votre Brand DNA" — onboarding wizard screenshot + description
- Step 2: "L'IA génère du contenu calibré" — workflow screenshot showing Causse color analysis
- Step 3: "Publiez partout en 1 clic" — calendar screenshot + platform icons
- Each step: numbered circle (violet gradient), screenshot mockup, 2-line description

**Section 3 — "Ce que RAMI fait que personne ne fait" (4 features):**
- Feature cards (2×2 grid):
  1. "Neuropsychologie des couleurs (Causse)" — brain icon — "Chaque couleur est choisie pour produire un effet physiologique mesuré sur votre audience."
  2. "Psychologie des formes (Gestalt)" — shapes icon — "Cercles, triangles, lignes — chaque forme envoie un signal inconscient de confiance, dynamisme ou communauté."
  3. "Brand DNA persistant" — DNA icon — "Votre identité de marque infuse chaque contenu, chaque visuel, chaque mot — automatiquement."
  4. "Score d'alignement en temps réel" — gauge icon — "Chaque visuel reçoit un score objectif de cohérence avec votre marque. Pas d'intuition — de la science."
- Each card: white/4% bg, icon in violet circle, bold title, description

**Section 4 — Social Proof:**
- "Ils font confiance à RAMI" heading
- Logo cloud: 6 agency/brand logos (placeholder)
- 3 testimonial cards: photo + quote + name + title + company

**Section 5 — Pricing (same as screen #21 but embedded):**
- 5 plan cards: FREE → AGENCY+
- Most popular highlighted

**Section 6 — FAQ (accordion):**
- 8 questions with expandable answers
- Topics: pricing, Brand DNA, platforms, security, RGPD

**Footer:**
- 4 columns: Produit | Ressources | Entreprise | Légal
- Newsletter signup: email input + "S'inscrire" button
- Social links
- "RAMI by AI-MPower — L'IA qui vise juste." tagline
- CNDP compliance badge + RGPD badge

**Style:** #0A0A0F, marketing-grade polish, smooth scroll animations
**KB3 M6:** Peak-End rule — hero (peak opening) + pricing (peak decision) + CTA final (peak closing) = 3 power moments
**KB3 M1:** Anchoring — hero stat "0.92 Brand DNA score" anchors quality expectation immediately
**KB3 M8:** All section headings are conclusions, not descriptions — tell the story in titles alone
```

---

## ANNEXE — COMPOSANTS RÉUTILISABLES

Pour uniformiser les prompts Stitch, ces composants doivent rester cohérents :

### Sidebar (tous les écrans dashboard)
```
Left sidebar, 260px width, collapsible to 64px.
Background: #0A0A0F. RAMI logo top. Nav items: outline icons white/40%,
active item: violet left border 3px + bg white/6% + white text.
Bottom: user avatar 40px + name + plan badge pill.
```

### Top Bar (tous les écrans dashboard)
```
Top bar 64px height. Left: breadcrumb path in white.
Right: search bar (white/6% bg, rounded-xl) + notification bell
(with red dot if unread) + user avatar dropdown.
```

### Card Style (universel)
```
Background: rgba(255,255,255,0.04). Backdrop-blur-xl.
Border: 1px rgba(255,255,255,0.08). Border-radius: 16px (rounded-2xl).
Padding: 24px. Shadow: none (dark mode, no shadows needed).
```

### Input Style (universel)
```
Background: rgba(255,255,255,0.06). Border: 1px rgba(255,255,255,0.08).
Border-radius: 12px (rounded-xl). Padding: 12px 16px.
Focus: ring-2 ring-violet-500/50. Label: white/60% above, 13px.
Placeholder: white/30%.
```

### Button Styles
```
Primary CTA: gradient from #7C3AED to #2563EB, text white bold, rounded-xl,
  hover: from #6D28D9 to #1D4ED8, transition 200ms.
Ghost: transparent bg, white/60% text, white/8% border, hover: white/10% bg.
Danger: transparent bg, #EF4444 text, hover: red/10% bg.
```

### Status Badges
```
Published: bg green/10%, text #10B981, dot green.
Scheduled: bg blue/10%, text #3B82F6, dot blue.
Draft: bg white/6%, text white/40%, dot gray.
Failed: bg red/10%, text #EF4444, dot red.
Pending: bg amber/10%, text #F59E0B, dot amber.
```

---

## ANNEXE — INTÉGRATION VIDÉO (KB Création vidéo → RAMI)

Le workflow vidéo du KB peut être intégré comme module RAMI P2 :

### Pipeline vidéo RAMI (automatisé)
```
Brief texte → Claude Haiku génère le script (structure 7 parties KB)
         → ElevenLabs API clone voix tenant → voix off
         → Prompt Compiler Causse → storyboard 20 prompts (style KB prompt library)
         → Fal.ai / Replicate génère 20 images
         → Midjourney Animate (auto low-motion) ou RunwayML
         → Assemblage CapCut API ou FFmpeg
         → Export 9:16 (TikTok/Reels/Shorts) + 16:9 (YouTube/LinkedIn)
```

### Styles visuels du KB à intégrer dans RAMI Prompt Compiler
```
Les 40+ styles Midjourney du KB (Digital Toon Noir, Bold Graphic Minimalism,
Angular Retro, Flat Neon, etc.) deviennent des "Visual Presets" sélectionnables
dans le workflow Step 4, filtrés par objectif cognitif Causse :

Confiance  → Blueprint, Scientific, Dashboard, Corporate
Urgence    → Bold Graphic Minimalism, Angular Minimalist Action
Aspiration → Desaturated Heroic Silhouette, Cinematic Toon Frame
Expertise  → Flat Vector Illustration, Isometric Art
Communauté → Storybook Flat Frame, Neo-Flat Groove
Joie       → Electric Hypercolor, Flat Neon Cartoon, Cracked-Egg Whimsical
```

---

*Document généré le 2026-03-13 — RAMI by AI-MPower*
*28 écrans × prompt Stitch complet × palette RAMI × principes Causse/Gestalt/KB intégrés*
*« L'IA qui vise juste — en commençant par elle-même. »*
