---
name: Rapport Audit RAMI — Partie 1 : Gaps UI vs Implémentation
description: Analyse des écrans Stitch vs code existant — ce qui est conçu mais pas codé
type: project
---

# RAMI Audit — Partie 1 : Gaps UI vs Implémentation
*Généré le 2026-03-12 — Analyse des 12 écrans Stitch*

## Statut rapport global
- [x] P1 — Gaps UI vs implémentation (ce fichier)
- [ ] P2 — Analyse compétitive + Reddit (en cours, agent background)
- [ ] P3 — GitHub repos + features manquantes
- [ ] P4 — Rapport final consolidé

---

## 1. ÉCRANS ANALYSÉS vs ÉTAT RÉEL

### Dashboard (tableau_de_bord_rami_premium)
**Design montre :**
- KPIs : Posts publiés (47), Visuels générés (124), Posts planifiés (12), Score Brand DNA (87%)
- Brand DNA actif avec score + couleurs + tags
- Actions rapides : Créer contenu, Calendrier, Analytics
- Activités récentes avec statut (VIABLE, PLANIFIÉ) + plateforme

**Navigation visible dans le design :** Dashboard, Créer du contenu, Calendrier, Bibliothèque, Analytics, Brand DNA, Connexions, **Facturation**, Paramètres

**GAP CRITIQUE :** KPIs dynamiques (posts publiés réels, visuels générés comptés) — le dashboard actuel est-il connecté aux vraies données Supabase ou des stubs ?

---

### Connexions Sociales (gestion_des_connexions_sociales_rami)
**Design montre :**
- LinkedIn ✅, Instagram ✅, X/Twitter ⚠️ (token expiré) — connectés
- **Facebook Pages**, **Pinterest Business**, **YouTube Channel** — disponibles à connecter (Phase 1!)
- TikTok Business, WhatsApp Business — Phase 2 indisponibles

**GAP CRITIQUE N°1 — YouTube manquant :**
YouTube est affiché en Phase 1 "Disponible à connecter" dans le design mais PAS implémenté dans le code. C'est un gap entre le design et la réalité.

**GAP CRITIQUE N°2 — Facebook Pages vs compte perso :**
Le design distingue "Facebook Pages" (pages business) des comptes personnels. La connexion Meta implémentée couvre-t-elle les Pages spécifiquement (Graph API page access) ?

---

### Brand DNA — Gestalt (configuration_brand_dna_gestalt_added)
**Design montre 6 principes Gestalt avec icônes :**
1. Proximité (Unité) — groupe sentiment communauté
2. Similitude (Reconnaissance) — identification éléments
3. Continuité (Direction) — regard vers l'action principale
4. Clôture (Mystère) — completion imaginaire contenu
5. Figure/Fond (Focus) — hiérarchie information
6. Symétrie (Ordre) — équilibre autorité professionnalisme

**GAP :** Le wizard Brand DNA actuel a-t-il la section Gestalt avec sélection interactive des principes ? Ou juste les couleurs Causse ?

---

### Workflow Étape 4 — Directions Artistiques
**Design montre :**
- 4 directions avec noms : Blueprint Scientifique, Narratif Premium, Dashboard Data, Organique Authentique
- Score Brand DNA sur chaque direction (87%, 91%, 70%, 91%)
- 5 visuels par direction (row de miniatures)
- Compteur "3 visuels sélectionnés" en bas + bouton "Continuer → Étape 5 Sélection"
- Brief actif visible en sidebar

**GAP :** L'étape 4 actuelle génère des directions nommées dynamiquement depuis le Brand DNA ou des noms hardcodés ?

---

### Analytics Dashboard
**Design montre :**
- Tabs : Posts, Formats, Réseaux, Personnalisé
- KPIs : 47 publications, 124 580 portée, 3,8% taux d'engagement, meilleure plateforme LinkedIn
- Graphe engagement par plateforme (30 jours) — courbes par RS
- Répartition posts par statut (donut chart — 94 posts)
- **Top Posts par engagement** avec tableau : plateforme, contenu, nb likes, partages, commentaires, engagement %
- **Score Brand DNA — 30 jours** — courbe d'évolution temporelle du score

**GAP MAJEUR :** Analytics actuelle = données mockées. Zéro connexion Ayrshare réelle.
**GAP SPÉCIFIQUE :** "Score Brand DNA 30 jours" — tracking historique du score = feature non implémentée nulle part dans le code.

---

### Calendrier (calendrier_de_publication_rami)
**Design montre :**
- Filtres plateforme en haut (Tout, LinkedIn, Instagram, X, Facebook)
- Section "BROUILLONS" dans la sidebar gauche avec liste
- Panel détail post à droite : contenu texte, image preview, hashtags, "PUBLIER SUR" icons, boutons Modifier/Supprimer/**Publier maintenant**
- Bas de page : "Mars 2026 — 23 posts planifiés, 8 publiés, 3 brouillons"

**GAP :** Bouton "Publier maintenant" dans le calendrier — déclenche-t-il le publish-worker pg-boss ou juste change le statut ?

---

### Bibliothèque (bibliothèque_de_médias)
**Design montre :**
- **Navigation top-level :** RAMI Agency OS + Dashboard + **Projets** + **Équipe**
- Tabs : Tout, Images, **Visuels générés**, **Logos**, **Vidéos**, **Documents**
- Multi-sélection (3 éléments) + "Utiliser dans un post" + "Download ZIP"
- Drag & drop zone visible
- Fichiers mixtes : PNG, logo, JPG, **XLSX (Reporting_Q3_2023.xlsx)**, **MP4 (Intro_Animation)**

**GAP CRITIQUE N°1 :** Navigation "Projets" et "Équipe" dans le top-nav = multi-projet et team management = pas encore implémentés.

**GAP CRITIQUE N°2 :** Tab "Vidéos" = gestion vidéos (Instagram Reels, YouTube Shorts, TikTok) = MISSING.

**GAP CRITIQUE N°3 :** Tab "Documents" = gestion documents = MISSING (Document Engine Phase 2).

**GAP CRITIQUE N°4 :** "Utiliser dans un post" depuis la bibliothèque = connexion bibliothèque → workflow = probablement pas câblé.

---

### Onboarding Step 2 (Marque)
**Design montre :**
- 3 étapes : Identité → **Marque** → Lancement
- Zone dépôt logo
- **Objectif Psychologique** : Confiance, Urgence, Aspiration, Expertise, Communauté, Joie — 6 options
- **Marché Cible** : Maroc, Afrique, Europe, International

**GAP :** L'onboarding actuel a bien les 6 objectifs cognitifs ? Vérifié dans le code : oui mais les icônes et le visuel correspondent-ils exactement au design ?

---

## 2. FEATURES VISIBLES DANS LES DESIGNS MAIS ABSENTES DU CODE

| Feature | Écran source | Priorité | Impact |
|---------|-------------|---------|--------|
| YouTube OAuth Phase 1 | Connexions | HAUTE | Plateforme majeure manquante |
| Score Brand DNA historique (30j) | Analytics | HAUTE | Valeur différenciante unique |
| Gestalt dans Brand DNA wizard | Brand DNA | HAUTE | Core differentiator |
| Section Brouillons dans Calendrier | Calendrier | MOYENNE | UX manquante |
| "Publier maintenant" depuis Calendrier | Calendrier | HAUTE | Action critique manquante |
| "Utiliser dans un post" depuis Bibliothèque | Bibliothèque | HAUTE | Workflow cassé |
| Tab Vidéos dans Bibliothèque | Bibliothèque | HAUTE | Instagram Reels/YouTube manquants |
| Tab Documents dans Bibliothèque | Bibliothèque | MOYENNE | Phase 2 |
| Projets (multi-projet) | Nav Bibliothèque | HAUTE | Feature agence critique |
| Équipe (team management) | Nav Bibliothèque | HAUTE | Feature agence critique |
| KPIs dynamiques Dashboard | Dashboard | HAUTE | Sans données réelles = inutile |
| Facturation dans nav | Dashboard | HAUTE | Billing UI manquant |
| Top Posts par engagement | Analytics | HAUTE | Core analytics feature |
| Export CSV/PDF Analytics | Analytics | HAUTE | Rapport client |

---

## 3. INCOHÉRENCES DESIGN ↔ IMPLÉMENTATION

1. **La navigation du design** a "Facturation" dans le sidebar — l'implémentation a `/billing/` mais est-ce câblé dans le nav actuel ?
2. **Les noms de routes** : Design montre `/create/` mais le code a `/dashboard/create/` (route group)
3. **Sidebar gauche calendrier** montre "Brouillons" comme section dédiée — le code filtre juste par statut
4. **Score Brand DNA sur chaque visuel** — le design montre 87%, 91%, 70% sur chaque direction. Le code calcule-t-il réellement un score par direction ou c'est global ?
