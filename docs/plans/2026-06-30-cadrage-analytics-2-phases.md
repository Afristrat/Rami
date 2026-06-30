# Cadrage — Volet Analytique RAMI (2 phases)

> **Statut** : cadrage à valider (arbitrages produit en fin de doc).
> **Date** : 2026-06-30.
> **Principe directeur (Amine)** : Phase 1 = **raccorder / centraliser toutes les données** de toutes les plateformes ; Phase 2 = **deep analyse & insights par client** pour **maximiser l'impact et la valeur réellement créée**.

---

## 0. État réel (preuve système, ne pas reconstruire)

Le « Performance Loop » est **déjà réel et fonctionnel** — ce n'est pas un mock :

| Brique | Existant | Fichier |
|---|---|---|
| Collecte (T+1h/24h/7j après publication) | ✅ worker pg-boss réel | `src/lib/queue/jobs/collect-metrics.ts` |
| Stockage par-post + RLS | ✅ `post_metrics` (impressions, likes, comments, shares, clicks, saves, engagement_rate, raw) | `schema.ts:152`, migration `20260315000001` |
| Providers de métriques | ✅ **Twitter, LinkedIn, Meta (FB+IG), Pinterest** (vraies APIs) | `src/lib/services/metrics/*` |
| Attribution feature→performance | ✅ par couleur, direction, hook, format, heure, objectif | `metrics/attribution.ts`, vue `attribution_facts` |
| Recommandations | ✅ règles déterministes (best hour/color/format/platform) | `analytics/recommendations.ts` |
| Intelligence collective (k-anonymity ≥5, opt-in) | ✅ benchmarks cross-tenant anonymisés | `metrics/collective.ts` |
| Prior génératif (réinjecte les gagnants dans le Prompt Compiler) | ✅ | `attribution.ts:142` |
| UI dashboard (données réelles DB) | ✅ | `dashboard/analytics/page.tsx` |

**Conclusion** : le chantier n'est **pas** de construire l'analytics, mais de **(1) compléter la couverture et la centralisation** puis **(2) muscler l'analyse et la transformer en insights actionnables par client**.

**Trous identifiés** (deviennent le backlog) :
- Providers de métriques **manquants** : YouTube, TikTok (publication codée, collecte non).
- **Pas de métriques de compte** (followers, croissance, reach indépendant des posts) — tout est par-post.
- **Séries temporelles non exploitées** : 3 snapshots stockés, seul le dernier est affiché (`fetch.ts:52`).
- **Recommandations = règles déterministes** : pas de corrélations multi-dimensions ni de récit d'insight.
- **Feature flag `performance_loop` non appliqué** sur le dashboard analytics principal (seul color-trends le garde).
- Pas d'**export / API** des métriques centralisées.

---

## PHASE 1 — RACCORDEMENT (centraliser TOUTES les données)

**Objectif** : toute plateforme connectée alimente un référentiel de métriques unifié, complet et fiable. Aucune donnée orpheline.

### 1.1 Compléter les providers de métriques (au fil de l'activation des plateformes)
- `metrics/youtube.ts` → YouTube Data API `videos?part=statistics` (views, likes, comments) + analytics si scope dispo.
- `metrics/tiktok.ts` → TikTok `video/query` (views, likes, comments, shares).
- Enregistrer dans le router `metrics/index.ts` + vérifier le routage dans `collect-metrics`.
- **Règle** : activer une plateforme pour publier **sans** son provider de métriques = données non centralisées → interdit (cf. guide d'activation §6).

### 1.2 Métriques de COMPTE (nouvelle dimension)
- Aujourd'hui : tout est par-post. Manque la santé du **compte** : followers, croissance, reach/impressions quotidiens, taux d'engagement global.
- Proposition : nouvelle table `account_metrics` (tenant_id, platform, oauth_connection_id, followers, following, reach, impressions, period_date, raw) + RLS.
- Collecte : worker cron quotidien par connexion OAuth active (endpoints « insights compte » de chaque API).

### 1.3 Exploiter les séries temporelles
- `post_metrics` stocke déjà 3 snapshots (1h/24h/7j) → exposer la **dynamique** (vélocité d'engagement, courbe de montée) plutôt que le seul dernier point.
- Adapter `fetch.ts` pour renvoyer les séries ; nouveaux composants de courbe.

### 1.4 Référentiel unifié & normalisation
- Définir un **schéma de métriques canonique** cross-plateforme (mapping des métriques hétérogènes vers un socle commun : reach, engagement, clics, conversions) pour comparer/agréger proprement.
- Couche d'agrégation par tenant / marque / campagne / période.

### 1.5 Gouvernance
- Appliquer `requireFeature("performance_loop")` sur le dashboard analytics (cohérence pricing : Pro+).
- (Option) Export CSV/API des métriques centralisées (utile au pont Hermès et aux rapports).

**Livrable Phase 1** : chaque plateforme connectée remonte post + compte, en série temporelle, dans un référentiel unifié, gardé par le plan.

---

## PHASE 2 — DEEP ANALYSE & INSIGHTS PAR CLIENT (maximiser l'impact & la valeur)

**Objectif** : passer de « tableaux de chiffres » à « **que dois-je faire, pour CE client, pour maximiser l'impact** » — et **mesurer la valeur réellement créée**.

### 2.1 Moteur d'insights par tenant (au-delà des règles)
- Corrélations **multi-dimensions** (pas seulement « meilleure couleur » isolée, mais combinaisons gagnantes : couleur × format × heure × objectif).
- Détection de patterns et d'anomalies (chute/pic d'engagement, contenu sous/sur-performant).
- (Option) Prédiction d'engagement avant publication (score attendu) à partir de l'historique du tenant + prior collectif.

### 2.2 Insights narratifs actionnables (LLM sur données réelles)
- Générer des recommandations **en langage naturel, sourcées par l'attribution réelle** (jamais inventées — DEFCON : pas de reco si échantillon < seuil, comme déjà appliqué).
- Format : « insight → preuve (chiffre) → action recommandée → impact attendu ».

### 2.3 Mesure de la VALEUR réellement créée
- **Lift** : comparer la performance avant/après application des recommandations RAMI.
- **Attribution de valeur** : quels choix (Brand DNA, couleur, format) ont produit quel gain mesurable.
- Brancher sur le **rapport client** existant (Document Engine) → un livrable « voici la valeur que RAMI vous a apportée ce mois-ci » = argument de rétention/upsell.

### 2.4 Benchmarks contextualisés
- Réutiliser l'intelligence collective (déjà k-anonyme) pour situer chaque client vs son secteur/culture (« votre engagement est 1,8× la médiane de votre secteur »).

**Livrable Phase 2** : pour chaque client, un tableau d'insights priorisés + un récit de la valeur créée, exploitable en reporting et en upsell.

---

## Arbitrages à valider (Amine)

1. **Prédiction d'engagement** (2.1) : on l'inclut dès la Phase 2, ou on commence par les corrélations/insights descriptifs et on garde le prédictif pour plus tard ?
2. **Insights LLM** (2.2) : via le proxy LiteLLM existant (texte) — OK ? Niveau de « narration » souhaité (puces sèches vs récit) ?
3. **Mesure de valeur / lift** (2.3) : c'est le différenciateur fort mais le plus complexe (besoin d'un avant/après propre). Priorité haute ou Phase 2.b ?
4. **Métriques de compte** (1.2) : quotidien suffisant, ou besoin temps quasi-réel ?
5. **Gating** : analytics de base accessible dès quel plan ? (le flag `performance_loop` est Pro+ aujourd'hui).

## Découpage indicatif en stories (à raffiner après arbitrages)
- P1-A metrics YouTube · P1-B metrics TikTok · P1-C table `account_metrics` + collecte · P1-D séries temporelles UI · P1-E référentiel unifié · P1-F flag + export.
- P2-A corrélations multi-dim · P2-B insights LLM sourcés · P2-C lift / valeur créée · P2-D benchmarks contextualisés · P2-E intégration rapport client.
