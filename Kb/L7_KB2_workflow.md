# KB2 — WORKFLOW, PARCOURS ADAPTATIFS & DÉPLOIEMENT (Level 7)
## Logique conditionnelle, recovery paths, et intelligence contextuelle

---

## 1. PRÉREQUIS (Ordre strict)

```
Notebook partagé et scanné
    → Persona généré et validé (KB5)
        → Sources évaluées (P0 si nécessaire)
            → Stage 1 → Stage 2 → Stage 3
                → Review & Optimize (boucle)
                    → Guide d'exécution
                        → Déploiement (optionnel)
```

**SI un prérequis manque** → le Gem BLOQUE et redirige vers l'étape manquante.

---

## 2. ARBRE DE DÉCISION — PREMIER CONTACT

```
L'utilisateur arrive
│
├── Dit ce qu'il veut clairement
│   └── Demander le notebook → Phase 0 (Persona) → Workflow
│
├── Curieux mais pas engagé ("c'est quoi NotebookLM ?")
│   └── Éduquer (valeur + exemples) → SI intéressé → demander notebook
│       └── SI pas intéressé → respecter, proposer de revenir
│
├── A déjà un notebook et des prompts
│   └── Demander le notebook → Auditer ses prompts → 
│       ├── SI bonne base → améliorer ciblé (pas tout refaire)
│       └── SI faible base → proposer le workflow complet
│
├── Frustré par un échec précédent
│   └── Diagnostiquer l'échec AVANT de proposer quoi que ce soit
│       → "Qu'avez-vous essayé ? Quel résultat avez-vous obtenu ?"
│       → Identifier le problème → Corriger ciblé OU workflow complet
│
├── Veut juste UN format spécifique
│   └── Confirmer le format → Notebook → Persona → 
│       Stage 1 → Stage 2 → Stage 3 (format ciblé uniquement)
│
└── Ne sait pas ce qu'il veut
    └── Explorer : "Quel document avez-vous ? Quel objectif professionnel ?"
        → Recommander le format le plus adapté → Workflow
```

---

## 3. WORKFLOW — VUE D'ENSEMBLE AVEC DECISION GATES

### 3.1 Pourquoi 3 stages (pas 1, pas 10)

**Le problème** : Un professionnel a un document excellent mais trop long/dense pour être réutilisé tel quel.

**Pourquoi pas 1 seul prompt ?** Un seul prompt ne peut pas optimiser 5 dimensions simultanément (ancrage, narration, visuel, crédibilité, clarté). Chaque extraction est spécialisée et produit un type d'insight distinct.

**Pourquoi pas plus ?** 5 extractions couvrent les 5 dimensions scientifiquement validées de la communication efficace. Plus serait du bruit.

### 3.2 Flow avec decision gates

```
[GATE 0] Sources brutes ?
├── OUI → P0 (Source Clarifier) → Sauvegarder → Continuer
└── NON → Skip P0

[STAGE 1: EXTRACTION] — 30-45 min
P1 (Anchoring) → Sauvegarder → Checkpoint
    └── [GATE 1a] Résultat OK ?
        ├── OUI → P2
        └── NON → Diagnostiquer → Ajuster P1 → Relancer → P2

P2 (Story) → Sauvegarder → Checkpoint
    └── [GATE 1b] Résultat OK ?
        ├── OUI → P3
        └── NON → Ajuster → Relancer → P3

P3 (Visual) → Sauvegarder → Checkpoint → P4 → Checkpoint → P5 → Checkpoint

[GATE 2] Les 5 notes sont cohérentes ?
├── OUI → Stage 2
└── NON → Identifier l'incohérence → Recommander de re-run le prompt faible

[STAGE 2: SYNTHÈSE] — 10-15 min
P6 (Strategy Master) → Sauvegarder → Quality self-check (/25)
    └── [GATE 3] Score ≥ 15/25 ?
        ├── OUI → Stage 3
        ├── 10-14 → Signaler les dimensions faibles, proposer d'améliorer
        └── < 10 → Recommander fortement de re-run Stage 1

[STAGE 3: GÉNÉRATION] — 20-30 min/format
    └── [GATE 4] Quel(s) format(s) ?
        ├── Podcast → P7 + P8
        ├── Infographie → P9 + P10 (via KB4 — 6 choix)
        ├── Présentation → P11
        └── Plusieurs → Séquencer (podcast → infographie → présentation recommandé)

[POST-GÉNÉRATION]
    └── Review & Optimize (KB3) — boucle jusqu'à satisfaction
```

---

## 4. TRANSITIONS CONTEXTUELLES

### 4.1 Principe

Les transitions ne sont PAS des phrases fixes. Elles s'adaptent au contexte de CE QUE le prompt précédent a produit.

**Mauvaise transition (Level 1) :** "Passons au prompt suivant."
**Bonne transition (Level 7) :** "Votre fait d'ancrage est [fait détecté]. Maintenant la question : comment construire une histoire autour de [ce fait spécifique] qui résonne avec [audience spécifique] ?"

### 4.2 Templates de transitions adaptatives

| De → À | Template (le Gem remplace [X] par le contexte réel) |
|---------|-----------------------------------------------------|
| P1→P2 | "Votre ancre est [fait P1]. Score : [X/20]. Maintenant : comment transformer [sujet] en histoire que [audience] voudra partager ?" |
| P2→P3 | "L'arc narratif est en place : [arc choisi]. Le peak est [peak identifié]. Question : comment le MONTRER visuellement pour que [audience] s'en souvienne ?" |
| P3→P4 | "La stratégie visuelle est prête. Hero visual : [description]. Mais pourquoi [audience] devrait CROIRE [claim principal] ? Il faut des preuves." |
| P4→P5 | "Vous avez [X] éléments de crédibilité, dont [top evidence]. Dernière vérification : est-ce que [jargon clé détecté] est compréhensible pour [audience] ?" |
| Stage 1→2 | "5 dimensions extraites. Vous avez : une accroche ([fait P1]), une histoire ([arc P2]), une stratégie visuelle ([hero P3]), des preuves ([top evidence P4]), et un audit clarté. Maintenant on fusionne tout en UN document stratégique." |
| Stage 2→3 | "Votre Strategy_Master est prêt — score [X/25]. C'est le moment de choisir votre format de sortie." |

---

## 5. GESTION DES SITUATIONS DIFFICILES

### 5.1 Recovery par situation

| Situation | Détection | Action du Gem |
|-----------|----------|--------------|
| NotebookLM ne comprend pas le prompt | L'utilisateur décrit un résultat incohérent | "Le prompt était peut-être trop long ou complexe pour NotebookLM. Essayons une version simplifiée : [version courte du même prompt]" |
| NotebookLM invente du contenu | Le résultat contient des infos absentes des sources | "NotebookLM a halluciné. Ajoutez cette constraint au prompt : 'Use ONLY information from the uploaded sources. Do NOT add external knowledge. If information is not in the sources, say so.'" |
| Le résultat est trop court | L'utilisateur dit "il n'y a presque rien" | "NotebookLM a peut-être survolé vos sources. Ajoutez : 'Be EXHAUSTIVE. Cover ALL relevant information from ALL sources. Minimum [X] paragraphs.'" |
| Le résultat est trop long | L'utilisateur dit "c'est énorme" | "Pour condenser : 'Limit your response to the TOP [3/5/7] most important elements. Prioritize by impact on [audience].'" |
| Le résultat ignore certaines sources | Le résultat ne couvre qu'une partie du notebook | "NotebookLM a focalisé sur certaines sources. Ajoutez : 'Analyze ALL sources in this notebook equally. Cross-reference between sources where possible.'" |
| L'utilisateur veut modifier un prompt | "Je voudrais changer..." | Proposer la modification, expliquer l'impact, et fournir le prompt corrigé |
| L'utilisateur saute des étapes | "Je veux directement le podcast" | Expliquer ce qui sera perdu, mais respecter le choix : "Vous pouvez aller directement au podcast, mais sans les extractions, le résultat sera moins riche. Voulez-vous un workflow raccourci (P1 + P6 + P7-P8) ou le workflow complet ?" |
| L'utilisateur est bloqué | Silence ou confusion | "Où en êtes-vous ? Avez-vous copié le dernier prompt dans NotebookLM ? Quel résultat avez-vous obtenu ?" |

### 5.2 Raccourcis intelligents

SI l'utilisateur est pressé, proposer des versions raccourcies :

| Temps disponible | Parcours recommandé | Compromis |
|-----------------|--------------------|-----------| 
| < 30 min | Persona + P1 + P6 (raccourci) + 1 format | Perte narration, visuel, crédibilité, clarté |
| 30-60 min | Persona + P1 + P2 + P6 + 1 format | Perte visuel, crédibilité, clarté |
| 1-2h | Persona + P1-P5 + P6 + 1 format | Complet pour 1 format |
| 2-3h | Persona + Workflow complet + 2-3 formats | Optimal |
| 3h+ | Complet + Review & Optimize | Maximum |

**Règle :** TOUJOURS le persona en premier, même en mode raccourci. C'est non-négociable.

---

## 6. TEMPLATE D'EXÉCUTION SÉQUENTIEL

### 6.1 Checklist complète (Mode Guidé)

```
STEP 0: PARTAGE DU NOTEBOOK (Prérequis)
═══════════════════════════════════════════
☐ Créer un notebook NotebookLM (si pas encore fait)
☐ Uploader TOUS les documents sources dans le notebook
☐ Cliquer Partager → Toute personne disposant du lien
☐ Copier le lien
☐ Dans Gemini, cliquer + dans le chat et coller le lien
☐ Attendre que le Gem confirme le scan complet
→ Résultat: Le Gem a analysé l'intégralité du contenu

STEP 0.5: PERSONA (Phase 0 — 10-15 min)
═══════════════════════════════════════════
☐ Répondre aux questions de qualification du Gem
☐ Recevoir et vérifier le persona généré
☐ NotebookLM → ⚙️ → Customize → Custom → Coller → Save
☐ Confirmer au Gem que le persona est en place
→ Résultat: NotebookLM configuré avec votre identité

STEP 1: EXTRACTIONS (30-45 min)
═══════════════════════════════════════════
☐ [Si sources brutes] Exécuter P0: Source Clarifier
  → Sauvegarder NOTE "0_Structured_Source" → SOURCE
☐ Exécuter P1: The Anchoring Insight
  → Sauvegarder NOTE "1_Anchoring" → SOURCE
  → CHECKPOINT: Le fait d'ancrage est-il percutant ?
☐ Exécuter P2: The Story Architect
  → Sauvegarder NOTE "2_Story" → SOURCE
  → CHECKPOINT: L'arc narratif tient-il ?
☐ Exécuter P3: The Visual Strategist
  → Sauvegarder NOTE "3_Visual" → SOURCE
☐ Exécuter P4: The Credibility Collector
  → Sauvegarder NOTE "4_Credibility" → SOURCE
☐ Exécuter P5: The Clarity Scout
  → Sauvegarder NOTE "5_Clarity" → SOURCE
→ Résultat: 5 notes d'extraction dans votre notebook

STEP 2: SYNTHÈSE (10-15 min)
═══════════════════════════════════════════
☐ Exécuter P6: Strategy Master Synthesizer
  → Sauvegarder NOTE "6_Strategy_Master" → SOURCE
  → CHECKPOINT: Score qualité ≥ 15/25 ?
→ Résultat: 1 Strategy_Master unifié

STEP 3: GÉNÉRATION (20-30 min/format)
═══════════════════════════════════════════
☐ [Si Podcast]
  → Exécuter P7 dans le Chat
  → Sauvegarder NOTE "7_Podcast_Script" → SOURCE
  → Exécuter P8 dans Audio Overview → Customize
  → Écouter et noter les points à améliorer

☐ [Si Infographie]
  → Choisir : layout + style + palette + ratio + détail (KB4)
  → Exécuter P9 dans le Chat
  → Sauvegarder NOTE "9_Infographic_Data" → SOURCE
  → Exécuter P10 (assemblé par le Gem via KB4)
  → Vérifier résultat et noter les corrections

☐ [Si Présentation]
  → Exécuter P11 dans le Chat
  → Exporter vers Google Slides / PowerPoint
  → Vérifier cohérence avec le persona

STEP 4: REVIEW & OPTIMIZE (variable)
═══════════════════════════════════════════
☐ Décrire le résultat au Gem (points forts + faibles)
☐ Recevoir le diagnostic + prompt d'optimisation
☐ Appliquer dans NotebookLM
☐ Répéter si nécessaire
→ Résultat: Contenu optimisé

STEP 5: DÉPLOIEMENT (optionnel)
═══════════════════════════════════════════
☐ Vérifier le contenu (données, branding, CTA)
☐ Adapter au format de la plateforme cible
☐ Publier / Présenter
☐ Test mobile si digital
```

---

## 7. CAS D'USAGE PAR PROFIL

### 7.1 Matrice profil → parcours recommandé

| Profil | Format prioritaire | Raccourci si pressé | Attention spéciale |
|--------|-------------------|--------------------|--------------------|
| Entrepreneur (pitch) | Présentation + Infographie | P1+P6+P11 | Les investisseurs veulent des chiffres (P1+P4 critiques) |
| Entrepreneur (marketing) | Infographie + Podcast | P1+P2+P6+format | Le storytelling différencie (P2 critique) |
| Consultant (proposition) | Présentation | P1+P4+P6+P11 | La crédibilité vend (P4 critique) |
| Consultant (thought leadership) | Podcast + Infographie | Workflow complet | Les 5 dimensions comptent |
| Fonctionnaire (reporting) | Présentation | P1+P6+P11 | Clarté et structure (P5 critique) |
| Fonctionnaire (communication publique) | Infographie | P1+P3+P6+P9-P10 | Accessibilité grand public (P5 critique) |
| Formateur (cours) | Présentation + Infographie | Workflow complet | Pre-training (P5) et narration (P2) critiques |
| Formateur (promotion) | Podcast + Infographie | P1+P2+P6+formats | Engagement (P2) et preuves (P4) |
| Marketing (campagne) | Infographie | P1+P3+P6+P9-P10 | Visual (P3) et accroche (P1) dominent |
| Marketing (contenu long) | Podcast | Workflow complet | Narration (P2) + crédibilité (P4) |
| Académique (vulgarisation) | Infographie + Podcast | P1+P5+P6+formats | Clarté (P5) est la priorité absolue |
| Académique (publication) | Présentation | P4+P5+P6+P11 | Crédibilité (P4) + rigueur |
| Industriel (rapport) | Présentation + Infographie | P1+P4+P6+formats | Données (P1) + preuves (P4) |

### 7.2 Exemples de personnalisation

**Entrepreneur Agro marocain :**
- P1 hint : "Focus on: tonnes produites, hectares cultivés, export %, nombre d'emplois créés"
- P4 hint : "Focus on: certifications Bio/GlobalGAP, label Maroc, partenaires export"
- Persona : Couleurs vert terre/doré → infographie style terroir

**Consultant Supply Chain :**
- P1 hint : "Focus on: réduction lead time %, gain coûts logistiques, amélioration taux de service"
- P4 hint : "Focus on: certifications ISO, clients référents (OCP, Renault...), publications"
- Persona : Couleurs bleu industriel/orange → infographie style Dashboard

**Médecin endocrinologue :**
- P1 hint : "Focus on: prévalence diabète Maroc, patients traités, taux équilibre glycémique"
- P4 hint : "Focus on: spécialisation, formation continue, protocoles validés"
- P5 critique : Tout terme médical doit être expliqué (audience = grand public)
- Mention obligatoire : disclaimer médical systématique

---

## 8. DÉPLOIEMENT PAR FORMAT × PROFIL

### 8.1 Podcast

| Profil | Plateforme prioritaire | Secondaire | Durée | Tips |
|--------|----------------------|-----------|-------|------|
| Entrepreneur | LinkedIn Audio / Spotify | YouTube (visuel statique) | 3-5 min | Ouvrir avec le résultat, pas le contexte |
| Consultant | LinkedIn Audio | Site web / blog | 5-10 min | Montrer l'expertise méthodologique |
| Fonctionnaire | Site institutionnel | YouTube | 3-5 min | Ton mesuré, données officielles |
| Formateur | LMS | WhatsApp broadcast | 2-5 min | Objectif d'apprentissage explicite |
| Marketing | Spotify / Apple | LinkedIn / YouTube | 5-10 min | Hook fort, CTA clair |

### 8.2 Infographie

| Profil | Plateforme | Format | Style recommandé |
|--------|-----------|--------|-----------------|
| Entrepreneur | LinkedIn | 1:1 ou 16:9 | Minimalist / TED Talk |
| Consultant | Blog + LinkedIn | 16:9 + 1:1 | Data-Heavy / McKinsey |
| Fonctionnaire | Presse + site | A4 + 16:9 | Corporate / Dashboard |
| Formateur | Cours + LMS | A4 ou 9:16 | Sketchnote / Whiteboard |
| Marketing | Instagram + Pinterest | 1:1 + 9:16 | Magazine / Pop Art |
| Académique | Publication + conférence | A4 + 16:9 | Scientific / Blueprint |

### 8.3 Présentation

| Profil | Canal | Export | Post-production |
|--------|-------|--------|----------------|
| Pitch investisseur | Meeting | Google Slides + PDF | Canva upscale |
| Client prospect | Meeting | PowerPoint + PDF | Canva optionnel |
| Hiérarchie | Réunion interne | PowerPoint + PDF | Watermark institutionnel |
| Formation | Session | Google Slides (interactif) | Minimal |
| Webinar | Événement | Google Slides + PDF | Branding Canva |

### 8.4 Checklist post-déploiement

```
□ Contenu vérifié (pas de données erronées)
□ Branding cohérent (couleurs du persona, logo si applicable)
□ Call-to-action fonctionnel (lien, email, numéro testé)
□ Format adapté à la plateforme (dimensions, poids fichier)
□ Test mobile (si déploiement digital)
□ Mention obligatoire présente (disclaimer si secteur réglementé)
□ Attribution correcte (nom, titre, institution)
```
