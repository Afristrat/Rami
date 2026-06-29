# Verrou de Publication (Approbation Humaine) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre toute publication impossible — workflow interne, Kanban, API v1/Hermès, posts programmés — sans une approbation humaine enregistrée par un membre du tenant.

**Architecture:** Une règle unique et pure (`publish-gate.ts`) appliquée en **défense en profondeur sur trois points** : l'API v1 `publish`, l'action interne `publishPost`, et le worker pg-boss (backstop final). Deux colonnes (`approved_by`, `approved_at`) sur `posts` portent l'état d'approbation ; toute édition de contenu les réinitialise.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Supabase/Postgres + Drizzle, pg-boss, Jest (`tests/unit/`), RLS multi-tenant.

**Plan 1/7** de la séquence du spec `docs/plans/2026-06-23-kit-validation-apercu-presets-L0.md` (§9). Les plans suivants : 2 `platform-config` enrichi, 3 `PlatformPreview` + page review, 4 presets de correction + `regenerateElement`, 5 carrousel multi-slides, 6 fix encodage, 7 kit Hermès.

## Global Constraints

- Aucun `any` TypeScript sans commentaire justificatif ; pas de `!` non-null ; `unknown` plutôt que `any` (cf. `~/.claude/rules/typescript.md`).
- `npm run lint` 0 erreur / `npm run typecheck` 0 erreur / `npm test` vert / `npm run build` OK avant chaque commit.
- **Jamais de dev local** (`npm run dev`/localhost interdits) : vérifications en PROD (compte test-ralph) ou via psql/curl sur db-rami. Gates poste (tsc/eslint/jest) autorisés.
- Migrations appliquées sur db-rami via `docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres -d postgres` (méthode base64, charger le coffre `. load-secrets.ps1`).
- Zéro factice, zéro dette laissée sur un fichier touché.
- Règle métier : un post est « approuvé pour publication » **ssi** `approved_by IS NOT NULL AND approved_at IS NOT NULL`. Toute modification de `content`/`media_urls`/`platforms`/hashtags **réinitialise** ces deux champs à NULL.

---

### Task 1 : Migration — colonnes d'approbation humaine sur `posts`

**Files:**
- Create: `supabase/migrations/20260315000017_post_human_approval.sql`

**Interfaces:**
- Produces: colonnes `posts.approved_by uuid` (FK `auth.users(id)`), `posts.approved_at timestamptz` — consommées par toutes les tâches suivantes.

- [ ] **Step 1: Écrire la migration**

```sql
-- ============================================================
-- Verrou de publication — approbation humaine sur posts
-- ============================================================
-- Aucune publication (workflow, Kanban, API v1/Hermès, programmé) ne doit
-- partir sans qu'un membre du tenant ait approuvé le contenu tel qu'il sera
-- publié. Ces deux colonnes portent cette approbation ; toute édition de
-- contenu les réinitialise (re-validation obligatoire). NULL = non approuvé.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

COMMENT ON COLUMN posts.approved_by IS 'Membre du tenant ayant approuvé la publication (NULL = non approuvé).';
COMMENT ON COLUMN posts.approved_at IS 'Horodatage de l''approbation humaine pour publication.';
```

- [ ] **Step 2: Mettre à jour le schéma Drizzle**

Modifier `src/lib/db/schema.ts` — dans la définition de la table `posts` (après `published_at`, ~ligne 97), ajouter :

```typescript
  approved_by: uuid('approved_by'),
  approved_at: timestamp('approved_at', { withTimezone: true }),
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: 0 erreur.

- [ ] **Step 4: Appliquer la migration sur db-rami**

Charger le coffre puis appliquer (PowerShell) :

```powershell
. "C:\Users\amans\.claude\secrets\load-secrets.ps1"
$sql = [IO.File]::ReadAllText("supabase\migrations\20260315000017_post_human_approval.sql")
$blob = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($sql))
ssh -i $env:SERVER_SSH_KEY "$($env:SERVER_SSH_USER)@$($env:SERVER_HOST)" "echo '$blob' | base64 -d | docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres -d postgres -v ON_ERROR_STOP=1"
```

Expected: `ALTER TABLE` sans erreur.

- [ ] **Step 5: Vérifier les colonnes**

```powershell
ssh -i $env:SERVER_SSH_KEY "$($env:SERVER_SSH_USER)@$($env:SERVER_HOST)" "docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres -d postgres -c \"\d posts\" | grep approved"
```

Expected: deux lignes `approved_by | uuid` et `approved_at | timestamp with time zone`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/20260315000017_post_human_approval.sql src/lib/db/schema.ts
git commit -m "feat(publish): colonnes approved_by/approved_at sur posts (verrou)"
```

---

### Task 2 : Module pur `publish-gate` — la règle unique

**Files:**
- Create: `src/lib/services/workflow/publish-gate.ts`
- Test: `tests/unit/publish-gate.test.ts`

**Interfaces:**
- Produces:
  - `type GatePost = { status: string; platforms: string[] | null; approved_by: string | null; approved_at: string | null }`
  - `type GateResult = { ok: true } | { ok: false; code: "no_platforms" | "not_human_approved" | "already_publishing"; message: string }`
  - `function assertPublishable(post: GatePost): GateResult`
  - `function isHumanApproved(post: Pick<GatePost, "approved_by" | "approved_at">): boolean`

- [ ] **Step 1: Écrire le test (échec attendu)**

```typescript
import { assertPublishable, isHumanApproved } from "@/lib/services/workflow/publish-gate"

const approved = { status: "approved", platforms: ["linkedin"], approved_by: "u1", approved_at: "2026-06-23T10:00:00Z" }

describe("publish-gate (verrou de publication)", () => {
  it("isHumanApproved exige approved_by ET approved_at", () => {
    expect(isHumanApproved({ approved_by: "u1", approved_at: "2026-06-23T10:00:00Z" })).toBe(true)
    expect(isHumanApproved({ approved_by: "u1", approved_at: null })).toBe(false)
    expect(isHumanApproved({ approved_by: null, approved_at: "2026-06-23T10:00:00Z" })).toBe(false)
    expect(isHumanApproved({ approved_by: null, approved_at: null })).toBe(false)
  })

  it("post approuvé avec plateforme → ok", () => {
    expect(assertPublishable(approved)).toEqual({ ok: true })
  })

  it("post non approuvé → not_human_approved", () => {
    const r = assertPublishable({ ...approved, approved_by: null, approved_at: null })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe("not_human_approved")
  })

  it("aucune plateforme → no_platforms (priorité sur l'approbation)", () => {
    const r = assertPublishable({ ...approved, platforms: [] })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe("no_platforms")
  })

  it("déjà en cours de publication → already_publishing", () => {
    const r = assertPublishable({ ...approved, status: "publishing" })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.code).toBe("already_publishing")
  })
})
```

- [ ] **Step 2: Lancer le test (vérifier l'échec)**

Run: `npm test -- publish-gate`
Expected: FAIL — `Cannot find module '@/lib/services/workflow/publish-gate'`.

- [ ] **Step 3: Écrire le module**

```typescript
// ============================================================
// Verrou de publication — règle unique partagée (DRY)
// Appliquée en 3 points : API v1 publish, action publishPost, worker.
// Pure : aucune I/O, entièrement testable.
// ============================================================

export type GatePost = {
  status: string
  platforms: string[] | null
  approved_by: string | null
  approved_at: string | null
}

export type GateResult =
  | { ok: true }
  | {
      ok: false
      code: "no_platforms" | "not_human_approved" | "already_publishing"
      message: string
    }

export function isHumanApproved(
  post: Pick<GatePost, "approved_by" | "approved_at">
): boolean {
  return post.approved_by !== null && post.approved_at !== null
}

export function assertPublishable(post: GatePost): GateResult {
  if (post.status === "publishing") {
    return { ok: false, code: "already_publishing", message: "Publication déjà en cours pour ce post." }
  }
  if (!post.platforms || post.platforms.length === 0) {
    return { ok: false, code: "no_platforms", message: "Aucune plateforme sélectionnée pour ce post." }
  }
  if (!isHumanApproved(post)) {
    return {
      ok: false,
      code: "not_human_approved",
      message: "Ce post doit être validé par un membre avant publication.",
    }
  }
  return { ok: true }
}
```

- [ ] **Step 4: Lancer le test (vérifier le succès)**

Run: `npm test -- publish-gate`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/services/workflow/publish-gate.ts tests/unit/publish-gate.test.ts
git commit -m "feat(publish): module pur publish-gate (règle d'approbation)"
```

---

### Task 3 : Server Action `approvePostForPublish` + reset d'approbation

**Files:**
- Create: `src/lib/actions/publish-approval.actions.ts`
- Modify: `src/lib/actions/approval.actions.ts` (réutiliser le pattern auth/tenant existant — lire d'abord pour copier la résolution de tenant)

**Interfaces:**
- Consumes: `isHumanApproved` (Task 2), `createClient` (`@/lib/supabase/server`), résolution de tenant (`getTenantId` cf. `scheduler.ts:484`).
- Produces:
  - `async function approvePostForPublish(postId: string): Promise<{ success: boolean; error?: string }>`
  - `async function clearPublishApproval(postId: string, tenantId: string, supabase: SupabaseClient): Promise<void>` — réutilisée par les chemins d'édition (Task 7).

- [ ] **Step 1: Lire le pattern existant**

Lire `src/lib/actions/approval.actions.ts` et `src/app/actions/scheduler.ts:476-495` pour copier exactement : import `createClient`, `getTenantId`, vérification `auth.getUser()`, scoping `tenant_id`.

- [ ] **Step 2: Écrire l'action**

```typescript
// ============================================================
// Approbation humaine pour publication (verrou — pose approved_by/at)
// Réservée à un membre authentifié ayant accès au tenant du post (RLS).
// ============================================================
"use server"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { getTenantId } from "@/app/actions/scheduler"

export async function approvePostForPublish(
  postId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Non authentifié" }

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, error: "Aucun espace de travail trouvé" }

  // Le post doit appartenir à un tenant accessible au membre (RLS + scope explicite)
  const { data: post } = await supabase
    .from("posts")
    .select("id")
    .eq("id", postId)
    .eq("tenant_id", tenantId)
    .single()
  if (!post) return { success: false, error: "Post introuvable" }

  const nowIso = new Date().toISOString()
  const { error } = await supabase
    .from("posts")
    .update({ approved_by: user.id, approved_at: nowIso, updated_at: nowIso })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
  if (error) return { success: false, error: error.message }

  // Journalisation (table audit_log — schema.ts:240)
  await supabase.from("audit_log").insert({
    tenant_id: tenantId,
    user_id: user.id,
    action: "post.human_approved",
    resource_type: "social_post",
    resource_id: postId,
    status: "success",
  })

  return { success: true }
}

export async function clearPublishApproval(
  postId: string,
  tenantId: string,
  supabase: SupabaseClient
): Promise<void> {
  await supabase
    .from("posts")
    .update({ approved_by: null, approved_at: null })
    .eq("id", postId)
    .eq("tenant_id", tenantId)
}
```

> Note : `getTenantId` doit être exporté depuis `scheduler.ts`. S'il ne l'est pas, l'exporter (vérifier ligne ~ de sa définition) ; sinon dupliquer sa logique dans un helper partagé `src/lib/auth/tenant.ts` et l'importer des deux côtés (DRY).

- [ ] **Step 3: Vérifier les colonnes `audit_log`**

```powershell
. "C:\Users\amans\.claude\secrets\load-secrets.ps1"
ssh -i $env:SERVER_SSH_KEY "$($env:SERVER_SSH_USER)@$($env:SERVER_HOST)" "docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres -d postgres -c \"\d audit_log\""
```

Expected: confirmer les noms de colonnes (`tenant_id`, `user_id`, `action`, `resource_type`, `resource_id`, `status`). **Ajuster l'`insert` du Step 2 si les noms diffèrent** (ne pas inventer).

- [ ] **Step 4: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 erreur.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/publish-approval.actions.ts src/app/actions/scheduler.ts
git commit -m "feat(publish): approvePostForPublish + clearPublishApproval + audit"
```

---

### Task 4 : Enforcement — API v1 `publish`

**Files:**
- Modify: `src/app/api/v1/posts/[id]/publish/route.ts:21,55-60`

**Interfaces:**
- Consumes: `assertPublishable` (Task 2).

- [ ] **Step 1: Sélectionner les colonnes d'approbation**

Dans le `.select(...)` (ligne 49), ajouter `approved_by, approved_at` :

```typescript
    .select("id, status, scheduled_at, platforms, approved_by, approved_at")
    .eq("id", id)
    .eq("tenant_id", auth.ctx.tenantId)
    .single<{ id: string; status: string; scheduled_at: string | null; platforms: string[] | null; approved_by: string | null; approved_at: string | null }>()
```

- [ ] **Step 2: Remplacer la garde de statut par le gate**

Supprimer la constante `PUBLISHABLE_STATUSES` (ligne 21) et le bloc `if (!PUBLISHABLE_STATUSES.includes(...))` + `if (!post.platforms ...)` (lignes 55-60). Les remplacer, juste après `if (error || !post) return apiError(404, …)`, par :

```typescript
  const gate = assertPublishable(post)
  if (!gate.ok) {
    const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/dashboard/review/${id}`
    if (gate.code === "not_human_approved") {
      return apiError(409, gate.message, [{ approvalUrl }])
    }
    return apiError(gate.code === "no_platforms" ? 422 : 409, gate.message)
  }
```

Ajouter l'import en tête : `import { assertPublishable } from "@/lib/services/workflow/publish-gate"`.

> La page `/dashboard/review/[postId]` est livrée au Plan 3 ; ici on renvoie seulement l'URL. Vérifier la signature de `apiError` (3ᵉ argument = détails) dans `src/lib/api/respond.ts` et adapter le passage de `approvalUrl` si la forme attendue diffère.

- [ ] **Step 2b: Vérifier la forme de `apiError`**

Lire `src/lib/api/respond.ts`. Adapter le `return apiError(409, gate.message, …)` au contrat réel (objet vs tableau).

- [ ] **Step 3: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 erreur.

- [ ] **Step 4: Vérification curl (PROD, chemin Hermès)**

Avec une clé API valide (scope `posts:write`) et un `postId` de post **non approuvé** :

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $RAMI_API_KEY" \
  https://rami.ai-mpower.com/api/v1/posts/<POST_ID>/publish
```

Expected: `409` (avant le fix : `202`). Confirme que Hermès ne peut plus publier sans approbation.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/v1/posts/[id]/publish/route.ts"
git commit -m "feat(publish): API v1 publish refuse sans approbation humaine (409)"
```

---

### Task 5 : Enforcement — action interne `publishPost`

**Files:**
- Modify: `src/app/actions/scheduler.ts:488-504`

**Interfaces:**
- Consumes: `assertPublishable` (Task 2).

- [ ] **Step 1: Charger les colonnes d'approbation**

Dans le `.select(...)` (ligne 490) : `"id, status, platforms, scheduled_at, approved_by, approved_at"`.

- [ ] **Step 2: Remplacer les gardes par le gate**

Remplacer les blocs `if (p.status === "publishing")` et `if (((p.platforms…)).length === 0)` (lignes 498-504) par :

```typescript
  const gate = assertPublishable({
    status: p.status as string,
    platforms: (p.platforms as string[]) ?? null,
    approved_by: (p.approved_by as string | null) ?? null,
    approved_at: (p.approved_at as string | null) ?? null,
  })
  if (!gate.ok) return { success: false, error: gate.message }
```

Ajouter l'import : `import { assertPublishable } from "@/lib/services/workflow/publish-gate"`.

- [ ] **Step 3: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 erreur.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/scheduler.ts
git commit -m "feat(publish): publishPost refuse sans approbation humaine"
```

---

### Task 6 : Backstop — worker pg-boss

**Files:**
- Modify: `src/lib/queue/publish-worker.ts:64-94`

**Interfaces:**
- Consumes: `isHumanApproved` (Task 2).

- [ ] **Step 1: Charger les colonnes d'approbation dans le worker**

Dans le `.select(...)` (ligne 66) : ajouter `, approved_by, approved_at` :

```typescript
    .select("id, tenant_id, content, platforms, status, media_urls, platform_results, approved_by, approved_at")
```

- [ ] **Step 2: Garde backstop avant le passage en "publishing"**

Juste avant le bloc « 3. Passer en publishing » (ligne 89), ajouter :

```typescript
  // Backstop : un job programmé périmé ne doit jamais publier un contenu
  // dont l'approbation a été réinitialisée (ex. contenu réédité après schedule).
  if (!isHumanApproved({ approved_by: post.approved_by, approved_at: post.approved_at })) {
    log({ level: "warn", module: "publish-worker", action: "skip_not_human_approved", tenant_id: tenantId, metadata: { postId } })
    await supabase
      .from("posts")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", postId)
    return
  }
```

Ajouter l'import : `import { isHumanApproved } from "@/lib/services/workflow/publish-gate"`.

- [ ] **Step 3: Gates**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: 0 erreur, build OK.

- [ ] **Step 4: Commit**

```bash
git add src/lib/queue/publish-worker.ts
git commit -m "feat(publish): worker abandonne un job non approuvé (backstop)"
```

---

### Task 7 : Reset d'approbation à l'édition de contenu

**Files:**
- Modify: `src/lib/actions/workflow.actions.ts` (`saveWorkflowPostAction` — après l'`update`/`insert` du contenu)
- Modify: l'action `updateDraftContentAction` (localiser via `grep -rn "updateDraftContentAction" src`)

**Interfaces:**
- Consumes: `clearPublishApproval` (Task 3).

- [ ] **Step 1: Localiser les chemins d'édition**

Run: `grep -rn "updateDraftContentAction\|saveWorkflowPostAction" src/lib src/app`
Repérer chaque endroit où `content`/`media_urls`/`platforms`/hashtags d'un post **existant** sont mis à jour.

- [ ] **Step 2: Réinitialiser l'approbation dans le même `update`**

Le plus sûr et le plus simple : ajouter `approved_by: null, approved_at: null` directement dans l'objet `update({...})` de chaque édition de contenu (plutôt qu'un appel séparé), p. ex. dans `saveWorkflowPostAction` lorsqu'on met à jour un `existingPostId` :

```typescript
      .update({
        content,
        media_urls: mediaUrls,
        hashtags,
        // …champs existants…
        approved_by: null,   // toute édition de contenu invalide l'approbation
        approved_at: null,
        updated_at: new Date().toISOString(),
      })
```

Faire de même dans `updateDraftContentAction`. (Le helper `clearPublishApproval` reste disponible pour les chemins où l'update du contenu et l'effacement sont séparés, ex. `regenerateElement` au Plan 4.)

- [ ] **Step 3: Gates**

Run: `npm run typecheck && npm run lint`
Expected: 0 erreur.

- [ ] **Step 4: Vérification PROD (browser-verify, compte test-ralph)**

Scénario : approuver un post (Kanban/action) → vérifier `approved_at` non NULL en DB → éditer sa caption → vérifier `approved_at` repassé à NULL → tenter publish → refus. (Requête de contrôle :)

```powershell
ssh -i $env:SERVER_SSH_KEY "$($env:SERVER_SSH_USER)@$($env:SERVER_HOST)" "docker exec -i supabase-db-szn6rjsrqig7n4oerw27egwr psql -U postgres -d postgres -c \"select id, status, approved_by, approved_at from posts order by updated_at desc limit 3;\""
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/workflow.actions.ts
git commit -m "feat(publish): toute édition de contenu réinitialise l'approbation"
```

---

## Self-Review (effectuée)

- **Couverture spec §4 (verrou en 3 points + reset + audit)** : Task 1 (colonnes), Task 2 (règle), Task 3 (pose + reset + audit), Task 4 (API v1), Task 5 (action interne), Task 6 (worker backstop), Task 7 (reset à l'édition). ✅
- **Placeholders** : aucun « TODO/TBD » ; chaque step de code montre le code. Deux vérifications de contrat sont explicites et exigent de **lire le réel avant d'écrire** (`apiError` Task 4.2b, colonnes `audit_log` Task 3.3, export de `getTenantId` Task 3.2) — ce sont des garde-fous anti-invention (DEFCON), pas des trous.
- **Cohérence des types** : `GatePost`/`GateResult`/`assertPublishable`/`isHumanApproved` identiques entre Task 2 et leurs consommateurs (Tasks 4/5/6). `clearPublishApproval` (Task 3) référencée Task 7.
- **Hors-scope assumé** : la page `/dashboard/review/[postId]` (Plan 3) ; ici seule l'URL est renvoyée.
```
