---
name: RAMI — Rapport Audit Complet "Top Notch" — RAPPORT FINAL
description: Rapport complet consolidé : gaps UI, vecteurs manquants, analyse compétitive, GitHub repos, roadmap priorisée
type: project
---

# RAMI — RAPPORT SPARRING PARTNER : CE QU'IL FAUT POUR ÊTRE TOP NOTCH

*Généré le 2026-03-12 — Mode sparring, zéro complaisance*

***

## VERDICT GLOBAL

RAMI est un MVP solide avec un différenciateur réel (Brand DNA neuropsychologique). Mais en l'état, il ne remplace PAS Buffer, Hootsuite, Canva et Notion — il remplace partiellement chacun sans en égaler aucun sur les features critiques. Le fossé entre "ce qui est construit" et "ce qui est nécessaire pour qu'une agence signe un contrat Agency à \$399/mois" est réel et documenté ci-dessous.

***

## PARTIE 1 — GAPS URGENTS (bloquants pour la mise en production sérieuse)

### GAP \#1 — VIDÉO : LE PLUS GROS MANQUE (P0)

**Réalité 2026 :** Instagram Reels représente 91% de la portée organique Instagram. TikTok = plateforme \#1 Gen Z + millenials. YouTube Shorts = croissance la plus rapide. Une agence qui ne peut pas publier de Reels/Shorts depuis son outil est bloquée.

**Ce qui manque dans RAMI :**

-   Génération vidéo IA (Runway ML, Kling AI, Pika Labs)
-   Upload + scheduling Reels/Shorts/TikTok
-   Conversion visuel → Reel animé (image-to-video)
-   Découpe long → shorts (style OpusClip/quso.ai)
-   Sous-titres auto-générés (WhisperAI sur les vidéos)
-   Text-to-speech voix off (ElevenLabs)

**Solution immédiate :** Intégrer RunwayML API ou Kling AI pour image-to-video. Intégrer TikTok Content Posting API. Ajouter upload vidéo + scheduling dans le workflow.

***

### GAP \#2 — APPROVAL WORKFLOW : FEATURE \#1 DEMANDÉE PAR LES AGENCES (P0)

**Réalité :** Une agence sans workflow d'approbation ne peut pas travailler avec des clients. C'est la feature qui différencie Planable (\$39/mois) de Buffer (\$6/canal). RAMI Agency (\$399/mois) sans approval workflow = impossible à vendre.

**Ce qui manque :**

-   Rôles : Admin, Manager, Créatif, Client (lecture seule)
-   Soumission post → revue interne → approbation client
-   Commentaires inline sur chaque post (thread contextuel)
-   Lien unique client pour valider son contenu sans login complet
-   Notifications email/Slack sur changements de statut
-   Versioning (historique révisions d'un post)

***

### GAP \#3 — ANALYTICS RÉELLES : 10% IMPLÉMENTÉ (P0)

**Réalité :** Le dashboard Analytics affiche des données mockées. Une agence qui présente des "données fictives" à ses clients = perte de confiance immédiate. C'est le coeur du reporting.

**Ce qui manque :**

-   Connexion réelle Ayrshare → données engagement par post
-   Score Brand DNA historique (visible dans le design mais non codé)
-   Top Posts par engagement (tableau design → non implémenté)
-   Export PDF rapport hebdomadaire brandé
-   ROI tracking (conversions liées aux posts)
-   Best time to post IA basé sur données réelles

***

### GAP \#4 — YOUTUBE OAUTH (Phase 1 dans le design, 0% dans le code) (P0)

YouTube est affiché en Phase 1 "Disponible à connecter" dans le design Stitch. Il n'est pas dans le code. YouTube = 2,7 milliards d'utilisateurs actifs mensuels, \#2 moteur de recherche mondial. Pour les agences marocaines/africaines = critique pour le contenu video.

***

### GAP \#5 — FORMATS DE CONTENU MANQUANTS (P1)

RAMI publie uniquement "texte + image". C'est insuffisant en 2026.

| Format                  | Plateforme | Urgence                           |
|-------------------------|------------|-----------------------------------|
| LinkedIn Carousel (PDF) | LinkedIn   | 🔴 CRITIQUE — format B2B \#1 2026 |
| LinkedIn Newsletter     | LinkedIn   | 🟠 HAUTE                          |
| X/Twitter Thread        | X          | 🟠 HAUTE                          |
| Instagram Stories       | Instagram  | 🔴 CRITIQUE                       |
| Instagram Reels         | Instagram  | 🔴 CRITIQUE                       |
| YouTube Shorts          | YouTube    | 🔴 CRITIQUE                       |
| TikTok Video            | TikTok     | 🔴 CRITIQUE                       |
| Facebook Reel           | Facebook   | 🟠 HAUTE                          |
| Pinterest Idea Pins     | Pinterest  | 🟡 MOYENNE                        |
| WhatsApp Status         | WhatsApp   | 🔴 CRITIQUE (MENA)                |
| Google Business Post    | GBP        | 🟠 HAUTE (SEO local)              |

***

### GAP \#6 — MULTI-FORMAT RESIZE INTELLIGENT (P1)

Un visuel créé = 12 formats. C'est ce que fait Canva "Magic Resize". RAMI génère 1 ratio et c'est tout. Une agence qui gère Instagram (1:1), Stories (9:16), LinkedIn (1.91:1), YouTube thumbnail (16:9) a besoin de resize automatique sans regénérer.

***

### GAP \#7 — CONNEXION BIBLIOTHÈQUE → WORKFLOW (P1)

Le bouton "Utiliser dans un post" visible dans le design Bibliothèque n'est pas câblé. Une agence upload ses assets dans la bibliothèque puis veut les utiliser dans le workflow de création sans re-upload. Ce workflow est cassé.

***

### GAP \#8 — KPIs DASHBOARD DYNAMIQUES (P1)

Le dashboard affiche "47 Posts publiés", "124 Visuels générés", "87% Score Brand DNA". Ces données doivent venir de vraies requêtes Supabase, pas des stubs. Sans données réelles = le dashboard est une maquette.

***

## PARTIE 2 — VECTEURS STRATÉGIQUES POUR ÊTRE "TOP NOTCH"

### VECTEUR A — INBOX SOCIAL UNIFIÉ

**Ce que c'est :** Tous les commentaires, DMs, mentions de toutes les plateformes dans une seule interface.

**Pourquoi c'est critique :** Hootsuite et Agorapulse gagnent des clients uniquement sur ça. Une agence qui gère 10 comptes Instagram + 10 LinkedIn + 10 Facebook ne peut pas répondre aux commentaires plateforme par plateforme.

**Implémentation RAMI :** Webhooks entrants Ayrshare → Supabase Realtime → interface Inbox → répondre depuis RAMI.

***

### VECTEUR B — SOCIAL LISTENING & MENTIONS

**Ce que c'est :** Alertes quand quelqu'un mentionne la marque sur les RS (même sans @mention).

**Pourquoi c'est critique :** Pour les agences gérant des marques, manquer une mention négative = crise non gérée. Sprout Social vend ça \$499/user.

**Implémentation minimale RAMI :** Ayrshare Listening API + alertes email/Slack en temps réel.

***

### VECTEUR C — COMPETITOR MONITORING

**Ce que c'est :** Suivre les comptes concurrents (posts, engagement, croissance, fréquence).

**Différenciateur RAMI possible :** Intégrer la matrice Causse → analyser automatiquement la palette couleur des concurrents et l'émotion qu'ils ciblent. Aucun concurrent ne fait ça.

***

### VECTEUR D — CONTENT RECYCLING & EVERGREEN

**Ce que c'est :** Les top posts sont automatiquement re-proposés pour republication après X semaines.

**Pourquoi c'est critique :** 80% des agences recyclent leur contenu manuellement. SocialBee fait ça à \$29/mois. RAMI à \$399 doit le faire mieux.

**Implémentation RAMI :** Score performance post (Ayrshare) → si engagement \> seuil → proposer "Republier en evergreen" → new session Brand DNA avec actualisation.

***

### VECTEUR E — BEST TIME TO POST IA

**Ce que c'est :** "Publiez ce post mardi à 18h30 pour maximiser l'engagement de votre audience."

**Implémentation RAMI :** Données Ayrshare historiques → ML simple (meilleure heure par jour de semaine par plateforme) → recommandation dans le calendrier.

***

### VECTEUR F — INTÉGRATIONS ÉCOSYSTÈME (P1)

Les 5 intégrations les plus demandées par les agences selon les reviews G2/Capterra :

1.  **Canva** — import designs directement dans RAMI
2.  **Google Drive / Dropbox** — assets depuis le cloud
3.  **Zapier / Make** — automatiser avec 5000+ apps
4.  **RSS Feed** — auto-scheduler les articles de blog
5.  **Google Analytics 4** — lier posts à conversions

***

### VECTEUR G — ARABIC/RTL + MARCHÉ MENA (CRITIQUE POUR LE POSITIONNEMENT)

**Réalité du marché cible :** Le marché marocain/africain est le marché naturel de RAMI. Aucun concurrent majeur n'est optimisé pour ce marché. C'est l'avantage compétitif ultime de RAMI.

**Ce qui manque :**

-   Génération de contenu en arabe (darija + fusha)
-   Interface RTL pour utilisateurs arabophones
-   Calendrier islamique dans le scheduler (Ramadan, Aïd, etc.)
-   WhatsApp Business API (canal \#1 Maroc)
-   Facturation en MAD (Dirham marocain)
-   Compliance CNDP visible dans l'interface
-   Code-switching FR/AR/EN dans les captions (très commun au Maroc)

***

### VECTEUR H — CLIENT PORTAL (AGENCE → CLIENT)

**Ce que c'est :** URL dédiée pour chaque client de l'agence. Le client voit son contenu, valide ou commente, sans accès au dashboard complet.

**Implémentation RAMI :** Route `/portal/[token]` → vue read-only du calendrier + approbation. Planable fait ça à \$39/mois. RAMI Agency doit le faire à \$399.

***

### VECTEUR I — WHITE-LABEL (AGENCY+)

**Ce que c'est :** L'agence revend RAMI sous son propre nom et domaine.

**Marché :** Des centaines d'agences marocaines/africaines veulent un outil sous leur marque propre. C'est un modèle B2B2C très lucratif.

**Status RAMI :** 0% implémenté. Feature Agency+ dans le plan mais nulle part dans le code.

***

### VECTEUR J — MOBILE / PWA

**Réalité :** 60%+ des réseaux sociaux sont consommés sur mobile. Les community managers travaillent depuis leur téléphone. RAMI n'a pas de vue mobile optimisée ni de PWA.

**Impact :** Sans mobile, RAMI ne peut pas être l'outil principal d'une agence.

***

## PARTIE 3 — CE QUI N'EST PAS ENCORE LANCÉ (Phase 2)

| Module                             | Effort réel IA | Valeur business      | Priorité |
|------------------------------------|----------------|----------------------|----------|
| **Analytics Ayrshare réelles**     | 3-4h           | 🔴 Bloquant          | P0       |
| **Approval Workflow**              | 6-8h           | 🔴 Bloquant          | P0       |
| **YouTube OAuth**                  | 2-3h           | 🔴 Haute             | P0       |
| **Video Reels scheduling**         | 8-10h          | 🔴 Critique          | P0       |
| **KPIs Dashboard dynamiques**      | 2h             | 🔴 Haute             | P0       |
| **LinkedIn Carousel (PDF→post)**   | 4-5h           | 🔴 Haute             | P1       |
| **Multi-format resize**            | 3-4h           | 🔴 Haute             | P1       |
| **Bibliothèque → Workflow câblé**  | 2h             | 🟠 Haute             | P1       |
| **Client Portal (approbation)**    | 8-10h          | 🟠 Haute             | P1       |
| **Best Time to Post IA**           | 4-5h           | 🟠 Haute             | P1       |
| **Arabic/RTL + WhatsApp MENA**     | 10-15h         | 🟠 Haute (MENA)      | P1       |
| **Document Engine (PDF rapports)** | 6-8h           | 🟠 Haute             | P1       |
| **Social Inbox unifié**            | 10-12h         | 🟠 Haute             | P1       |
| **Transcription Whisper**          | 3-4h           | 🟡 Moyenne           | P2       |
| **Lead Gen Apollo**                | 6-8h           | 🟡 Moyenne           | P2       |
| **Competitor Monitoring**          | 8-10h          | 🟡 Moyenne           | P2       |
| **Content Recycling Evergreen**    | 4-5h           | 🟡 Moyenne           | P2       |
| **White-label**                    | 12-15h         | 🟡 Moyenne           | P2       |
| **API Publique v1**                | 6-8h           | 🟡 Moyenne           | P2       |
| **Canva Integration**              | 4-5h           | 🟡 Moyenne           | P2       |
| **Zapier/Make Webhooks**           | 4-5h           | 🟡 Moyenne           | P2       |
| **RSS Feed auto-scheduling**       | 3-4h           | 🟡 Moyenne           | P2       |
| **Mobile PWA**                     | 15-20h         | 🟠 Haute             | P2       |
| **Billing UI complète**            | 4-5h           | 🟠 Haute             | P1       |
| **Team Management**                | 6-8h           | 🟠 Haute             | P1       |
| **Social Listening**               | 10-12h         | 🟡 Moyenne           | P3       |
| **TikTok + Threads**               | 6-8h           | 🟠 Haute             | P1       |
| **Instagram Stories**              | 4-5h           | 🔴 Critique          | P0       |
| **Video Generation IA (Runway)**   | 8-10h          | 🟠 Haute             | P1       |
| **Google Business Profile**        | 3-4h           | 🟠 Haute (SEO local) | P1       |

***

## PARTIE 4 — CE QUE FONT LES MEILLEURS REPOS GITHUB

*(En attente des résultats de l'agent GitHub — à compléter)*

Repos identifiés par analyse manuelle :

-   **postiz-app/postiz-app** (GitHub \~15k⭐) — Open-source social media management, Next.js, multi-plateforme, avec approval workflow
-   **Automatisch** (\~3k⭐) — Zapier open-source, pour comprendre les patterns d'intégration
-   **Cal.com** (\~30k⭐) — Pour les patterns de scheduling multi-tenant
-   **Dub.co** (\~18k⭐) — Link shortener avec analytics, pattern UTM tracking

***

## PARTIE 5 — ANALYSE DESIGN vs IMPLÉMENTATION

### Connexions Sociales — Ce que le design promet vs code

-   LinkedIn ✅ codé
-   Instagram ✅ codé
-   X/Twitter ✅ codé
-   Facebook Pages ✅ codé
-   Pinterest ✅ codé
-   **YouTube ❌ design Phase 1 mais non codé**
-   TikTok 🔜 Phase 2 design
-   WhatsApp Business 🔜 Phase 2 design

### Brand DNA — Gestalt dans le design mais pas dans le wizard actuel

Le design montre 6 principes Gestalt sélectionnables (Proximité, Similitude, Continuité, Clôture, Figure/Fond, Symétrie). C'est une feature différenciante majeure. À valider si elle est dans le wizard actuel.

### Analytics — Score Brand DNA 30 jours

La courbe d'évolution du Score Brand DNA sur 30 jours est dans le design. Elle nécessite un historique quotidien du score dans Supabase → table `brand_dna_score_history (tenant_id, date, score)`.

***

## PARTIE 6 — ROADMAP PRIORISÉE RECOMMANDÉE

### Sprint P0 — "Rendre RAMI vendable" (estimation : 3-4 jours IA)

1.  Analytics Ayrshare réelles (remplace mockées)
2.  KPIs Dashboard dynamiques (vrais chiffres Supabase)
3.  YouTube OAuth Phase 1
4.  Approval Workflow basique (submit → approve → publish)
5.  Instagram Stories scheduling
6.  Billing UI complète (liste factures, Stripe portal)

### Sprint P1 — "Rendre RAMI meilleur que la concurrence" (estimation : 5-7 jours IA)

1.  LinkedIn Carousel (PDF auto-formaté)
2.  TikTok + Video scheduling
3.  Multi-format resize (1 visuel → 12 formats)
4.  Client Portal (lien unique pour validation)
5.  Team management (rôles)
6.  Social Inbox unifié
7.  Best Time to Post IA
8.  Arabic/RTL + WhatsApp Business
9.  Document Engine (rapports PDF clients)
10. Google Business Profile

### Sprint P2 — "Rendre RAMI incontournable" (estimation : 8-10 jours IA)

1.  Video generation IA (Runway ML / Kling)
2.  Competitor Monitoring + Analyse Causse auto
3.  Content Recycling Evergreen
4.  Social Listening (mentions)
5.  Canva + Google Drive intégration
6.  Zapier/Make Webhooks
7.  RSS Feed auto-scheduling
8.  White-label (Agency+)
9.  Mobile PWA
10. API Publique v1

***

## CONCLUSION SPARRING

RAMI a le différenciateur le plus fort du marché (Brand DNA neuropsychologique). Aucun concurrent ne fait ça. Mais ce différenciateur est actuellement noyé dans des gaps fonctionnels basiques qu'une agence à \$399/mois ne peut pas accepter.

**Le vrai problème :** Une agence qui regarde RAMI et regarde ContentStudio (\$99/mois avec approval workflow, vidéo, RSS, client portal) va choisir ContentStudio. Pas parce que ContentStudio est meilleur — mais parce qu'il fait les bases.

**La priorité absolue :** Fermer les gaps P0 avant de pitcher à des agences. Analytics réelles, approval workflow, YouTube, vidéo. Sans ça, RAMI est une belle démo, pas un outil de production.
