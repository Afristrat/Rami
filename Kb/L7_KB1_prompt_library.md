# KB1 — BIBLIOTHÈQUE DE PROMPTS NOTEBOOKLM (Level 7)
## Prompts scientifiquement optimisés avec autoévaluation et recovery

---

## PRÉREQUIS OBLIGATOIRES

**Ordre strict : Notebook scanné → Persona configuré (KB5) → Prompts personnalisés (KB1)**

Chaque prompt ci-dessous contient des [VARIABLES] que le Gem remplace par le contenu détecté dans le notebook + les réponses de l'utilisateur. Le Gem ne génère JAMAIS un prompt avec des variables non remplies.

---

## PROTOCOLE DE LIVRAISON (Chaque prompt)

Pour CHAQUE prompt livré, le Gem suit ce protocole :

```
1. CONTEXTE → Pourquoi ce prompt maintenant, quelle dimension il couvre
2. PROMPT → En anglais, personnalisé, avec constraints
3. SAUVEGARDE → "Sauvegardez en NOTE '[NOM]' → ajoutez comme SOURCE"
4. CHECKPOINT → "Le résultat correspond à [objectif] ? Quelque chose manque ?"
5. SI PROBLÈME → Diagnostiquer, ajuster, relancer
6. SI OK → Transition vers le prompt suivant
```

---

## PRÉ-STAGE : PROMPT 0 (Conditionnel)

### [P0] THE SOURCE CLARIFIER

**Déclencheur** : Le Gem détecte que les sources sont brutes/informelles (notes, transcriptions, threads, brouillons). N'est PAS proposé si les sources sont déjà structurées.

**Science** : Cognitive Load Theory (Sweller) — réduire la charge extrinsèque avant le traitement profond.

**Où l'utiliser** : Dans le CHAT de NotebookLM.
**Sauvegarde** : NOTE "0_Structured_Source" → SOURCE

```
SOURCE DOCUMENT STRUCTURING — CHAIN OF THOUGHT

You are analyzing raw, unstructured content. Your task is to transform chaos into clarity.

THINK STEP BY STEP:

STEP 1 — IDENTIFY THE CORE
- What is this content fundamentally about? (one sentence)
- What is the main argument, story, or proposition?
- What would a 30-second elevator pitch of this content sound like?

STEP 2 — EXTRACT ALL DATA
- List EVERY number, statistic, percentage, date, metric, amount
- For each, note: what it measures, its context, and its significance
- Flag any data that seems inconsistent or needs verification

STEP 3 — MAP STAKEHOLDERS
- Who created this content and why?
- Who is the intended audience?
- What expertise level is assumed?
- What action is the audience expected to take?

STEP 4 — RESTRUCTURE
Reorganize ALL content into logical sections:
- Section 1: [Theme] — key points with supporting evidence
- Section 2: [Theme] — key points with supporting evidence
- [continue until all content is covered]

STEP 5 — GAP ANALYSIS
- What information seems incomplete or absent?
- What would strengthen this content?
- What questions would the audience likely ask?

STEP 6 — CLEAN REWRITE
Produce the complete content rewritten in clear, structured paragraphs:
- ZERO content loss — every data point, argument, and detail preserved
- Remove only duplicates and tangents
- Organize by importance or chronology
- Use headers and subheaders for navigation

CONSTRAINTS:
- Do NOT add any information not in the original source
- Do NOT change numbers or statistics
- Do NOT remove content because it seems less important — preserve everything
- Flag uncertainty with [NEEDS VERIFICATION] tags

OUTPUT FORMAT:
Structured document with headers, clean paragraphs, all data preserved, gap analysis at the end.
```

**Autoévaluation du résultat (que le Gem vérifie mentalement) :**
- Toutes les données chiffrées de la source originale sont-elles préservées ?
- La structure est-elle logique et navigable ?
- Le gap analysis identifie-t-il des manques réels ?

**Recovery si échec :**
- Résultat trop court → "Le résultat semble incomplet. Relancez le prompt en ajoutant : 'Ensure COMPLETE coverage of ALL sections. Do not summarize — preserve full detail.'"
- Résultat invente du contenu → "NotebookLM a ajouté des informations non présentes dans vos sources. Relancez en insistant : 'Use ONLY information from the uploaded sources. Do NOT add external knowledge.'"

---

## STAGE 1 : EXTRACTION (P1-P5)

### Personnalisation par secteur

AVANT de générer chaque prompt du Stage 1, le Gem insère les hints sectoriels :

| Secteur | [ANCHORING_HINT] pour P1 | [CREDIBILITY_HINT] pour P4 | [JARGON_LIST] pour P5 |
|---------|--------------------------|---------------------------|----------------------|
| Tech/SaaS | "Focus on: MRR, ARR, churn rate, CAC, LTV, growth %, user count" | "Focus on: user testimonials, uptime SLA, integration partners, tech certifications" | "Technical terms to flag: API, SaaS, ML, cloud, containerization, microservices" |
| Agroalimentaire | "Focus on: production volumes, export %, yield, certifications" | "Focus on: ONSSA certifications, organic labels, distribution partners" | "Technical terms to flag: traçabilité, chaîne du froid, normes sanitaires" |
| Santé | "Focus on: patients treated, success rates, coverage %, clinical outcomes" | "Focus on: accreditations, clinical protocols, peer-reviewed publications" | "Technical terms to flag: all medical terminology, drug names, clinical procedures" |
| Finance | "Focus on: ROI, portfolio size, returns, risk metrics" | "Focus on: regulatory approvals, industry rankings, track record years" | "Technical terms to flag: all financial instruments, regulatory terms" |
| Éducation | "Focus on: learners trained, insertion rate, satisfaction scores" | "Focus on: accreditations, university partnerships, alumni outcomes" | "Technical terms to flag: pedagogical methods, assessment frameworks" |
| Industrie/Logistique | "Focus on: production volumes, lead times, defect rates, cost savings" | "Focus on: ISO certifications, major client references, safety records" | "Technical terms to flag: lean, six sigma, supply chain, WMS, TMS" |
| Immobilier | "Focus on: m², price/m², rental yield, occupancy rates" | "Focus on: projects delivered, banking partners, permits" | "Technical terms to flag: legal property terms, zoning, building codes" |
| Tourisme | "Focus on: nights sold, occupancy rate, RevPAR, visitor count" | "Focus on: star ratings, travel labels, review scores" | "Technical terms to flag: hospitality terms, booking metrics" |

---

### [P1] THE ANCHORING INSIGHT

**Science** : Kahneman (anchoring bias — le premier chiffre cadre toute la perception) + Borkin Harvard/MIT (conclusion titles = 2x recall)
**Dimension** : ACCROCHE — le fait qui capture l'attention en premier
**Sauvegarde** : NOTE "1_Anchoring" → SOURCE

```
ANCHORING INSIGHT EXTRACTION — EVIDENCE-BASED

You are a data strategist. Your mission: find the ONE most powerful anchoring fact in this content.

CONTEXT: This content is about [TOPIC detected from notebook] for an audience of [AUDIENCE from persona].

THINK STEP BY STEP:

STEP 1 — SCAN FOR CANDIDATES
List ALL potential anchoring elements:
- Every statistic, number, percentage
- Every surprising fact or counterintuitive finding
- Every comparison (before/after, us/them, old/new)
- Every record, first, biggest, fastest claim
[ANCHORING_HINT]

STEP 2 — SCORE EACH CANDIDATE
For each candidate, evaluate (1-5):
- SURPRISE: How unexpected is this for the target audience?
- MEMORABILITY: Would someone repeat this at dinner?
- RELEVANCE: Does it connect to the core message?
- CREDIBILITY: Is it verifiable and specific?

STEP 3 — SELECT THE WINNER
Pick the candidate with the highest combined score.
Explain WHY it's the strongest anchor in 2 sentences.

STEP 4 — FRAME IT
Rewrite this fact as:
a) A headline (max 10 words, conclusion-style per Borkin research — NOT a category title like "Revenue Growth" but a conclusion like "Revenue Tripled in 18 Months")
b) An opening statement for a presentation (1 sentence)
c) An opening hook for a podcast (2-3 sentences, conversational)
d) A pull-quote for an infographic

STEP 5 — BACKUP ANCHORS
Provide 2 additional anchoring facts (ranked #2 and #3) with the same framing, in case the primary doesn't fit the final format.

CONSTRAINTS:
- The anchoring fact MUST come from the source material — never invented
- Numbers must be exact as stated in the source
- If no strong quantitative data exists, use the most surprising qualitative finding
- Frame positively when possible (Positive Framing research: "95% success" > "5% failure")

OUTPUT FORMAT:
- Primary anchor: [fact] — Score: [X/20] — Framing: [headline / opening / hook / pull-quote]
- Backup #2: [fact] — Score: [X/20] — Framing: [same 4 formats]
- Backup #3: [fact] — Score: [X/20] — Framing: [same 4 formats]
```

**Autoévaluation :**
- L'anchor vient-il réellement des sources ? Pas d'invention ?
- Le score est-il justifié ou auto-gonflé ?
- Les 4 framings sont-ils réellement différents (pas des reformulations identiques) ?

**Recovery :**
- Résultat trop générique → Ajouter : "Be MORE specific. Use EXACT numbers from the source. Generic claims like 'significant growth' are NOT anchors."
- Aucune donnée chiffrée → Ajouter : "No quantitative data found? Use the most SURPRISING qualitative finding. What in this content would make someone say 'I didn't know that'?"

---

### [P2] THE STORY ARCHITECT

**Science** : McGill narrative (les histoires sont retenues 22x mieux que les faits seuls) + Kahneman peak-end rule (on retient le pic émotionnel et la fin)
**Dimension** : NARRATION — transformer les faits en histoire mémorable
**Sauvegarde** : NOTE "2_Story" → SOURCE

```
NARRATIVE ARCHITECTURE — SCIENCE-BACKED STORYTELLING

You are a narrative strategist. Your mission: transform this content into a story structure that maximizes retention.

CONTEXT: [TOPIC] for [AUDIENCE]. The anchoring fact is: [INSERT P1 RESULT or let NotebookLM reference the 1_Anchoring note].

THINK STEP BY STEP:

STEP 1 — IDENTIFY THE NARRATIVE ARC
Which story structure fits this content best?
a) PROBLEM → SOLUTION → RESULT (best for business/consulting)
b) BEFORE → TRANSFORMATION → AFTER (best for case studies)
c) QUESTION → EXPLORATION → INSIGHT (best for academic/research)
d) CHALLENGE → JOURNEY → BREAKTHROUGH (best for entrepreneurship)
e) STATUS QUO → DISRUPTION → NEW NORMAL (best for innovation/tech)

Select ONE and justify your choice in 1 sentence.

STEP 2 — MAP THE PEAK-END STRUCTURE (Kahneman)
- OPENING (Hook): How does the story start? What creates immediate curiosity?
- RISING ACTION: What builds tension or interest? What complications or dimensions emerge?
- PEAK MOMENT: What is the single most powerful insight, result, or revelation? (This is what the audience will remember most)
- RESOLUTION: How does it come together? What's the synthesis?
- CLOSING (End): What's the final takeaway? What does the audience DO with this?

STEP 3 — EMOTIONAL MAP
For each section above, identify the dominant emotion:
- Curiosity / Surprise / Concern / Hope / Confidence / Urgency / Inspiration
The emotional arc should VARY — never flat.

STEP 4 — 22X RETENTION ELEMENTS (McGill research)
Embed at least 3 of these narrative devices:
- Specific character or protagonist (even in B2B: "A logistics manager in Casablanca discovered...")
- Concrete sensory detail (time, place, specific situation)
- Tension or conflict (what was at stake?)
- Unexpected turn (what surprised everyone?)
- Universal theme (what makes this relatable beyond the specific context?)

STEP 5 — COMPLETE NARRATIVE OUTLINE
Write a detailed outline (not full text) covering:
- Each section (Opening → Peak → Closing)
- Key points per section
- Transition sentences between sections
- Where to place the anchoring fact for maximum impact
- Estimated time allocation per section (for podcast/presentation pacing)

CONSTRAINTS:
- Every narrative element must be traceable to the source material
- The peak moment must be the strongest single insight in the content
- The closing must include a clear call-to-action or takeaway
- Do NOT fictionalize — use real elements from the source
- Emotional map must show variation (no flat line)

OUTPUT FORMAT:
1. Selected arc: [name] — Rationale: [1 sentence]
2. Peak-End structure: [5 sections with content]
3. Emotional map: [emotion per section]
4. Retention devices used: [list with examples]
5. Complete narrative outline: [detailed]
```

**Autoévaluation :**
- L'arc narratif est-il cohérent du début à la fin ?
- Le peak moment est-il réellement le point le plus fort du contenu ?
- L'emotional map montre-t-elle une variation (pas un sentiment unique tout du long) ?
- Au moins 3 dispositifs de rétention sont-ils présents ?

**Recovery :**
- Résultat trop "listé" (pas d'arc) → "The output reads like a list, not a story. Rewrite with CLEAR transitions between sections and an emotional arc that builds toward the peak."
- Peak moment faible → "The peak moment should be the STRONGEST single insight. What in this content would make the audience lean forward? Identify THAT moment."

---

### [P3] THE VISUAL STRATEGIST

**Science** : Bar-Ilan PNAS 2022 (images ≥ 1/3 de la surface = 2x engagement) + Von Restorff (l'élément visuellement distinctif est retenu en premier)
**Dimension** : VISUEL — stratégie de mémorabilité visuelle
**Sauvegarde** : NOTE "3_Visual" → SOURCE

```
VISUAL STRATEGY — MEMORABILITY-OPTIMIZED

You are a visual communication strategist. Your mission: design a visual strategy that makes this content impossible to forget.

CONTEXT: [TOPIC] for [AUDIENCE]. The key narrative is: [reference 2_Story note].

THINK STEP BY STEP:

STEP 1 — VISUAL INVENTORY
What visual elements does this content naturally contain or suggest?
- Data that can be charted (numbers, trends, comparisons)
- Processes that can be diagrammed (steps, flows, cycles)
- Hierarchies that can be structured (pyramids, trees, layers)
- Relationships that can be mapped (networks, connections, dependencies)
- Contrasts that can be shown (before/after, with/without, old/new)

STEP 2 — HERO VISUAL (Bar-Ilan principle)
Identify the ONE dominant visual that should occupy ≥ 1/3 of visual space:
- What single image, chart, or diagram best communicates the core message?
- Why this one? What makes it the strongest visual anchor?
- How should it be sized relative to other elements?

STEP 3 — VON RESTORFF ELEMENT
Design ONE element that breaks the visual pattern:
- A contrasting color on the key data point
- An oversized number or statistic
- A visual metaphor that interrupts the expected layout
- Purpose: this element should be what the audience remembers FIRST

STEP 4 — VISUAL HIERARCHY
Rank all visual elements by importance:
1. [Most important — largest, most prominent]
2. [Second — supporting the hero]
3. [Third — context and detail]
4. [Fourth and below — background, citations]

STEP 5 — CHART TYPE RECOMMENDATIONS
For each data point that can be visualized:
- [Data description] → Recommended chart type + WHY
- CONSTRAINTS: No pie charts (perceptual research shows bars are always clearer). No 3D effects. Integrated labels (no separate legends).

STEP 6 — COLOR STRATEGY
Based on the persona's brand colors [PERSONA_COLORS or sector defaults]:
- Primary data color: [hex]
- Contrast/highlight color: [hex]
- Background: [hex]
- Rule: Maximum 3 colors + 1 accent. More = visual noise.

CONSTRAINTS:
- Hero visual must represent ≥ 1/3 of the total visual surface
- Von Restorff element must be visually distinct from ALL other elements
- No pie charts under any circumstance
- No decorative visuals that don't convey information
- Minimum 40% whitespace (Pracejus JCR research: whitespace = premium perception)
- All text on visuals: maximum 6 words per bullet, maximum 3 bullets per group

OUTPUT FORMAT:
1. Visual inventory: [categorized list]
2. Hero visual: [description + sizing rationale]
3. Von Restorff element: [description + placement]
4. Hierarchy: [ranked list]
5. Chart recommendations: [data → chart type + justification]
6. Color strategy: [hex codes + usage rules]
```

**Autoévaluation :**
- Le hero visual représente-t-il ≥ 1/3 de la surface ?
- Le Von Restorff est-il réellement distinctif ?
- Zéro pie chart ?
- Minimum 40% whitespace respecté ?

**Recovery :**
- Résultat trop générique → "Be SPECIFIC. Don't say 'a chart showing growth.' Say 'A horizontal bar chart comparing [X] vs [Y] with the winning bar in [accent color], data labels integrated, occupying the top half of the infographic.'"
- Pas de données à visualiser → "Even without quantitative data, you can visualize: processes as flowcharts, comparisons as side-by-side panels, hierarchies as layered diagrams. What STRUCTURE does this content have?"

---

### [P4] THE CREDIBILITY COLLECTOR

**Science** : Stanford Web Credibility Research (specific details = perceived credibility) + Spiegel (reviews with specifics convert 270% more)
**Dimension** : CRÉDIBILITÉ — preuves tangibles
**Sauvegarde** : NOTE "4_Credibility" → SOURCE

```
CREDIBILITY EXTRACTION — SPECIFICITY-DRIVEN

You are a credibility analyst. Your mission: extract every element that makes this content believable and trustworthy.

CONTEXT: [TOPIC] for [AUDIENCE]. [CREDIBILITY_HINT from sector table]

THINK STEP BY STEP:

STEP 1 — EVIDENCE INVENTORY
Scan the source for ALL credibility signals. Categorize each:

A) QUANTITATIVE EVIDENCE
- Exact numbers, statistics, percentages (not rounded, not vague)
- Dates, durations, timelines
- Measurements, sizes, quantities

B) AUTHORITY SIGNALS
- Expert names, titles, institutions mentioned
- Certifications, accreditations, awards
- Publications, peer-reviewed references
- Years of experience, track records

C) SOCIAL PROOF
- Testimonials, quotes (with attribution)
- Case studies, client references
- User counts, adoption metrics
- Reviews, ratings, endorsements

D) METHODOLOGY SIGNALS
- How were results obtained?
- What methodology was used?
- What sample size, time period, geography?
- What limitations are acknowledged?

STEP 2 — SPECIFICITY SCORING (Spiegel research)
For each evidence element, score specificity (1-5):
- 1: Vague ("many companies use it")
- 2: Somewhat specific ("over 100 companies")
- 3: Specific ("127 companies in 2024")
- 4: Very specific ("127 companies across 8 industries in Morocco during Q1-Q3 2024")
- 5: Ultra-specific with context ("127 companies... up from 43 in 2022, representing 195% growth")

STEP 3 — TOP 5 CREDIBILITY ANCHORS
Rank the 5 strongest credibility elements by combined authority + specificity.
For each: [Evidence] — Authority score: X/5 — Specificity score: X/5 — Total: X/10

STEP 4 — CREDIBILITY GAPS
What's MISSING that would strengthen credibility?
- Missing sources or attribution?
- Vague claims that need specifics?
- Missing methodology details?
- Missing social proof or third-party validation?

For each gap, suggest what TYPE of evidence would fill it (even if the source doesn't contain it — flag as [NEEDS EXTERNAL DATA]).

STEP 5 — CREDIBILITY SCRIPT
Write a 3-sentence "credibility bridge" that naturally integrates the top 3 evidence points into a compelling trust statement. This will be used in the podcast and presentation.

CONSTRAINTS:
- Never invent evidence. Only extract from sources.
- Flag any claim that appears in the content WITHOUT supporting evidence as [UNSUPPORTED CLAIM]
- Round numbers reduce credibility. Preserve exact figures.
- "Studies show" without citation = [WEAK SOURCE] — flag it
- Attribution must include: name, title/role, institution when available

OUTPUT FORMAT:
1. Evidence inventory: [categorized with specificity scores]
2. Top 5 credibility anchors: [ranked with scores]
3. Credibility gaps: [list with suggested fills]
4. Credibility bridge: [3-sentence script]
5. Unsupported claims: [flagged list]
```

**Autoévaluation :**
- Les claims non-supportés sont-ils bien flaggés ?
- Les scores de spécificité sont-ils honnêtes (pas auto-gonflés) ?
- Le credibility bridge est-il naturel, pas forcé ?

**Recovery :**
- Contenu faible en preuves → "This content has limited evidence. Focus on: methodology signals, any specific details (dates, names, places), and the strongest single data point. Even ONE specific number beats ten vague claims."
- Trop de claims non-supportés → "Multiple unsupported claims detected. Recommend the user add supporting evidence to their notebook sources before generating content."

---

### [P5] THE CLARITY SCOUT

**Science** : Mayer Cognitive Load Theory (d=0.85 for pre-training) + Reber/Schwarz Processing Fluency (easier to read = more believable)
**Dimension** : CLARTÉ — accessibilité cognitive
**Sauvegarde** : NOTE "5_Clarity" → SOURCE

```
CLARITY AUDIT — COGNITIVE LOAD OPTIMIZATION

You are a cognitive accessibility analyst. Your mission: ensure this content is instantly understandable by the target audience.

CONTEXT: [TOPIC]. Target audience: [AUDIENCE] with [EXPERTISE_LEVEL] expertise. [JARGON_LIST from sector table]

THINK STEP BY STEP:

STEP 1 — JARGON DETECTION
Scan for ALL terms that a [EXPERTISE_LEVEL] audience might not immediately understand:
- Technical terms from the domain
- Acronyms (even common ones)
- Assumed knowledge (concepts the source takes for granted)
- Industry-specific metrics
For each: [Term] → [Plain language equivalent] → [Keep/Replace/Define first use]

STEP 2 — COMPLEXITY MAPPING
Identify the 3 most complex concepts in the content:
For each:
- What makes it complex? (abstract, multi-layered, counter-intuitive, unfamiliar)
- What analogy from everyday life could explain it?
- What prerequisite knowledge is needed? (Mayer pre-training principle)
- What visualization would simplify it?

STEP 3 — READING LEVEL ASSESSMENT
Estimate the current reading level:
- Current: [approximate grade level / complexity]
- Target: [based on audience]
- Gap: [adjustment needed]

Specific recommendations:
- Sentences to shorten (flag any > 25 words)
- Passive voice to convert to active
- Abstract statements to make concrete
- Double negatives to simplify

STEP 4 — PRE-TRAINING ELEMENTS (Mayer, d=0.85)
What should the audience know BEFORE diving into the main content?
Design 2-3 "pre-training" elements:
- Key definition #1: [term] = [simple explanation + example]
- Key definition #2: [term] = [simple explanation + example]
- Key context: [1-2 sentences of essential background]

These become the opening slides in a presentation or the introduction in a podcast.

STEP 5 — FLUENCY OPTIMIZATION (Reber/Schwarz)
Processing fluency recommendations:
- Font/formatting suggestions for maximum readability
- Sentence structure improvements (shorter, active, concrete)
- Number presentation (round for speech, exact for text)
- Transition quality between sections

CONSTRAINTS:
- Do NOT dumb down — CLARIFY. The intelligence level stays the same, the accessibility increases.
- Every technical term kept must be justified (no unnecessary jargon)
- Analogies must be appropriate for the audience's cultural context
- Pre-training elements should take < 2 minutes to consume

OUTPUT FORMAT:
1. Jargon register: [term → plain language → recommendation]
2. Complexity map: [3 concepts with analogies and prerequisites]
3. Reading level: [current → target → gap]
4. Pre-training elements: [2-3 elements ready to use]
5. Fluency recommendations: [specific, actionable list]
```

**Autoévaluation :**
- Le jargon register est-il exhaustif ?
- Les analogies sont-elles pertinentes pour L'AUDIENCE SPÉCIFIQUE (pas génériques) ?
- Les pre-training elements sont-ils réellement utiles ou évidents ?

**Recovery :**
- Audience mal calibrée → "The clarity audit seems calibrated for [detected level]. But the audience is [actual level]. Re-run with: 'Target audience is [LEVEL]. Adjust ALL recommendations for this specific expertise level.'"

---

## STAGE 2 : SYNTHÈSE (P6)

### [P6] STRATEGY MASTER SYNTHESIZER

**Science** : Cross-dimensional integration — combiner 5 perspectives en une stratégie cohérente
**Sauvegarde** : NOTE "6_Strategy_Master" → SOURCE (ce document guide TOUTE la génération Stage 3)

```
STRATEGY MASTER — UNIFIED CONTENT SYNTHESIS

You have 5 specialized analyses in your notes (1_Anchoring, 2_Story, 3_Visual, 4_Credibility, 5_Clarity). Your mission: synthesize them into ONE unified content strategy.

THINK STEP BY STEP:

STEP 1 — CROSS-REFERENCE CHECK
Verify consistency across the 5 analyses:
- Does the narrative arc (2_Story) properly feature the anchoring fact (1_Anchoring)?
- Does the visual strategy (3_Visual) support the narrative peaks?
- Are the credibility elements (4_Credibility) integrated at the right moments?
- Does the clarity audit (5_Clarity) apply to ALL elements?
Flag any CONTRADICTIONS between analyses.

STEP 2 — UNIFIED CONTENT STRATEGY
Create a single, coherent strategy document:

A) CORE MESSAGE (1 sentence — the single takeaway)
B) OPENING HOOK (using the #1 anchoring fact, framed per narrative arc)
C) NARRATIVE FLOW (from 2_Story, enriched with credibility points from 4_Credibility)
   - Section 1: [content] — visual: [from 3_Visual] — credibility: [from 4_Credibility]
   - Section 2: [content] — visual: [from 3_Visual] — credibility: [from 4_Credibility]
   - [continue for all sections]
D) PEAK MOMENT (the single strongest point — visual + emotional + factual combined)
E) CLOSING + CTA (from 2_Story closing + 4_Credibility final trust statement)
F) PRE-TRAINING (from 5_Clarity — what the audience needs to know first)
G) JARGON DECISIONS (from 5_Clarity — what to keep, what to simplify)

STEP 3 — FORMAT-SPECIFIC NOTES
For each target format, note adaptations:
- PODCAST: [pacing, tone shifts, emphasis points, conversational bridges]
- INFOGRAPHIC: [data hierarchy, hero visual, layout recommendation]
- PRESENTATION: [slide flow, key slides, transition animations]

STEP 4 — QUALITY SELF-CHECK
Score this strategy (1-5 per dimension):
- Anchoring strength: /5
- Narrative coherence: /5
- Visual memorability: /5
- Credibility depth: /5
- Clarity/accessibility: /5
- TOTAL: /25

If any dimension < 3: identify the weakness and recommend returning to that Stage 1 prompt.

CONSTRAINTS:
- Every element must be traceable to one of the 5 source notes
- No new information added — synthesis only
- Core message must be expressible in one sentence
- Strategy must work for ALL three formats (podcast, infographic, presentation)

OUTPUT FORMAT:
Complete Strategy_Master document following the A-G structure above, with quality scores.
```

**Autoévaluation :**
- Le core message tient-il en UNE phrase ?
- Les contradictions entre analyses sont-elles résolues ?
- Le quality self-check montre-t-il des scores ≥ 3/5 sur toutes les dimensions ?

**Recovery :**
- Score < 3 sur une dimension → "Your Strategy_Master scores low on [dimension]. I recommend re-running [corresponding P1-P5 prompt] with more specific guidance before generating content."
- Contradictions non résolues → "I found a conflict between your narrative arc and your visual strategy. Let's resolve this: [describe conflict]. Which direction do you prefer?"

---

## STAGE 3 : GÉNÉRATION (P7-P11)

### [P7] PODCAST NARRATIVE EXTRACTION

**Sauvegarde** : NOTE "7_Podcast_Script" → SOURCE

```
PODCAST NARRATIVE ADAPTATION

Using the Strategy_Master (6_Strategy_Master note), create a podcast-optimized narrative.

ADAPT FOR AUDIO:
1. CONVERSATIONAL TONE — Rewrite all content as natural spoken language. No bullet points, no visual references.
2. VOCAL EMPHASIS MARKERS — Mark key moments with [EMPHASIS] tags for the hosts to stress
3. PEAK-END PACING — The peak moment should fall at approximately 60-70% of the content
4. OPENING HOOK — First 30 seconds must grab attention (use the anchoring fact as a question or provocative statement)
5. LISTENER ENGAGEMENT — Include 2-3 rhetorical questions that make the listener think
6. CLOSING IMPACT — End with the single most memorable takeaway + a call to action

STRUCTURE:
- Cold open / Hook (30 sec)
- Context setting (1-2 min)
- Main exploration (varies)
- Peak moment (key insight)
- Synthesis + takeaway (1 min)
- Call to action (30 sec)

PRE-TRAINING: Include a brief explanation of [terms from 5_Clarity] at natural points in the conversation.

CONSTRAINTS:
- Written for TWO hosts having a natural conversation
- No jargon without immediate explanation
- Numbers rounded for speech (exact in show notes)
- Total script length: targeting [3-5 / 5-10] minutes based on content density
```

### [P8] PODCAST GENERATION (Audio Studio)

**Où l'utiliser** : Dans NotebookLM → Audio Overview → Customize

```
Generate an audio discussion based on the Strategy_Master and Podcast Script in my notes. 

STYLE: Two hosts having a genuine, engaging conversation. Not a lecture — a dialogue where both hosts react, question, and build on each other's points.

MUST INCLUDE:
- Open with: [ANCHORING FACT from P1 as a provocative question]
- Peak moment at ~60-70% of the episode
- At least 2 moments where a host says "Wait, really?" or equivalent surprise
- Close with: [CTA from Strategy_Master]

MUST AVOID:
- Monotone delivery
- Reading a script verbatim
- Undefined jargon
- Longer than [X] minutes
```

### [P9] INFOGRAPHIC DATA EXTRACTION

**Sauvegarde** : NOTE "9_Infographic_Data" → SOURCE

```
INFOGRAPHIC DATA EXTRACTION

Using the Strategy_Master (6_Strategy_Master note), extract and structure ALL data for visual representation.

EXTRACT:
1. PRIMARY METRIC — The single most important number/fact (hero visual)
2. SUPPORTING METRICS — 3-5 additional data points ranked by importance
3. COMPARISON DATA — Any before/after, with/without, or competitive comparisons
4. PROCESS/FLOW — Any sequential information (steps, timeline, evolution)
5. HIERARCHY — Any ranked or layered information

FOR EACH DATA POINT:
- Exact value (from source)
- Context sentence (what it means)
- Recommended visualization (bar, line, icon, number highlight — NO pie charts)
- Importance rank (1-5)

CONSTRAINTS:
- All data from sources only
- No rounding (preserve exact numbers)
- No pie charts
- Maximum 7 data points total (cognitive limit)
- Each data point must have context — no orphan numbers

OUTPUT:
Structured data sheet ready for infographic generation, with hero metric identified and visualization recommendations.
```

### [P10] INFOGRAPHIC GENERATION

Le Gem consulte **KB4** pour guider les 6 choix (layout, style, palette, ratio, détail, corrections) AVANT de générer ce prompt. Le prompt final est assemblé dynamiquement — voir KB4 pour la logique d'assemblage.

### [P11] MASTER PRESENTATION PROMPT

**Sauvegarde** : Résultat utilisé directement ou copié dans Google Slides/PowerPoint

```
PRESENTATION GENERATION — SLIDE-BY-SLIDE

Using the Strategy_Master, generate a complete slide deck.

STRUCTURE:
1. TITLE SLIDE — [Title as conclusion, not category] + subtitle + attribution from persona
2. PRE-TRAINING SLIDE(S) — Key definitions from 5_Clarity (Mayer d=0.85)
3. HOOK SLIDE — Anchoring fact from P1, large typography, minimal text
4. NARRATIVE SLIDES — Following the arc from 2_Story:
   - One concept per slide
   - Maximum 6 words per bullet, 3 bullets per slide
   - Visual dominant (≥50% of slide surface)
   - Speaker notes included for each slide
5. PEAK SLIDE — Most impactful insight, full-bleed visual treatment
6. CREDIBILITY SLIDE — Top evidence from P4 (specific numbers, sources)
7. SYNTHESIS SLIDE — Core message in one sentence
8. CTA SLIDE — Clear call to action + contact information

DESIGN PRINCIPLES:
- Whitespace: minimum 40% per slide
- Colors: [PERSONA_COLORS — primary, secondary, accent]
- Typography: [high contrast, sans-serif recommended]
- No pie charts. Bars or highlighted numbers only.
- Von Restorff: ONE element per slide that breaks the pattern

FOR EACH SLIDE:
- Slide title (conclusion-style, not category)
- Visual description (what should be shown)
- Text content (exact words)
- Speaker notes (what to say)
- Transition to next slide

CONSTRAINTS:
- Maximum 12 slides for a 10-minute presentation
- Every slide must advance the narrative — no filler
- Title = conclusion, never category (Borkin research)
```

**Autoévaluation globale Stage 3 :**
- Le format généré exploite-t-il le Strategy_Master ?
- Le persona (ton, couleurs, mentions) est-il reflété ?
- Les contraintes scientifiques sont-elles respectées ?
