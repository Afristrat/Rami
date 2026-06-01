# Enrichissement de leads — Providers & BYOK

> Guide de création des clés API pour chaque fournisseur d'enrichissement de leads, et leur
> branchement dans le système **BYOK** de RAMI. Vérifié le 2026-06-01 contre les docs officielles.
> ⚠️ Les tiers gratuits / quotas changent souvent — toujours reconfirmer sur la page *pricing* du fournisseur.

## Principe BYOK dans RAMI

Les clés sont gérées dans la table **`ai_provider_keys`** (clé globale plateforme par provider, chiffrée
**AES-256-GCM**, `category = 'enrichment'`). Résolution runtime : si `api_key_encrypted` est présent →
déchiffré et utilisé ; sinon **fallback sur la variable d'environnement** (ex. `APOLLO_API_KEY`).

- Aucune clé en clair en base : chiffrement via `encryptToken()` / `decryptToken()` (`src/lib/utils/crypto.ts`).
- Aucune clé en clair dans le code ou git : env (Coolify) ou table BYOK uniquement.
- Le provider actif par défaut est défini côté service d'enrichissement (`src/lib/services/leads/`).

| Provider | Env var (fallback) | Auth | Base URL | Tier gratuit API | RGPD |
|---|---|---|---|---|---|
| **Hunter.io** | `HUNTER_API_KEY` | `api_key` (query) ou header `X-API-KEY` | `https://api.hunter.io/v2` | ✅ Oui (~25 recherches/mois) | OK |
| **Apollo.io** | `APOLLO_API_KEY` | header `X-Api-Key` | `https://api.apollo.io/api/v1` | ❌ Non (API = plan payant) | US |
| **People Data Labs** | `PDL_API_KEY` | header `X-Api-Key` (ou `?api_key=`) | `https://api.peopledatalabs.com/v5` | ✅ Oui (crédits gratuits, voir dashboard) | US |
| **Dropcontact** 🇫🇷 | `DROPCONTACT_API_KEY` | header `X-Access-Token` | `https://api.dropcontact.com` | ⚠️ Essai (pas de tier gratuit permanent API) | ✅✅ 100 % RGPD (audité CNIL, serveurs UE) |
| **Enrich.so** | `ENRICH_API_KEY` | header (voir docs.enrich.so) | `https://api.enrich.so` | ✅ Oui (100 crédits, sans CB) | à vérifier |

---

## 1. Hunter.io — *provider gratuit recommandé pour démarrer*

**Cas d'usage** : trouver l'email professionnel à partir de `domaine + prénom + nom` (Email Finder).
Le tier gratuit inclut un accès API (idéal dev/test sans coût).

**Créer la clé** :
1. Créer un compte sur **https://hunter.io** (gratuit, sans carte).
2. Aller sur **https://hunter.io/api-keys** (menu *API* du dashboard).
3. La clé API est **générée automatiquement** et affichée sur cette page — la copier.

**Utilisation** :
- Endpoint Email Finder : `GET https://api.hunter.io/v2/email-finder?domain={domaine}&first_name={prenom}&last_name={nom}&api_key={CLE}`
- La réponse contient `data.email`, `data.score` (confiance), `data.position` (titre), `data.company`.
- Auth alternative : header `X-API-KEY: {CLE}`.
- Quota gratuit exact : voir **https://hunter.io/pricing** (≈25 recherches/mois au moment de la rédaction).

---

## 2. Apollo.io — *enrichissement People Match (plan payant requis pour l'API)*

**⚠️ Important** : l'API REST d'Apollo (`/people/match`, `/mixed_people/search`, etc.) est **inaccessible
en plan gratuit** — réponse `403 API_INACCESSIBLE` : « not accessible with this api_key on a free plan ».
Les crédits du plan gratuit ne valent **que pour l'app web**, pas l'API. Un **plan payant** est requis.

**Créer la clé** :
1. Lancer Apollo et aller dans **Settings > Integrations**.
2. Cliquer **Connect** à côté de **Apollo API**.
3. **API Keys > Create new key**.
4. Saisir un nom + description, puis choisir des endpoints précis **ou** activer **« Set as master key »** (tous endpoints).
5. **Create API key**, puis **copier** la clé.

**Utilisation** :
- Endpoint enrichissement : `POST https://api.apollo.io/api/v1/people/match`
- Auth : header **`X-Api-Key: {CLE}`** (Apollo refuse la clé en body : « must be passed in the X-Api-Key header »).
- Body : `{ first_name, last_name, organization_name, email?, linkedin_url? }` → `{ person: { title, email, organization{...}, ... } }`.

---

## 3. People Data Labs (PDL) — *enrichissement personne/entreprise, API-first*

**Créer la clé** :
1. Créer un compte sur **https://dashboard.peopledatalabs.com** (tier gratuit avec crédits).
2. Dans le dashboard, section **API Keys** → copier la clé.

**Utilisation** :
- Base : `https://api.peopledatalabs.com/v5`
- Person Enrichment : `GET https://api.peopledatalabs.com/v5/person/enrich?...`
- Auth : header **`X-Api-Key: {CLE}`** (préféré) ou `?api_key={CLE}`. Clé invalide → `401`.
- Quota gratuit : voir le dashboard / **https://www.peopledatalabs.com/pricing**.

---

## 4. Dropcontact 🇫🇷 — *100 % RGPD (recommandé pour la conformité CNDP/UE)*

**Cas d'usage** : enrichissement email + données B2B avec **garantie RGPD** (algorithmes propres, serveurs UE,
audité CNIL 2019). Argument de conformité fort pour le marché Maroc/France. Pas de tier gratuit API permanent
(essai pour tester sur tes fichiers).

**Créer la clé** :
1. Souscrire sur **https://www.dropcontact.com/** (à partir d'~24 €/mois pour 1000 crédits).
2. Dans l'app **https://app.dropcontact.com** → **Settings / Paramètres → API** → copier le *token d'accès*.

**Utilisation** (API **asynchrone**) :
- `POST https://api.dropcontact.com/v1/enrich/all` (soumet un batch) → renvoie un `request_id`.
- `GET https://api.dropcontact.com/v1/enrich/all/{request_id}` (récupère le résultat quand prêt).
- Auth : header **`X-Access-Token: {CLE}`**.

---

## 5. Enrich.so — *API-first, 100 crédits gratuits, serveur MCP*

**Créer la clé** :
1. Créer un compte sur **https://app.enrich.so** (100 crédits gratuits, sans carte).
2. Section **API Keys** du dashboard → générer / copier la clé.

**Utilisation** :
- Base : `https://api.enrich.so` (voir **https://docs.enrich.so** pour les endpoints exacts : email finder, validation, lead finder).
- Fournit aussi un **serveur MCP** + SDK Node — pratique pour agents IA.

---

## Brancher une clé dans RAMI (BYOK)

Deux options, par ordre de priorité de résolution :

1. **Table BYOK `ai_provider_keys`** (recommandé en prod, chiffré) — via l'admin BYOK :
   ligne `provider` (`hunter` | `apollo` | `pdl` | `dropcontact` | `enrich`), `category = 'enrichment'`,
   `api_key_encrypted` = clé chiffrée AES-256-GCM.
2. **Variable d'environnement** (fallback Coolify/.env) : `HUNTER_API_KEY`, `APOLLO_API_KEY`,
   `PDL_API_KEY`, `DROPCONTACT_API_KEY`, `ENRICH_API_KEY`.

Si aucune clé (ni BYOK ni env) → le service dégrade proprement (`reason: "no_key"`, message UI explicite),
jamais de crash.

---

## Sources (vérifiées 2026-06-01)

- Apollo — [docs.apollo.io/docs/create-api-key](https://docs.apollo.io/docs/create-api-key)
- Hunter — [hunter.io/api-keys](https://hunter.io/api-keys) · [hunter.io/api-documentation/v2](https://hunter.io/api-documentation/v2)
- People Data Labs — [docs.peopledatalabs.com/docs/authentication](https://docs.peopledatalabs.com/docs/authentication)
- Dropcontact — [developer.dropcontact.com](https://developer.dropcontact.com/) · [dropcontact.com (RGPD/CNIL)](https://www.dropcontact.com/)
- Enrich.so — [enrich.so](https://www.enrich.so/alternatives/apollo) · docs.enrich.so
