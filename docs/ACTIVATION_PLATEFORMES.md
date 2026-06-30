# Guide d'activation des plateformes sociales — RAMI

> **But** : amener chaque plateforme « restante » jusqu'à une **publication réelle vérifiée**.
> **État au 2026-06-30** (preuve système) :
> - ✅ **Fonctionnelles** (clés Coolify présentes + connexion réelle prouvée) : **X / Twitter**, **LinkedIn**.
> - ⚠️ **`live` dans le code mais SANS clés** (bouton « Connecter » → 503) : **Facebook, Instagram, Pinterest**.
> - 🟠 **`coming_soon`, mécanique codée mais non activée** : **YouTube, TikTok**.
> - ❌ **Supprimée** : Mastodon.
>
> **Règle d'or (DEFCON)** : une plateforme n'est « activée » que lorsqu'une **publication réelle** a réussi en prod **et** que sa **collecte de métriques** est branchée. « Clés posées » ≠ « activée ».

---

## 0. Constantes RAMI communes (valables pour toutes les plateformes)

- **Domaine canonique de prod** : `https://rami-os.com` (= `NEXT_PUBLIC_APP_URL`). `rami.ai-mpower.com` reste un filet.
- **Redirect URI OAuth** (à déclarer à l'identique dans chaque portail) :
  `https://rami-os.com/api/oauth/<platform>/callback`
- **Où poser les clés** : variables d'environnement de l'app Coolify `rami` (uuid `ry8ytnene4czxdhsoes0z56y`). Après ajout/modif d'une var **buildtime**, un **rebuild** est nécessaire ; les vars purement runtime nécessitent un redeploy léger.
- **Chiffrement** : les tokens OAuth sont chiffrés AES-256 au repos (`OAUTH_TOKEN_ENCRYPTION_KEY`), déjà en place.
- **Après provisioning** : tester la connexion dans **Réglages → Connexions** (bouton « Tester »), puis publier un post réel et vérifier le résultat.

### Checklist générique par plateforme
1. Créer / configurer l'app sur le portail développeur.
2. Déclarer le **redirect URI** exact (ci-dessus).
3. Activer les **scopes** attendus par RAMI (listés plus bas — ils viennent du code `src/lib/services/oauth/config.ts`).
4. Récupérer **client id + secret**, les poser dans Coolify (noms exacts ci-dessous).
5. (Si requis) **App review / audit** de la plateforme.
6. Pour YouTube/TikTok uniquement : passer le `status` de `coming_soon` → `live` dans `src/lib/scheduler/platform-config.ts` + exposer dans l'UI connexions.
7. Connexion réelle → **publication test** → vérification.
8. **Brancher le provider de métriques** (`src/lib/services/metrics/`) — voir §6.

---

## 1. Facebook (Pages)

- **Statut code** : `live` — **clés absentes dans Coolify** → à provisionner.
- **Env Coolify** : `META_APP_ID`, `META_APP_SECRET` (partagés avec Instagram).
- **Scopes RAMI** : `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`.
- **Portail** : https://developers.facebook.com/apps → app type *Business*.
- **Procédure (vérifier sur la doc officielle au moment de le faire)** :
  1. Créer l'app Business + ajouter le produit *Facebook Login*.
  2. Déclarer le redirect URI `https://rami-os.com/api/oauth/facebook/callback`.
  3. Ajouter les permissions ci-dessus.
  4. ⚠️ **Business Verification + App Review obligatoires** pour `pages_manage_posts` / `pages_read_engagement` en production (publication sur des Pages tierces). En *Development mode*, seuls les rôles de l'app (toi) peuvent publier — utile pour tester avant review.
- **Points de vigilance** : la publication se fait sur une **Page** (pas un profil perso) → l'utilisateur doit être admin d'au moins une Page. Le token de Page est dérivé du token utilisateur.

## 2. Instagram (Business/Creator via Graph API)

- **Statut code** : `live` — **clés absentes** (mêmes clés Meta que Facebook).
- **Env Coolify** : `META_APP_ID`, `META_APP_SECRET`.
- **Scopes RAMI** : `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`.
- **Procédure** :
  1. Même app Meta que Facebook + produit *Instagram Graph API*.
  2. Redirect URI `https://rami-os.com/api/oauth/instagram/callback`.
  3. ⚠️ Le compte Instagram doit être **Business ou Creator** et **rattaché à une Page Facebook** (l'API passe par la Page → `instagram_business_account`).
  4. **App Review** requis pour `instagram_content_publish` en prod.
- **Contrainte média** : Instagram **exige une image/vidéo** (pas de post texte seul) — déjà géré côté RAMI.

## 3. Pinterest

- **Statut code** : `live` — **clés absentes**.
- **Env Coolify** : `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`.
- **Scopes RAMI** : `boards:read`, `pins:read`, `pins:write`.
- **Portail** : https://developers.pinterest.com/apps → créer une app.
- **Procédure** :
  1. Créer l'app, déclarer le redirect URI `https://rami-os.com/api/oauth/pinterest/callback`.
  2. ⚠️ Pinterest démarre en **Trial access** (quota limité). Demander le **Standard access** pour lever les limites de publication.
- **Contrainte média** : un Pin **exige une image** + un board cible.

## 4. YouTube (Google / Data API v3) — mécanique 2a+2b déjà codée

- **Statut code** : `coming_soon`. OAuth + service d'upload **codés et testés en isolation** (jamais exécutés contre la vraie API).
- **Env Coolify** : `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`.
- **Scopes RAMI** : `youtube.upload`, `youtube.readonly`. (Refresh token via `access_type=offline` + `prompt=consent` — déjà câblé.)
- **Portail** : https://console.cloud.google.com/apis/credentials.
- **Procédure** :
  1. Créer/choisir un projet Google Cloud, **activer « YouTube Data API v3 »**.
  2. Configurer l'**écran de consentement OAuth** (External). Tant que l'app est en *Testing*, ajouter ton compte en *test user* ; pour le public, une **vérification Google** est requise (les scopes YouTube sont sensibles).
  3. Créer un **OAuth client ID** type *Web application*, redirect URI `https://rami-os.com/api/oauth/youtube/callback`.
  4. Récupérer client id/secret → Coolify.
- **Activation RAMI** : passer `youtube.status` à `live` (`platform-config.ts`), retirer `comingSoon` de YouTube dans `connections-client.tsx`.
- **À vérifier contre la vraie API** : format de réponse de l'upload résumable, classement automatique en Short pour les vidéos verticales.

## 5. TikTok (Content Posting API) — mécanique 2a+2b déjà codée

- **Statut code** : `coming_soon`. App déclarée à ~95 % (passation #18) mais **clés absentes de Coolify**.
- **Env Coolify** : `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`. ⚠️ L'identifiant est un **client key** (pas un `client_id`) — déjà géré côté code.
- **Scopes RAMI** : `user.info.basic`, `video.upload`, `video.publish`.
- **Portail** : https://developers.tiktok.com/apps.
- **Procédure** :
  1. Récupérer client key/secret de l'app RAMI existante → Coolify.
  2. Redirect URI `https://rami-os.com/api/oauth/tiktok/callback`.
  3. ⚠️ **Vérification du domaine** de l'URL vidéo (`s3-rami.ai-mpower.com`) dans l'app TikTok — **obligatoire** pour `PULL_FROM_URL` (TikTok tire la vidéo depuis cette URL).
  4. ⚠️ **App review TikTok** : exige une **vidéo démo du flux end-to-end** (à enregistrer au calme). Tant que l'app n'est pas auditée (*sandbox*), `privacy_level` est limité à `SELF_ONLY` et seul le mode **brouillon** (inbox) est fiable.
- **Deux modes (déjà codés, configurables)** : *Direct Post* (publication directe, app auditée) ou *brouillon* (dépôt dans l'app, l'utilisateur finalise). Commencer par le **brouillon** pour valider la chaîne avant l'audit.
- **Activation RAMI** : `tiktok.status` → `live`, ajouter TikTok à la liste UI connexions.

---

## 6. ⚠️ Volet ANALYTICS — à brancher EN MÊME TEMPS que chaque activation

Le Performance Loop est **déjà réel** (collecte → `post_metrics` RLS → attribution → recommandations → intelligence collective). MAIS la **collecte de métriques** n'existe que pour **Twitter, LinkedIn, Meta (FB+IG), Pinterest**. Il **manque** YouTube et TikTok.

➡️ **Règle** : activer une plateforme pour publier **sans** ajouter son provider de métriques = ses données ne remontent **pas** dans l'analytics centralisé. Donc, à chaque activation :
1. Créer le provider `src/lib/services/metrics/<platform>.ts` (YouTube Data API `videos?part=statistics` ; TikTok `video/query` metrics).
2. L'enregistrer dans le router `src/lib/services/metrics/index.ts`.
3. Vérifier que `collect-metrics` (worker pg-boss, T+1h/24h/7j) le route correctement.

**Extensions analytics identifiées** (chantier séparé, à cadrer) : métriques de **compte** (followers/croissance, pas seulement par-post), exploitation des **séries temporelles** (3 snapshots déjà stockés mais seul le dernier est affiché), moteur d'analyse/reco plus riche, et application du feature flag `performance_loop` sur le dashboard analytics principal (actuellement non gardé).

---

## Ordre d'activation recommandé

1. **TikTok** (app la plus avancée — 95 %) en mode **brouillon** d'abord → valide la chaîne vidéo + l'upload depuis MinIO, sans dépendre de l'audit.
2. **YouTube** (Google Cloud, scopes sensibles → prévoir la vérification).
3. **Meta (Facebook + Instagram)** — une seule app Meta couvre les deux, mais Business Verification + App Review sont longs → lancer tôt.
4. **Pinterest** (le plus simple ; juste le passage Trial → Standard).

Pour chacune : **clés → connexion réelle → publication test → vérif → provider de métriques**.
