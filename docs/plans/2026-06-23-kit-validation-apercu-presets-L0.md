# Kit Validation Humaine + Aperçu Fidèle + Presets de Correction — L0

```
Date      : 2026-06-23
Auteur    : Amine + Claude (session #15 — design)
Statut    : SPEC — en attente de relecture Amine avant plan d'implémentation
Périmètre : Piliers 2 + 3 (le Pilier 1 « moteur de composition design » est reporté)
Portabilité : RAMI (Next.js) + kit câblable dans Hermès (Python/Telegram)
```

> **Déclencheur.** Un post (carrousel) a été publié **depuis Hermès** avec des accents fautifs
> et une mise en page « indigne d'un level 0 en design ». Hermès ne génère rien lui-même : il
> délègue à RAMI via l'API v1 et **publie sans aucun aperçu fidèle ni validation humaine**.
> L'API v1 `publish` accepte aujourd'hui n'importe quel post (`draft`/`review`/`approved`) →
> rien n'empêche une publication non revue.

---

## 1. Objectif

En une phrase : **rendre toute publication impossible sans une validation humaine faite sur un
aperçu fidèle du rendu réel par plateforme, et donner à l'humain des presets de correction
cliquables pour régénérer un élément précis sans repartir de zéro** — le tout exposé comme un
« kit » réutilisable côté RAMI *et* câblable dans Hermès.

### Ce qui est DANS le périmètre (session #15)

1. **Verrou serveur bloquant** — aucune publication (workflow interne, Kanban, API v1/Hermès,
   posts programmés) ne part sans une approbation humaine enregistrée.
2. **Aperçu fidèle multi-plateforme** — un composant de mockup réaliste du feed de chaque
   réseau, utilisé **dans le workflow interne (Step5/Step6)** ET dans une **page d'aperçu-
   validation accessible par lien token** (réutilise l'infra `/approve/[token]`).
3. **Presets de correction + régénération granulaire** — boutons de correction prédéfinis
   (au lieu d'un `textarea` vide) qui régénèrent **un seul élément** (caption, accroche, fond,
   slide N).
4. **Carrousel multi-slides IA brut** — N slides distincts (prompt différent par slide,
   progression accroche→développement) + régénération d'un slide isolé.
5. **Kit Hermès** — le verrou le protège par construction ; + guide + snippet pour que sa skill
   envoie le lien d'aperçu-validation au lieu de publier ; + boutons inline Telegram optionnels.
6. **Fix encodage** — `charset=UTF-8` sur Facebook/Instagram (`facebook.ts:30`,
   `instagram.ts:50/89`) ; `normalize("NFC")` en entrée ; prompts visuels « aucun texte dans
   l'image » (voir §7).

### Ce qui est HORS périmètre (reporté)

- **Pilier 1 — moteur de composition design** (texte composé par le code en typographie réelle,
  HTML→image type Satori/@vercel/og). C'est lui qui rendra le carrousel *beau* et garantira les
  accents *incrustés dans l'image*. Reporté à une session dédiée.
- Tout aperçu rendu en **PNG** envoyable tel quel dans Telegram (dépend du Pilier 1).
- L'enforcement de quotas « publications » du plan pricing 2-axes (autre chantier, voir
  `2026-06-22-pricing-2axes-L0-comptes.md`).

---

## 2. État du code existant (vérifié)

| Brique | Fichier | État |
|---|---|---|
| Enum statut post | `src/lib/db/schema.ts:21` | `draft, review, approved, scheduled, publishing, published, failed, rejected` |
| API v1 publish | `src/app/api/v1/posts/[id]/publish/route.ts:21` | **TROU** : `PUBLISHABLE_STATUSES` accepte `draft/review/approved/scheduled/failed` sans approbation |
| Action publish interne | `src/app/actions/scheduler.ts` (`publishPost`) | même logique, enfile pg-boss |
| Worker | `src/lib/queue/publish-worker.ts` | exécute le publish réel par plateforme |
| Token d'approbation | table `approval_tokens` (migr. `…013`) + `src/lib/actions/approval.actions.ts` + page `src/app/(public)/approve/[token]/page.tsx` | **à étendre** (aperçu fidèle + presets) |
| Kanban interne | `src/components/approvals/approval-board.tsx`, `approval-card.tsx`, `approval-edit-dialog.tsx` | édite la caption seule ; aperçu non fidèle |
| Preview workflow | `Step5Review.tsx`, `Step6Approval.tsx` | texte + visuel ; **pas** un mockup feed |
| Contraintes plateforme | `src/lib/scheduler/platform-config.ts` | `charLimit` seul ; **ni ratio, ni formats, ni nb images** |
| Presets de style visuel | `src/lib/services/image-generation/style-presets.ts` | 12 presets cliquables, relancent la génération (Step4) |
| Presets de texte | `Step1Brief.tsx` (7 objectifs, 5 angles), `Step3TextGen.tsx` (swap hook) | régénération **tout-ou-rien** |
| Génération visuelle | `src/lib/actions/visual.actions.ts`, `prompt-compiler.ts` | 100 % délégué à l'IA, brief injecté littéralement |
| Hermès | `C:\…\Hermes` (Python, Telegram) | délègue tout à RAMI via API v1 ; risque accents = MarkdownV2 `telegram.py:1910` |

---

## 3. Architecture — vue d'ensemble

Principe directeur : **un point de contrôle unique**, partagé par toutes les voies de publication.

```
                          ┌───────────────────────────────┐
   Workflow interne ─────▶│                               │
   Kanban approbations ──▶│   POST = state "needs_review" │
   API v1 / Hermès ──────▶│   (jamais publiable直接)       │
   Posts programmés ─────▶│                               │
                          └───────────────┬───────────────┘
                                          │
                                          ▼
                       ┌──────────────────────────────────────┐
                       │  APERÇU-VALIDATION (kit partagé)       │
                       │  • mockup fidèle par plateforme        │
                       │  • presets de correction (clic)        │
                       │  • régénération granulaire             │
                       │  rendu : (a) inline Step5/6  (b) /approve/[token] │
                       └──────────────────┬───────────────────┘
                                          │ approbation humaine
                                          ▼
                       ┌──────────────────────────────────────┐
                       │  VERROU SERVEUR (défense en profondeur)│
                       │  publishPost + API v1 publish + worker │
                       │  refusent si pas d'approbation humaine │
                       └──────────────────┬───────────────────┘
                                          ▼
                                   pg-boss → publish réel
```

---

## 4. Composant A — Verrou serveur bloquant

**But.** Rendre techniquement impossible toute publication non approuvée par un humain, quelle
que soit la voie. Défense en profondeur sur **trois** points (un seul ne suffit pas).

### A.1 Modèle de données
- Ajouter sur `posts` : `approved_by uuid` (FK `auth.users`, nullable), `approved_at timestamptz`
  (nullable). Migration `supabase/migrations/2026XXXX_post_human_approval.sql` (appliquée db-rami,
  RLS inchangée — colonnes couvertes par les policies existantes du post).
- Sémantique : un post est « approuvé pour publication » **si et seulement si** `approved_by IS
  NOT NULL AND approved_at IS NOT NULL`. Toute édition de contenu (`content`, `media_urls`,
  `platforms`, hashtags) **réinitialise** `approved_by/approved_at` à `NULL` (re-validation
  obligatoire après modification — pas d'approbation « volée » sur un contenu changé).

### A.2 Les trois points d'enforcement
1. **API v1** (`src/app/api/v1/posts/[id]/publish/route.ts`) : avant l'`update` ligne 63, exiger
   `approved_by/approved_at`. Sinon → `409` avec un message explicite **et l'URL d'aperçu-
   validation** dans la réponse (`{ error, approvalUrl }`) pour que Hermès la relaie.
2. **Action interne** (`scheduler.ts` `publishPost`) : même garde — refuse d'enfiler le job si
   non approuvé (sauf chemin où l'approbation vient d'être posée dans la même transaction).
3. **Worker** (`publish-worker.ts`) : **backstop final** — au moment d'exécuter, re-lire le post
   et abandonner proprement (statut `failed` + raison `not_human_approved`) si l'approbation a
   disparu (ex. contenu réédité après programmation). Garantit qu'un job programmé périmé ne
   publie pas un contenu non revalidé.

### A.3 Pose de l'approbation
- **DÉCISION (Amine) : seul un membre du tenant authentifié débloque la publication.**
  Server Action `approvePostForPublish(postId)` réservée à un utilisateur connecté **ayant accès
  au tenant du post** (vérifié via la RLS d'appartenance `tenant_members` / `get_current_tenant_id`).
  Écrit `approved_by = auth.uid()`, `approved_at = now()`, journalise dans `audit_logs`
  (`action = "post.human_approved"`). Un membre peut appartenir à plusieurs tenants/comptes
  (solo, pro, agency) — le contrôle d'accès repose sur l'appartenance existante, pas sur le plan.
- **La page token externe `/approve/[token]` NE débloque PAS le publish.** Elle reste un
  **aperçu fidèle + avis client** : l'approbation externe (existante, `decideApprovalAction`)
  signale un go/no-go du relecteur, visible par le membre, mais c'est le membre interne qui pose
  l'approbation technique (`approved_by/approved_at`). Évite qu'un porteur de lien publie seul.
- **Surface d'approbation pour Hermès** : le lien envoyé dans Telegram pointe vers une page
  **authentifiée** (`/dashboard/review/[postId]` ou équivalent) ; si le membre n'est pas connecté,
  login puis approbation. Hermès envoie le lien à un membre (ex. Amine), pas à un anonyme.

---

## 5. Composant B — Aperçu fidèle multi-plateforme (le kit visuel)

**But.** Montrer le post **tel qu'il apparaîtra** dans le feed de chaque réseau — pas un simple
texte + image, mais un mockup réaliste (en-tête de compte, ratio d'image correct, troncature à
la limite réelle, indicateur de carrousel à points, compteur de caractères, hashtags rendus).

### B.1 Composant partagé
- `src/components/preview/PlatformPreview.tsx` : reçoit `{ platform, content, mediaUrls,
  hashtags, accountName, accountAvatar, format }` et rend la carte de feed fidèle.
- Un sous-composant par plateforme (`LinkedInFeedCard`, `InstagramFeedCard`, `XTweetCard`,
  `FacebookFeedCard`, `PinterestPinCard`, `MastodonCard`, `YouTubeCard`, `TikTokCard`) —
  **toutes les plateformes** (demande Amine). Réutilise les patterns de rendu de
  `SlideRenderer.tsx` et la palette de `platform-config.ts`.
- **Carrousel** : `InstagramFeedCard`/`LinkedInFeedCard` affichent les points + navigation entre
  slides quand `format === "carousel"` et `mediaUrls.length > 1`.

### B.2 Enrichir `platform-config.ts`
Ajouter par plateforme : `imageAspectRatios` (ex. IG `["1:1","4:5","9:16"]`), `maxImages`
(ex. IG carrousel 10, X 4, LinkedIn 9), `supportsCarousel`, `mediaRequired`. Sert l'aperçu **et**
une **validation de conformité** (ex. « carrousel impossible sur X » → bloqué/averti).

### B.3 Deux surfaces de rendu (même composant)
- **Inline workflow** : intégré dans `Step5Review.tsx` (et `Step6Approval.tsx`) — onglets par
  plateforme montrant le `PlatformPreview` au lieu de la preview actuelle.
- **Page token** : `src/app/(public)/approve/[token]/page.tsx` enrichie — le `PlatformPreview`
  pour chaque plateforme cible + les actions de correction/régénération + décision.

### B.4 Honnêteté du mockup
Les compteurs (caractères, dépassement de limite), troncatures et avertissements de conformité
sont **calculés réellement** (réutiliser `quality-score.ts`). Aucun chiffre/like inventé : les
mockups n'affichent pas de fausses métriques d'engagement (zéro factice — règle DEFCON).

---

## 6. Composant C — Presets de correction + régénération granulaire

**But.** Quand l'humain voit un défaut, il **clique un preset** (pas de `textarea` vide) et seul
l'élément concerné est régénéré.

### C.1 Éléments régénérables individuellement
- **Caption** (par plateforme)
- **Accroche / hook** (déjà partiellement via `swapHook`, à généraliser en régénération)
- **Hashtags**
- **Visuel / fond** (une image)
- **Slide N** (carrousel) — un seul slide

### C.2 Bibliothèque de presets de correction
Définie dans un module pur `src/lib/services/workflow/correction-presets.ts` (testable Jest),
indexée par type d'élément. Chaque preset = `{ id, label, scope, promptFragment }`. Le fragment
est injecté dans la régénération de l'élément. Liste initiale proposée :

**Texte (caption / accroche)**
- `too_long` — « Trop long → raccourcir et resserrer »
- `spelling_accents` — « Corriger orthographe et accents français (é, è, à, ç, œ…) »
- `tone_pro` — « Ton plus professionnel »
- `tone_warm` — « Ton plus chaleureux / humain »
- `punchier` — « Accroche plus percutante »
- `less_salesy` — « Moins commercial / moins putaclic »
- `add_cta` — « Ajouter un appel à l'action clair »
- `remove_jargon` — « Retirer le jargon »

**Visuel / fond / slide**
- `too_busy` — « Trop chargé → épurer »
- `off_brand` — « Hors charte → respecter la palette Brand DNA »
- `more_premium` — « Plus premium / haut de gamme »
- `more_minimal` — « Plus minimaliste »
- `change_style` — ouvre les 12 presets de style existants (`style-presets.ts`)
- `no_text` — « Aucun texte dans l'image » (voir §7)

L'UI permet de **cumuler** quelques presets avant de régénérer, et garde un champ libre
**optionnel** en complément (pas en remplacement).

### C.3 Actions de régénération granulaire
- `regenerateElement({ postId, element, platform?, slideIndex?, presetIds[], freeText? })` —
  Server Action qui (a) recharge le contexte (brief, Brand DNA via `normalizeBrandDNA`), (b)
  régénère **uniquement** l'élément visé en injectant les `promptFragment`, (c) persiste, (d)
  **réinitialise l'approbation** (§A.1). Réutilise `callTextLLM` (texte) et
  `generateVisualContentAction` (visuel).
- Exposée aussi en **API v1** (`POST /api/v1/posts/[id]/regenerate`) pour que Hermès l'appelle.

### C.4 Carrousel multi-slides (IA brut)
- Le workflow génère N prompts distincts (slide 1 = accroche, slides suivants = développement),
  via une fonction pure `buildCarouselSlidePrompts(brief, brandDNA, n)` (testable).
- Chaque slide = une entrée dans `media_urls` (ordre = ordre des slides).
- Régénération ciblée d'un slide via `regenerateElement({ element: "slide", slideIndex })`.
- **Limite honnête** : le texte des slides reste dessiné par l'IA tant que le Pilier 1 est
  absent → on impose `no_text` par défaut sur les fonds (texte porté par la caption).

---

## 7. Encodage & accents (fix ciblés)

1. **Facebook/Instagram** : `Content-Type: application/x-www-form-urlencoded; charset=UTF-8`
   (`facebook.ts:30`, `instagram.ts:50` et `:89`).
2. **Entrée** : `sanitizePromptInput` (`src/lib/utils/sanitize.ts`) applique `.normalize("NFC")`
   en tête (forme canonique stable).
3. **Texte dans l'image** : ajouter `text, words, letters, typography, captions, watermark` au
   **negative_prompt** du `prompt-compiler.ts` + preset `no_text` → plus aucun accent halluciné
   par l'IA. Le texte vit dans la caption (déjà UTF-8 propre) en attendant le Pilier 1.
4. **Hermès/Telegram** : documenter dans le guide (kit) que l'aperçu se fait via **lien**
   (la page rend le texte en HTML, hors piège MarkdownV2). Le résumé Telegram passe par le
   fallback plain-text déjà présent (`telegram.py` `_strip_mdv2`).

---

## 8. Composant D — Kit Hermès (portabilité)

Hermès est protégé **par construction** (le verrou §A est côté serveur RAMI). Livrables pour le
câbler proprement :

1. **Guide** `docs/plans/2026-06-23-kit-hermes-integration.md` (ou section dédiée) : la skill
   Hermès, après `POST /api/v1/posts`, **n'appelle plus `…/publish` directement**. Elle :
   - lit `approvalUrl` renvoyée par l'API (nouveau champ, voir §A.2),
   - poste dans Telegram **le lien d'aperçu-validation** + un résumé plain-text,
   - (option) affiche des **boutons inline** « ✅ Approuver / 🔧 Corriger / ❌ Rejeter » dont les
     callbacks frappent les endpoints API v1 (`/regenerate`, l'approbation, `/publish`).
2. **Endpoints API v1 nécessaires** (déjà prévus) : `GET /api/v1/posts/[id]` (aperçu données),
   `POST /api/v1/posts/[id]/regenerate`, approbation, `POST /api/v1/posts/[id]/publish`
   (désormais gardé).
3. **Snippet Python** d'exemple (appel + envoi du lien) dans le guide.

> Note : aucune modification de code Hermès n'est strictement requise pour la **sécurité** (le
> verrou suffit) ; le guide/snippet améliore l'**expérience** (aperçu + correction depuis
> Telegram).

---

## 9. Séquence de construction proposée

1. **Verrou serveur** (§A) — migration + 3 points d'enforcement + `approvePostForPublish` +
   tests. *Livre immédiatement la sécurité, indépendamment de l'UI.*
2. **`platform-config` enrichi** (§B.2) + **`PlatformPreview`** + sous-composants par plateforme.
3. **Intégration inline** Step5/Step6 (§B.3) + page token enrichie.
4. **Presets de correction** (§C.2) + `regenerateElement` (§C.3) + UI (boutons) dans les deux
   surfaces.
5. **Carrousel multi-slides** (§C.4).
6. **Fix encodage** (§7).
7. **Kit Hermès** (§D) — guide + snippet ; option boutons inline.

Chaque étape : gates verts (tsc 0 / lint 0 / Jest / build) + browser-verify PROD (compte
test-ralph) conformément à la règle « jamais de dev local ».

---

## 10. Points tranchés / à confirmer

1. ✅ **TRANCHÉ — Approbation externe** : la page token externe ne débloque pas le publish ;
   seul un **membre du tenant authentifié** pose l'approbation technique (cf. §A.3). Un membre
   peut gérer plusieurs comptes/tenants (solo/pro/agency) ; le contrôle = appartenance.
2. ✅ **TRANCHÉ — Telegram** : **lien d'abord** (guide + snippet) ; boutons inline reportés.
3. ⏳ **À confirmer — Carrousel** : nombre de slides par défaut (proposé : 3, bornes 2–10 selon
   plateforme). Défaut retenu sauf avis contraire.

---

## 11. Critères de « done »

- Impossible de publier (workflow, Kanban, API v1, programmé) un post sans `approved_by/
  approved_at` — **prouvé** par un test cross-voie (API v1 sans approbation → 409 + `approvalUrl`).
- Aperçu fidèle rendu pour **toutes** les plateformes, inline ET page token, compteurs réels.
- Au moins un preset de correction par type d'élément régénère **uniquement** cet élément, et la
  régénération **réinitialise** l'approbation.
- Carrousel : N slides distincts générés, régénération d'un slide isolé fonctionnelle.
- Fix encodage Facebook/Instagram + `no_text` au negative_prompt vérifiés.
- Guide Hermès + snippet livrés ; verrou vérifié depuis une clé API (chemin Hermès).
- Gates verts + browser-verify PROD. Zéro factice, zéro dette TS/lint.
```
