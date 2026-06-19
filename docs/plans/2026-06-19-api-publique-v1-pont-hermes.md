# API Publique v1 + Pont Hermès — Spec d'implémentation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans pour implémenter ce plan lot par lot. Gates à CHAQUE commit : `npm run typecheck` (0) · `npm run lint` (0) · `npm test` · `npm run build` · RLS testée (nouvelles tables) · **curl-verify PROD** (compte AI-MPower) — doctrine zéro-dette + DEVCON 1 (aucune donnée inventée).

**Goal :** Permettre à l'agent **Hermès** (« Assas ») de piloter RAMI par HTTP — créer du contenu, publier, générer des présentations, lire les KPIs — avec une **clé API par tenant**, et de restituer le résultat à Amine sur son canal d'origine (Telegram / WhatsApp / mail).

**Architecture :** Hermès appelle une nouvelle **API publique REST `/api/v1`** de RAMI, authentifiée par **clé API Bearer** (table `api_keys`, hash SHA-256, scopée au tenant + gatée par la feature `api_publique`). Les endpoints v1 **wrappent les Server Actions déjà existantes** (publication, génération, présentations, analytics) — zéro réécriture de logique métier. La publication reste **asynchrone** (pg-boss déjà en place) ; Hermès **poll** l'état du post jusqu'au statut terminal. Les opérations rapides (contenu texte, présentation, analytics) sont **synchrones**. Côté Hermès : un **skill `rami`** (curl + polling) lit la clé depuis son vault et répond sur le canal d'origine (comportement natif de la gateway).

**Tech Stack :** Next.js 15 App Router (Route Handlers), TypeScript strict, Drizzle + Supabase (RLS), Zod, pg-boss, SHA-256 (node:crypto). Côté Hermès : SKILL.md + curl/jq, vault DPAPI → `/opt/data/.env`.

---

## Constat fondateur (vérifié dans le code, 2026-06-19)

- ❌ **L'« API publique v1 » du CLAUDE.md n'existe PAS** dans le code. Aujourd'hui RAMI est 100 % session/cookie Supabase. Aucun système de clé API, aucune table `api_keys`, aucun endpoint `/api/v1/*`.
- ✅ La **logique métier est complète et réutilisable** via Server Actions. La feature `api_publique` existe (`src/lib/billing/plans.ts` → `agency_plus` + `enterprise`). Le tenant **AI-MPower est `enterprise`** → éligible.
- ✅ Pattern d'auth/tenant de référence : `src/app/api/queue/publish/route.ts` (`resolveUserTenant` → `createServiceClient` → `enqueuePublish`).
- ✅ Côté Hermès : appel REST tiers avec clé du vault = pattern standard (Cal.com, Airtable) ; vecteurs de retour **opérationnels** : Telegram (principal), Email (SMTP), WhatsApp.

---

## Contrat d'API v1 (à valider AVANT code)

**Base URL :** `https://rami.ai-mpower.com/api/v1`
**Auth :** header `Authorization: Bearer rami_sk_<...>` sur **tous** les endpoints.
**Format clé :** `rami_sk_` + 32 octets base64url (≈ 43 car.). Stockée **hashée SHA-256** ; seul un `key_prefix` (les 12 premiers car.) est conservé en clair pour l'affichage/identification. La clé en clair n'est montrée **qu'une fois**, à la génération.

### Codes d'erreur communs
| Code | Sens |
|------|------|
| 401 | Clé absente / mal formée / inconnue / révoquée |
| 403 | Tenant sans la feature `api_publique` (plan insuffisant) **ou** scope manquant |
| 422 | Payload invalide (détails Zod) |
| 404 | Ressource introuvable (ou hors tenant) |
| 409 | Conflit d'état (ex. post déjà en cours de publication) |
| 429 | Rate limit dépassé (1000 req / 24h / clé) |
| 5xx | Erreur serveur (jamais de faux succès) |

### Endpoints

**LOT 1 — Publication** (async, scope `posts:write`)
- `POST /v1/posts` — crée un post (brouillon).
  Body : `{ platforms: string[], content: string, mediaUrls?: string[], status?: "draft" | "ready" }`
  → `201 { id, status, platforms, createdAt }`
- `POST /v1/posts/{id}/publish` — publie immédiatement ou programme.
  Body : `{ scheduledAt?: ISO8601 }`
  → `202 { postId, jobId, status: "scheduled", scheduledAt }`
- `GET /v1/posts/{id}` — état d'un post (**polling**).
  → `200 { id, status, platformResults, publishedAt, errorMessage }`
  (Hermès poll jusqu'à `status ∈ {published, failed}`.)

**LOT 2 — Contenu complet** (synchrone, scope `content:write`)
- `POST /v1/content` — pipeline brief → captions par plateforme (+ visuels Brand DNA optionnels).
  Body : `{ brief: { titre: string, description: string, objectif?: string }, platforms: string[], generateVisuals?: boolean, createDraft?: boolean }`
  → `200 { captions: { [platform]: string }, visuals?: [{ url, brandDnaScore }], draftPostId?: string }`
  ⚠️ Décompte du quota de génération (comme l'UI). Timeout serveur généreux (génération visuelle ≤ ~35s, sous la limite Cloudflare ~100s).

**LOT 3 — Présentation** (synchrone, scope `presentations:write`)
- `POST /v1/presentations` — génère un deck.
  Body : `{ brief: string, audience?: string, language?: "fr"|"en"|..., slidesTarget?: number }`
  → `200 { id, title, slideCount, downloadUrl }` (`downloadUrl` = route PPTX existante).

**LOT 4 — Analytics** (synchrone, scope `analytics:read`)
- `GET /v1/analytics?period=7d|30d` — KPIs du tenant.
  → `200 { period, totals: { posts, impressions, engagement, engagementRate }, byPlatform: [...], topPosts: [...] }`
  (Chiffres 100 % réels via `post_metrics` ; état vide honnête si aucune donnée.)

---

## LOT 0 — Fondation API à clé (prérequis de tout)

**Fichiers**
- Create : `supabase/migrations/20260315000016_api_keys.sql`
- Create : `src/lib/db/schema.ts` → ajouter la table `apiKeys` (Drizzle)
- Create : `src/lib/services/api-keys/keys.ts` (PUR : `generateApiKey()`, `hashApiKey(raw)`, `parsePrefix(raw)`)
- Create : `src/lib/api/auth.ts` (`authenticateApiRequest(req): Promise<{ tenantId, plan, scopes } | ApiError>`)
- Create : `src/lib/api/respond.ts` (helpers `apiError(code, msg, details?)`, `apiOk(data, status?)`)
- Create : `src/lib/api/rate-limit.ts` (compteur par clé, réutilise le pattern Supabase de `api/brand-dna/ai-assist`)
- Create : `src/lib/actions/api-keys.actions.ts` (`createApiKeyAction`, `listApiKeysAction`, `revokeApiKeyAction`)
- Create (UI minimale, zéro dette) : `src/app/(dashboard)/settings/api/page.tsx` + composant client (générer / lister / révoquer ; la clé en clair affichée une seule fois)
- Test : `src/lib/services/api-keys/keys.test.ts` (génération, hash round-trip, prefix), `src/lib/api/auth.test.ts` (mock)

**Table `api_keys`**
```sql
CREATE TABLE api_keys (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        text NOT NULL,                 -- libellé ("Hermès")
  key_prefix  varchar(16) NOT NULL,          -- ex "rami_sk_a1b2" (affichable)
  key_hash    text NOT NULL UNIQUE,          -- SHA-256 hex de la clé complète
  scopes      text[] NOT NULL DEFAULT '{}',  -- {posts:write, content:write, presentations:write, analytics:read}
  last_used_at timestamptz,
  revoked_at  timestamptz,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
-- Le tenant voit/gère uniquement SES clés (via la session dashboard)
CREATE POLICY "tenant_manage_own_api_keys" ON api_keys
  FOR ALL USING (tenant_id = get_current_tenant_id())
  WITH CHECK (tenant_id = get_current_tenant_id());
-- La validation des requêtes API se fait en service-role (bypass RLS) dans le middleware.
```

**Middleware `authenticateApiRequest`** (logique)
1. Lire `Authorization: Bearer …` → sinon `401`.
2. `hashApiKey(raw)` → SELECT service-role `api_keys` WHERE `key_hash` = … AND `revoked_at IS NULL` → sinon `401`.
3. Charger `tenants.plan` → `hasFeatureAccess(plan, 'api_publique')` sinon `403`.
4. `rate-limit` par `api_keys.id` (1000/24h) sinon `429`.
5. `UPDATE last_used_at = now()` (best-effort).
6. Retourner `{ tenantId, plan, scopes }`. Chaque endpoint vérifie ensuite son scope.

**Bootstrap clé AI-MPower** : via `createApiKeyAction` (UI settings/api) connecté en super-admin **ou** script SQL ponctuel (insert hash). La clé en clair est récupérée **une seule fois** et déposée dans le vault Hermès (jamais dans le chat ni un fichier suivi par git).

**DoD LOT 0** : migration appliquée `db-rami` + **RLS testée cross-tenant** (SELECT isolé, INSERT intrusif rejeté) · gates verts · UI settings/api browser-verified (générer → afficher une fois → révoquer).

---

## LOT 1 — Vertical slice « Publier » (prouve tout le pont E2E)

**Fichiers**
- Create : `src/app/api/v1/posts/route.ts` (`POST` → crée le post ; réutilise la logique de `createPost`/insert `posts` scopé tenant)
- Create : `src/app/api/v1/posts/[id]/publish/route.ts` (`POST` → check statut + `enqueuePublish`/`enqueueScheduledPublish`, calqué sur `api/queue/publish`)
- Create : `src/app/api/v1/posts/[id]/route.ts` (`GET` → état du post : `status`, `platform_results`, `published_at`, `error_message`)
- Test : `src/app/api/v1/posts/__tests__/posts.route.test.ts` (auth manquante → 401 ; mauvais scope → 403 ; payload invalide → 422 ; happy path mocké)

**Skill Hermès** (poste/serveur, hors repo RAMI)
- Create : `~/.hermes/skills/rami/SKILL.md` — opérations `curl` : publier + **boucle de polling** sur `GET /v1/posts/{id}` jusqu'à `published`/`failed`, puis résumé. Prérequis env : `RAMI_API_KEY`, `RAMI_BASE_URL=https://rami.ai-mpower.com/api/v1`.
- Vault : ajouter `RAMI_API_KEY` (+ `RAMI_BASE_URL`) au coffre DPAPI → push `/opt/data/.env` (méthode `linkedin-integration/push_secrets_to_env.ps1` ou équivalent ; jamais en clair dans le chat).

**DoD LOT 1 (le jalon)** : **test E2E réel** — message Telegram à Hermès (« publie ce post … ») → Hermès appelle `/v1/posts` + `/v1/posts/{id}/publish` → poll → **post réellement publié** → Hermès **répond le résultat sur Telegram**. ✅ Pont prouvé bout-en-bout. (Choisir un post de test inoffensif ; le chemin brouillon ne publie rien.)

---

## LOT 2 — Contenu complet  ·  LOT 3 — Présentation  ·  LOT 4 — Analytics

Même fondation (auth + scopes), endpoints synchrones qui wrappent les actions existantes :
- **LOT 2** `src/app/api/v1/content/route.ts` → `enrichBriefAction` + `generateTextContentAction` (+ `generateVisualContentAction` si `generateVisuals`). Respecte le quota.
- **LOT 3** `src/app/api/v1/presentations/route.ts` → `createPresentationDeckAction`, renvoie `id` + `downloadUrl` (route PPTX existante).
- **LOT 4** `src/app/api/v1/analytics/route.ts` → `assembleAnalytics`/`fetchAnalyticsBundle` (`post_metrics`), période 7j/30j.

Chaque lot : ajouter le scope au skill Hermès, gates verts, curl-verify PROD. Lots 2-4 livrables après le slice LOT 0+1 validé.

---

## Séquencement & exécution

1. **LOT 0 + LOT 1** d'abord (vertical slice) → pont fonctionnel et prouvé sur Telegram.
2. Puis **LOT 2 → 3 → 4** (incréments rapides, même patron).

Exécution proposée : **mode Ralph** (nouvelle story **US-051**) — une story par lot dans `.ralph/prd.json`, gates + curl/browser-verify à chaque, commit `[US-051][LOT-n] …`.

## Risques / points d'attention
- **Cloudflare gzip binaire** : le PPTX (LOT 3) se télécharge via la route existante (déjà gérée) ; l'API renvoie l'URL, pas les octets.
- **Timeout requêtes synchrones** : génération visuelle (LOT 2) ≤ ~35s, sous la limite Cloudflare ~100s — OK ; sinon basculer en job.
- **Anti-leak** : la clé API ne transite jamais en clair dans le chat ; source de vérité = table `api_keys` (hash) + vault Hermès.
- **Tenant des connexions OAuth** : les comptes LinkedIn/X connectés sont sur le tenant **AI-MPower** (super-admin) — c'est ce tenant que la clé API doit cibler pour publier réellement.
