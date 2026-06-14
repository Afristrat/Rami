# Audit anti-factice RAMI — 2026-06-12

Audit exhaustif de la plateforme (5 agents Explore parallèles) pour recenser tout
ce qui est **factice / non câblé** : boutons sans `onClick`, mock data affichée
comme réelle, actions stub, scores/tendances inventés. Objectif : tout développer
et câbler proprement (règle DEFCON 1 — zéro élément qui « fait semblant »).

> ⚠️ **À vérifier avant de coder (faux positifs possibles)** : plusieurs items
> « billing mocké » / « onboarding sans paiement » sont à recouper — `billing/actions.ts`
> (Stripe checkout + portal) EST câblé ; il y a probablement une page `/settings/billing`
> mock distincte de `/billing` réelle. Idem : vérifier si `/dashboard/video` (pipeline
> mock) est volontairement séparée de `/create/video` (réelle et fonctionnelle).

---

## LOT 1 — Workflow « Créer un post » (le plus visible)

| Élément | Fichier:ligne | Nature | Sévérité |
|---|---|---|---|
| Bouton « Enrichir avec l'IA » | Step1Brief.tsx:113 | aucun onClick → action manquante | DEFCON1 |
| Angles éditoriaux (5 boutons) | Step1Brief.tsx:173 | non sélectionnables (pas dans le form) | DEFCON1 |
| Variantes de hook cliquables | Step3TextGen.tsx:185 | `cursor-pointer` mais aucun effet | DEFCON1 |
| Style presets visuels | Step4VisualGen.tsx:12 | sélection sans influence sur la génération | DEFCON1 |
| Score qualité « A+ » + jauges 85/60% | Step5Review.tsx:34,223 | métriques hardcodées, score inventé | DEFCON1 |
| URL d'approbation + bouton Copy | Step6Approval.tsx:147 | URL fake, Copy sans handler | DEFCON1 |
| Suggestion d'horaire optimal | Step7Schedule.tsx:251 | « meilleur moment IA » sans calcul | DEFCON1 |
| « Brouillon enregistré » | Step1-5 (badge Save) | faux statut, aucune sauvegarde réelle | DEFCON1 |
| Boutons hashtag/UTM/angle custom/Expert | Step5/Step1/Step3 | sans handler | MINEUR |
| Bouton « Enregistrer comme brouillon » | Step5Review.tsx:290 | sans onClick | MINEUR |

### État LOT 1 (2026-06-12, session #9) — ✅ TERMINÉ (browser-verified prod)

Steps 1/3 (session #8) + Steps 4/5/6/7 (session #9, commits `ead863c`/`d5ce51c`/`58e0ec2`/`6bc6254`/`3bef1f8`).
Tout vérifié en prod (test-ralph) : preset Blueprint appliqué aux visuels, score qualité réel
96→86 réactif, brouillon DB, lien `/approve/[token]` + décision externe, horaire heuristique
+ post planifié sans doublon. Bonus : fix planification datée (datetime-local rejeté par Zod),
faux badge « Brouillon sauvegardé » Step 2 purgé, `WorkflowActions.tsx` orphelin supprimé.

### ⚠️ Découvertes session #9 — reliquats NON couverts par l'audit initial

| Élément | Fichier:ligne | Nature | Sévérité |
|---|---|---|---|
| Sidebar workflow : score alignement 0.87 + « Historique » (3 posts inventés, « Il y a 2h ») | WorkflowSidebar.tsx:39-50 | mock affiché sur TOUTES les étapes du workflow | DEFCON1 |
| ✅ Sous-titre Step 3 « Claude Haiku génère vos captions » | i18n workflow.step3.desc + textGen.generatingCaptions | RÉSOLU 2026-06-14 → « L'IA génère… » provider-neutre ×8 | ~~DEFCON2~~ |
| ✅ Erreur format Step 2 brute « Invalid option: expected one of… » | step2Schema (zod) | RÉSOLU 2026-06-14 (`5c11e32`) → **BLOQUAIT le wizard** ; format défaut « post » + messages i18n | ~~MINEUR~~ **(était bloquant)** |



- `/dashboard/video/page.tsx` : **page entièrement mock** (PIPELINE_STEPS, SCRIPT_SECTIONS,
  VOICE_ACTORS, STORYBOARD_FRAMES, waveform simulée, 3 boutons majeurs sans onClick :
  voix, « Regenerate All », « Generate Pipeline »). **DEFCON1**.
- ✅ `/create/video` (VideoGeneratorClient) + `services/video-generation/*` (Veo/Runway/Kling/Luma/Wan)
  = **réels et câblés**. → Décision : soit câbler la page pipeline, soit la retirer/fusionner
  avec `/create/video`.

## LOT 3 — Présentations (module mock complet)

- `presentation-wizard.tsx` : MOCK_SLIDES/MOCK_THEMES, **aucune persistance DB**, aucune action serveur.
- `step-result.tsx:66` : boutons « Download PPTX » + « Edit in Canva » **sans handler**.
- Pas dans la sidebar ; route `/presentations/new` douteuse.
- → Story dédiée US-041/042/043 (génération plan + slides + export). **DEFCON1**.

## LOT 4 — Dashboard & Analytics & Library (résiduel)

> ✅ **2026-06-14** : distribution plateformes (réelle), faux trend KPI (retiré) et
> Kanban Approbations (`MOCK_ITEMS` → posts réels review/approved/rejected + décisions
> persistées + statut `rejected`) **TERMINÉS + browser-verified prod** (commits `25048a1`, `18fbd1f`).
> + sidebar workflow (`WorkflowSidebar`) réelle (`13c6240`). Reste LOT 4 : MINEURS analytics/library.

| Élément | Fichier:ligne | Nature | Sévérité |
|---|---|---|---|
| ✅ Distribution plateformes 45/30/15/10 | platform-distribution.tsx | RÉSOLU (répartition réelle) | ~~DEFCON1~~ |
| ✅ « Tendance vs semaine dernière » | BrandDnaKpiCard.tsx | RÉSOLU (retiré) | ~~DEFCON1~~ |
| ✅ Approbations (Kanban) | approval-board.tsx | RÉSOLU (données + décisions réelles) | ~~DEFCON1~~ |
| Export PDF analytics | analytics-filters.tsx:122 | sans onClick | MINEUR |
| Filtres avancés (sliders/search) | analytics-dashboard.tsx:128 | sans handler | MINEUR |
| Lien « rapport complet » `href="#"` | analytics-dashboard.tsx:134 | lien mort | MINEUR |
| Filtre Score DNA / Date | media-library-client.tsx:56,210 | toggle sans effet sur la requête | MINEUR |
| Lignes top-posts `cursor-pointer` | top-posts-table.tsx:102 | sans onClick (fausse interactivité) | MINEUR |

## LOT 5 — Documents / Transcriptions / Leads

| Élément | Fichier:ligne | Nature | Sévérité |
|---|---|---|---|
| ✅ Bouton Download (liste docs) | DocumentsTable.tsx | RÉSOLU 2026-06-14 (`6d8f935`) → route /pdf réelle, PDF 26 Ko vérifié | ~~DEFCON1~~ |
| Transcriptions : MOCK_SPEAKERS/SUMMARY/VERBATIMS | TranscriptionResult/AiSummaryPanel | mock affiché si Whisper absent, sans badge démo | DEFCON1 |
| Leads : import Apollo / recherche | leads/client.tsx:24, LeadFilters.tsx | callbacks vides, inputs non bindés | MINEUR |

## LOT 6 — Settings / Onboarding / Découvrabilité

| Élément | Fichier:ligne | Nature | Sévérité |
|---|---|---|---|
| Onboarding sans étape « Connexions sociales » | OnboardingWizard.tsx:20 | parcours incomplet | DEFCON1 |
| ✅ Page Connexions absente de la sidebar | nav-config.ts | RÉSOLU 2026-06-14 (`6d8f935`) → ajoutée à navMain | ~~DEFCON1~~ |
| RGPD « Télécharger mes données » | general-settings-client.tsx:675 | sans handler (obligation légale) | DEFCON1 |
| `/settings/billing` mock (plan/invoices/boutons) | billing-settings-client.tsx | **à recouper avec /billing réel** | À VÉRIFIER |
| Timezone / langue / workspace | general-settings-client.tsx | sélecteurs sans sauvegarde | MINEUR |
| Équipe : projet/message d'invitation | team-manager.tsx:113 | states non utilisés | MINEUR |
| Présentations absentes de la sidebar | nav-config.ts | découvrabilité | MINEUR |
| Brand DNA : exemples de posts | brand-dna/page.tsx:54 | templates en dur (pas IA) | MINEUR |

---

## LOT 7 — Qualité des prompts système de génération (DETTE, demande Amine 2026-06-12)

⚠️ **Dette à auditer + améliorer** : passer en revue **TOUS les system prompts qui
génèrent du contenu** (`src/lib/services/ai/prompt-config.ts` — `workflow_caption_generation`,
`workflow_brief_enrich`, `visual_prompt_compiler`, `brand_dna_*`, `document_*`,
`color_trend_narrative`, `leads_brand_dna_scoring`, etc. + la table DB `ai_prompts_config`)
et les **renforcer**.

- **Dépendance** : Amine doit **partager ses prompts « GoP »** (jeu de prompts validés
  qui collent à la plateforme) → les intégrer/adapter comme nouvelle baseline des
  system prompts de génération.
- Objectif : contenu plus calibré (neuropsychologie Causse, ton/marché MENA, format
  par plateforme), zéro mention de modèle concurrent dans l'UI (ex. ancien badge
  « Expert ChatGPT » → corrigé en « Expert IA »).
- Vérifier la cohérence DB (`ai_prompts_config`) vs fallbacks code (`FALLBACK_CONFIGS`).

---

## Ordre d'exécution proposé

1. **LOT 1** (workflow Créer un post) — le plus visible, là où l'utilisateur bute.
2. **LOT 5** (Documents download + Transcriptions badge démo) — rapides.
3. **LOT 4** (Dashboard distribution + trend + Approvals réelles).
4. **LOT 6** (Onboarding connexions + sidebar Connexions + RGPD export).
5. **LOT 2** (Vidéo pipeline : câbler ou retirer).
6. **LOT 3** (Présentations : US-041/042/043).

Chaque lot = une story Ralph, gates complets + browser-verify prod avant `passes=true`.
