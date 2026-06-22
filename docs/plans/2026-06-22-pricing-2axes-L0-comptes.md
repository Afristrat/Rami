# Pricing 2 axes — LOT 0 (fondation Comptes + entitlements + double quota) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poser la fondation back-end d'un modèle de pricing à 2 axes (paliers de volume + modules add-on) en introduisant une couche `Compte` au-dessus des marques, avec un pool de quotas générations **et** publications partagé par compte et suivi par marque — sans toucher Stripe ni l'UI.

**Architecture :** Une nouvelle table `accounts` (1 par propriétaire) porte le plan, l'abonnement, les compteurs pool (générations + publications) et les modules add-on actifs (`account_addons`). Les `tenants` (marques) s'y rattachent via `account_id` et conservent des compteurs locaux pour le suivi par marque. Les entitlements deviennent `features du palier ∪ features débloquées par add-ons`. L'enforcement (quota générations/publications, nombre de marques, features) lit le niveau Compte.

**Tech Stack :** Next.js 16 (App Router), TypeScript strict, Drizzle ORM, Supabase Postgres, Jest. Migrations SQL dans `supabase/migrations/`, appliquées sur `db-rami` via le conteneur `supabase-db-szn6rjsrqig7n4oerw27egwr` (méthode base64 SSH).

## Global Constraints

- **Paliers (pool au niveau Compte)** — valeurs exactes :
  - Free : 0 $/mois · 1 marque · 1 génération · 3 publications · watermark
  - Solo : 149 $/mois · 1 marque · 10 générations · 30 publications
  - Pro : 399 $/mois · 3 marques · 30 générations · 90 publications
  - Agency : 899 $/mois · 10 marques · 100 générations · 300 publications
  - Agency+ : 1799 $/mois (PROVISOIRE — à valider avant live Stripe) · 30 marques · 300 générations · 900 publications
  - Enterprise : sur devis · marques/générations/publications illimitées (-1)
- **Ratio produit** : 1 génération ↔ 3 publications (cohérence des quotas).
- **Modules add-on** (prix par palier ; inclus nativement à partir d'Agency sauf mention) :
  - `lead_gen` : Solo 99 $ · Pro 199 $ · inclus dès Agency
  - `document_engine` (Studio Documents & Présentations) : Solo 49 $ · Pro 99 $ · inclus dès Agency
  - `billing_module` (Facturation clients) : Solo 39 $ · Pro 79 $ · inclus dès Agency
  - `business_suite` (bundle des 3) : Solo 159 $ · Pro 319 $ · inclus dès Agency
  - `founder_os` (Connecteur API restreint, scope `posts:write`) : 39 $/mois · disponible Solo/Pro/Agency
  - `api_full` (API complète, tous scopes) : 99 $/mois · disponible Solo/Pro/Agency · inclus dès Agency+
  - `volume_pack` (+10 générations / +30 publications) : 39 $/mois · quantité multiple
  - `extra_brand` (+1 marque) : 25 $/mois · quantité multiple
- **Features incluses par palier** : tous → `social_workflow`, `visual_engine` ; Solo+ → `visual_engine_no_watermark` ; Pro+ → `performance_loop`, `transcription` ; Agency+ (palier) → `white_label`, `client_portal`, `api_publique`. Les modules métier (`lead_gen`, `document_engine`, `billing_module`) et `api_publique` sont aussi débloquables via add-on sur paliers inférieurs.
- **Enum `plan` inchangé** : `free|solo|pro|agency|agency_plus|enterprise`.
- **Règles projet** : zéro `any` non justifié, zéro `!` non-null, `type` plutôt qu'`interface` pour types simples, retours typés sur fonctions exportées, RLS sur toute table. Gates obligatoires avant commit : `npm run typecheck` (0), `npm run lint` (0), `npm test` (vert).
- **Pas de Stripe ni d'UI dans ce lot** : les add-ons sont activés manuellement en base pour les tests ; l'achat (Stripe multi-items) et l'affichage sont les LOTs 1 et 2.

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `src/lib/db/schema.ts` (modif) | Tables Drizzle `accounts`, `account_addons` ; colonnes `tenants.account_id`, `tenants.publication_count`, `tenants.publication_reset_at` |
| `supabase/migrations/20260315000017_accounts.sql` (create) | DDL + RLS + backfill des comptes depuis les tenants existants |
| `src/lib/billing/plans.ts` (modif) | Paliers révisés, `PLAN_PUBLICATION_QUOTAS`, registre `ADDON_MODULES`, helpers add-on |
| `src/lib/billing/entitlements.ts` (create) | `resolveEntitlements(plan, addonIds)`, `hasEntitlement(...)` — PUR |
| `src/lib/billing/usage.ts` (modif) | Pool générations + publications au niveau Compte, suivi par marque |
| `src/lib/services/account/resolve.ts` (create) | `resolveUserAccount(supabase, userId)` |
| `src/lib/billing/require-feature.ts` (modif) | Lit le Compte + entitlements ; `checkPublicationQuota()` |
| `src/lib/actions/visual.actions.ts` (modif) | Incrément générations au niveau Compte |
| `src/lib/actions/workflow.actions.ts` (modif) | Incrément générations au niveau Compte |
| `src/lib/queue/publish-worker.ts` (modif) | Incrément publications au niveau Compte après publication réelle |
| `src/lib/api/auth.ts` (modif) | Entitlement `api_publique` via palier OU add-on |
| `src/lib/services/tenant/create-guard.ts` (create) | Enforcement du quota de marques par compte |
| `tests/unit/billing-plans.test.ts` (modif) | Tests quotas + registre add-on |
| `tests/unit/entitlements.test.ts` (create) | Tests entitlements palier ∪ add-ons |
| `tests/unit/usage.test.ts` (modif/create) | Tests reset/effective pour publications |

---

## Task 1 — Schéma Comptes + migration + backfill

**Files:**
- Modify: `src/lib/db/schema.ts` (après le bloc `tenants`, ~ligne 45)
- Create: `supabase/migrations/20260315000017_accounts.sql`

**Interfaces:**
- Produces (Drizzle) : `accounts` (cols `id, owner_id, plan, stripe_customer_id, stripe_subscription_id, subscription_status, generation_count, generation_reset_at, publication_count, publication_reset_at, created_at, updated_at`) ; `accountAddons` (cols `id, account_id, addon_id, quantity, status, stripe_subscription_item_id, created_at, updated_at`) ; `tenants.account_id`, `tenants.publication_count`, `tenants.publication_reset_at`.

- [ ] **Step 1 : Ajouter les tables Drizzle**

Dans `src/lib/db/schema.ts`, après la définition de `tenants` :

```typescript
// ============================================================
// ACCOUNTS (couche compte — porte le plan, l'abonnement, les quotas pool)
// ============================================================

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  owner_id: uuid('owner_id').notNull().unique(), // == auth.users.id ; 1 compte / propriétaire
  plan: planEnum('plan').notNull().default('free'),
  stripe_customer_id: varchar('stripe_customer_id', { length: 255 }),
  stripe_subscription_id: varchar('stripe_subscription_id', { length: 255 }),
  subscription_status: varchar('subscription_status', { length: 50 }),
  // Pool de quotas partagé par toutes les marques du compte
  generation_count: integer('generation_count').notNull().default(0),
  generation_reset_at: timestamp('generation_reset_at', { withTimezone: true }),
  publication_count: integer('publication_count').notNull().default(0),
  publication_reset_at: timestamp('publication_reset_at', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const accountAddons = pgTable('account_addons', {
  id: uuid('id').defaultRandom().primaryKey(),
  account_id: uuid('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  addon_id: varchar('addon_id', { length: 64 }).notNull(), // cf. ADDON_MODULES
  quantity: integer('quantity').notNull().default(1),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active | canceled
  stripe_subscription_item_id: varchar('stripe_subscription_item_id', { length: 255 }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

Puis, dans la définition de `tenants`, ajouter ces 3 colonnes (après `generation_reset_at`) :

```typescript
  account_id: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  publication_count: integer('publication_count').notNull().default(0),
  publication_reset_at: timestamp('publication_reset_at', { withTimezone: true }),
```

- [ ] **Step 2 : Écrire la migration SQL (DDL + RLS + backfill)**

Create `supabase/migrations/20260315000017_accounts.sql` :

```sql
-- ============================================================
-- LOT 0 — Couche Compte (accounts) + add-ons + quota publications
-- ============================================================

CREATE TABLE IF NOT EXISTS accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL UNIQUE,
  plan plan NOT NULL DEFAULT 'free',
  stripe_customer_id varchar(255),
  stripe_subscription_id varchar(255),
  subscription_status varchar(50),
  generation_count integer NOT NULL DEFAULT 0,
  generation_reset_at timestamptz,
  publication_count integer NOT NULL DEFAULT 0,
  publication_reset_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS account_addons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  addon_id varchar(64) NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  status varchar(20) NOT NULL DEFAULT 'active',
  stripe_subscription_item_id varchar(255),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, addon_id)
);
CREATE INDEX IF NOT EXISTS idx_account_addons_account ON account_addons(account_id);

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id) ON DELETE CASCADE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS publication_count integer NOT NULL DEFAULT 0;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS publication_reset_at timestamptz;

-- Backfill : 1 compte par propriétaire (owner_id). Le plan/abonnement du compte
-- reprend le tenant le plus "élevé" du propriétaire ; le pool générations = somme
-- des compteurs des marques du propriétaire.
INSERT INTO accounts (owner_id, plan, stripe_customer_id, stripe_subscription_id, subscription_status, generation_count, generation_reset_at)
SELECT DISTINCT ON (t.owner_id)
  t.owner_id,
  t.plan,
  t.stripe_customer_id,
  t.stripe_subscription_id,
  t.subscription_status,
  COALESCE(sums.total_gen, 0),
  t.generation_reset_at
FROM tenants t
JOIN (
  SELECT owner_id, SUM(generation_count) AS total_gen
  FROM tenants GROUP BY owner_id
) sums ON sums.owner_id = t.owner_id
ORDER BY t.owner_id,
  -- priorité : plan le plus élevé, puis présence d'un abonnement Stripe
  array_position(ARRAY['free','solo','pro','agency','agency_plus','enterprise']::text[], t.plan::text) DESC,
  (t.stripe_subscription_id IS NOT NULL) DESC
ON CONFLICT (owner_id) DO NOTHING;

UPDATE tenants t
SET account_id = a.id
FROM accounts a
WHERE a.owner_id = t.owner_id AND t.account_id IS NULL;

-- RLS : un utilisateur ne voit que son propre compte (et ses add-ons).
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY accounts_owner_select ON accounts
  FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY accounts_owner_update ON accounts
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY account_addons_owner_select ON account_addons
  FOR SELECT USING (account_id IN (SELECT id FROM accounts WHERE owner_id = auth.uid()));

-- Écritures (insert/maj quotas, add-ons) réservées au service-role (webhooks/worker).
```

- [ ] **Step 3 : Appliquer la migration sur db-rami** (PowerShell, coffre chargé)

```powershell
. "C:\Users\amans\.claude\secrets\load-secrets.ps1" | Out-Null
$DB = "supabase-db-szn6rjsrqig7n4oerw27egwr"
$sql = [IO.File]::ReadAllText("supabase/migrations/20260315000017_accounts.sql")
$b64 = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($sql))
ssh -i $env:SERVER_SSH_KEY -o BatchMode=yes "$($env:SERVER_SSH_USER)@$($env:SERVER_HOST)" "echo $b64 | base64 -d | docker exec -i $DB psql -U postgres -d postgres -v ON_ERROR_STOP=1"
```
Expected : `CREATE TABLE`, `INSERT 0 2` (2 comptes backfillés : AI-Mpower + Banque Test Ralph), `UPDATE 2`, `ALTER TABLE`, `CREATE POLICY`.

- [ ] **Step 4 : Vérifier le backfill** (chaque tenant a un account_id, plan repris)

```powershell
$q = "SELECT t.name, t.account_id IS NOT NULL AS linked, a.plan FROM tenants t LEFT JOIN accounts a ON a.id = t.account_id ORDER BY t.created_at;"
# (exécuter via le même pattern base64/ssh)
```
Expected : 2 lignes, `linked = t`, plan cohérent (AI-Mpower=enterprise, Banque Test Ralph=agency).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/db/schema.ts supabase/migrations/20260315000017_accounts.sql
git commit -m "feat(billing): couche Compte (accounts + account_addons) + quota publications (schéma + backfill)"
```

---

## Task 2 — Refonte `plans.ts` : paliers, quota publications, registre add-on

**Files:**
- Modify: `src/lib/billing/plans.ts`
- Test: `tests/unit/billing-plans.test.ts`

**Interfaces:**
- Produces : `PLAN_GENERATION_QUOTAS`, `PLAN_PUBLICATION_QUOTAS`, `PLAN_TENANT_QUOTAS` (valeurs révisées) ; `type AddonId` ; `ADDON_MODULES: Record<AddonId, AddonModule>` ; `addonGrantsFeature(addonId): Feature | null` ; `getAddonPrice(addonId, plan): number | null` ; `PLANS` mis à jour avec `publicationsPerMonth`.
- Consumes : `Feature`, `Plan` (existants).

- [ ] **Step 1 : Écrire les tests (quotas révisés + registre)**

Dans `tests/unit/billing-plans.test.ts`, ajouter :

```typescript
import {
  PLAN_GENERATION_QUOTAS, PLAN_PUBLICATION_QUOTAS, PLAN_TENANT_QUOTAS,
  ADDON_MODULES, addonGrantsFeature, getAddonPrice,
} from "@/lib/billing/plans"

describe("quotas révisés (pool compte)", () => {
  it("générations par palier", () => {
    expect(PLAN_GENERATION_QUOTAS).toMatchObject({ free: 1, solo: 10, pro: 30, agency: 100, agency_plus: 300, enterprise: -1 })
  })
  it("publications = 3 × générations", () => {
    expect(PLAN_PUBLICATION_QUOTAS).toMatchObject({ free: 3, solo: 30, pro: 90, agency: 300, agency_plus: 900, enterprise: -1 })
  })
  it("marques par palier", () => {
    expect(PLAN_TENANT_QUOTAS).toMatchObject({ free: 1, solo: 1, pro: 3, agency: 10, agency_plus: 30, enterprise: -1 })
  })
})

describe("registre des add-ons", () => {
  it("lead_gen débloque la feature lead_gen", () => {
    expect(addonGrantsFeature("lead_gen")).toBe("lead_gen")
  })
  it("api_full débloque api_publique", () => {
    expect(addonGrantsFeature("api_full")).toBe("api_publique")
  })
  it("prix Lead Gen par palier", () => {
    expect(getAddonPrice("lead_gen", "solo")).toBe(99)
    expect(getAddonPrice("lead_gen", "pro")).toBe(199)
  })
  it("module inclus dès Agency → prix null (déjà inclus)", () => {
    expect(getAddonPrice("lead_gen", "agency")).toBeNull()
  })
})
```

- [ ] **Step 2 : Lancer les tests → échec attendu**

Run: `npx jest tests/unit/billing-plans.test.ts -t "quotas révisés"`
Expected: FAIL (`PLAN_PUBLICATION_QUOTAS` / `ADDON_MODULES` undefined).

- [ ] **Step 3 : Mettre à jour les quotas et `PLANS`**

Dans `plans.ts`, remplacer `PLAN_GENERATION_QUOTAS` et `PLAN_TENANT_QUOTAS`, ajouter `PLAN_PUBLICATION_QUOTAS` :

```typescript
export const PLAN_GENERATION_QUOTAS: Record<Plan, number> = {
  free: 1, solo: 10, pro: 30, agency: 100, agency_plus: 300, enterprise: -1,
}
export const PLAN_PUBLICATION_QUOTAS: Record<Plan, number> = {
  free: 3, solo: 30, pro: 90, agency: 300, agency_plus: 900, enterprise: -1,
}
export const PLAN_TENANT_QUOTAS: Record<Plan, number> = {
  free: 1, solo: 1, pro: 3, agency: 10, agency_plus: 30, enterprise: -1,
}
```

Mettre à jour chaque entrée de `PLANS` : `price` (149/399/899/1799), `tenantsAllowed`, `generationsPerMonth`, et ajouter `publicationsPerMonth` au type `PlanConfig` et à chaque plan. Mettre à jour les `highlights` (texte FR ; l'i18n complet est en LOT 2). Exemple Solo :

```typescript
{ id: 'solo', name: 'Solo', price: 149, priceLabel: '$149',
  description: 'Pour les solo-préneurs et leurs side-projects.',
  highlights: ['1 marque', '10 générations / mois', '30 publications / mois', 'Sans watermark + export ZIP'],
  features: ['social_workflow', 'visual_engine', 'visual_engine_no_watermark'],
  generationsPerMonth: 10, publicationsPerMonth: 30, tenantsAllowed: 1 },
```

Ajouter à l'interface `PlanConfig` : `publicationsPerMonth: number`.

- [ ] **Step 4 : Ajouter le registre des add-ons**

```typescript
export type AddonId =
  | 'lead_gen' | 'document_engine' | 'billing_module' | 'business_suite'
  | 'founder_os' | 'api_full' | 'volume_pack' | 'extra_brand'

export type AddonModule = {
  id: AddonId
  label: string
  grantsFeature: Feature | null          // feature débloquée (null = quota pur)
  grantsScopes?: string[]                // scopes API éventuels (founder_os)
  pricesByPlan: Partial<Record<Plan, number>> // prix là où l'add-on est ACHETABLE
  includedFrom: Plan | null              // palier à partir duquel c'est inclus (null = jamais inclus)
  quantitied?: boolean                   // true = achetable en plusieurs exemplaires
}

const PLAN_ORDER: Plan[] = ['free', 'solo', 'pro', 'agency', 'agency_plus', 'enterprise']

export const ADDON_MODULES: Record<AddonId, AddonModule> = {
  lead_gen:        { id: 'lead_gen', label: 'Lead Gen & Prospection', grantsFeature: 'lead_gen', pricesByPlan: { solo: 99, pro: 199 }, includedFrom: 'agency' },
  document_engine: { id: 'document_engine', label: 'Studio Documents & Présentations', grantsFeature: 'document_engine', pricesByPlan: { solo: 49, pro: 99 }, includedFrom: 'agency' },
  billing_module:  { id: 'billing_module', label: 'Facturation clients', grantsFeature: 'billing_module', pricesByPlan: { solo: 39, pro: 79 }, includedFrom: 'agency' },
  business_suite:  { id: 'business_suite', label: 'Business Suite (3 modules)', grantsFeature: null, pricesByPlan: { solo: 159, pro: 319 }, includedFrom: 'agency' },
  founder_os:      { id: 'founder_os', label: 'Connecteur API / Founder-OS', grantsFeature: 'api_publique', grantsScopes: ['posts:write'], pricesByPlan: { solo: 39, pro: 39, agency: 39 }, includedFrom: 'agency_plus' },
  api_full:        { id: 'api_full', label: 'API complète', grantsFeature: 'api_publique', grantsScopes: ['posts:write', 'content:write', 'presentations:write', 'analytics:read'], pricesByPlan: { solo: 99, pro: 99, agency: 99 }, includedFrom: 'agency_plus' },
  volume_pack:     { id: 'volume_pack', label: 'Pack volume (+10 générations / +30 publications)', grantsFeature: null, pricesByPlan: { solo: 39, pro: 39, agency: 39, agency_plus: 39 }, includedFrom: null, quantitied: true },
  extra_brand:     { id: 'extra_brand', label: 'Marque supplémentaire', grantsFeature: null, pricesByPlan: { solo: 25, pro: 25, agency: 25, agency_plus: 25 }, includedFrom: null, quantitied: true },
}

/** Feature débloquée par un add-on (null si quota pur ou id inconnu). */
export function addonGrantsFeature(addonId: string): Feature | null {
  return ADDON_MODULES[addonId as AddonId]?.grantsFeature ?? null
}

/** Prix d'un add-on pour un palier donné : `null` si déjà inclus au palier ou non vendu. */
export function getAddonPrice(addonId: string, plan: Plan): number | null {
  const mod = ADDON_MODULES[addonId as AddonId]
  if (!mod) return null
  if (mod.includedFrom && PLAN_ORDER.indexOf(plan) >= PLAN_ORDER.indexOf(mod.includedFrom)) return null
  return mod.pricesByPlan[plan] ?? null
}
```

Le bundle `business_suite` débloque les 3 features métier : ce mapping est géré dans l'entitlement resolver (Task 3), pas via `grantsFeature` (qui est singulier).

- [ ] **Step 5 : Lancer les tests → succès**

Run: `npx jest tests/unit/billing-plans.test.ts`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/billing/plans.ts tests/unit/billing-plans.test.ts
git commit -m "feat(billing): paliers révisés + quota publications + registre des modules add-on"
```

---

## Task 3 — Entitlement resolver (palier ∪ add-ons)

**Files:**
- Create: `src/lib/billing/entitlements.ts`
- Test: `tests/unit/entitlements.test.ts`

**Interfaces:**
- Consumes : `PLAN_FEATURES` (exposer en export depuis `plans.ts` si non déjà fait), `ADDON_MODULES`, `addonGrantsFeature`, `Feature`, `Plan`, `AddonId`.
- Produces : `resolveEntitlements(plan: Plan, addonIds: readonly string[]): Set<Feature>` ; `hasEntitlement(plan: Plan, addonIds: readonly string[], feature: Feature): boolean`.

- [ ] **Step 1 : Exposer `PLAN_FEATURES`**

Dans `plans.ts`, changer `const PLAN_FEATURES` en `export const PLAN_FEATURES`.

- [ ] **Step 2 : Écrire les tests**

Create `tests/unit/entitlements.test.ts` :

```typescript
import { resolveEntitlements, hasEntitlement } from "@/lib/billing/entitlements"

describe("entitlements palier ∪ add-ons", () => {
  it("Solo seul n'a pas lead_gen", () => {
    expect(hasEntitlement("solo", [], "lead_gen")).toBe(false)
  })
  it("Solo + add-on lead_gen débloque lead_gen", () => {
    expect(hasEntitlement("solo", ["lead_gen"], "lead_gen")).toBe(true)
  })
  it("Solo + business_suite débloque les 3 modules métier", () => {
    const e = resolveEntitlements("solo", ["business_suite"])
    expect(e.has("lead_gen")).toBe(true)
    expect(e.has("document_engine")).toBe(true)
    expect(e.has("billing_module")).toBe(true)
  })
  it("api_full débloque api_publique sur Solo", () => {
    expect(hasEntitlement("solo", ["api_full"], "api_publique")).toBe(true)
  })
  it("Agency a lead_gen sans add-on (inclus au palier)", () => {
    expect(hasEntitlement("agency", [], "lead_gen")).toBe(true)
  })
  it("un add-on inconnu est ignoré", () => {
    expect(hasEntitlement("solo", ["does_not_exist"], "lead_gen")).toBe(false)
  })
})
```

- [ ] **Step 3 : Run → échec**

Run: `npx jest tests/unit/entitlements.test.ts`
Expected: FAIL (module introuvable).

- [ ] **Step 4 : Implémenter**

```typescript
import { PLAN_FEATURES, ADDON_MODULES, addonGrantsFeature } from "./plans"
import type { Feature, Plan } from "./plans"

// Add-ons "bundle" → ensemble de features (le registre ne porte qu'une feature simple).
const BUNDLE_FEATURES: Record<string, Feature[]> = {
  business_suite: ["lead_gen", "document_engine", "billing_module"],
}

/** Ensemble des features auxquelles le compte a droit : palier ∪ add-ons actifs. */
export function resolveEntitlements(plan: Plan, addonIds: readonly string[]): Set<Feature> {
  const set = new Set<Feature>(PLAN_FEATURES[plan])
  for (const id of addonIds) {
    const single = addonGrantsFeature(id)
    if (single) set.add(single)
    for (const f of BUNDLE_FEATURES[id] ?? []) set.add(f)
  }
  return set
}

/** Vrai si le compte (palier + add-ons) a accès à la feature. */
export function hasEntitlement(plan: Plan, addonIds: readonly string[], feature: Feature): boolean {
  return resolveEntitlements(plan, addonIds).has(feature)
}
```

- [ ] **Step 5 : Run → succès**

Run: `npx jest tests/unit/entitlements.test.ts`
Expected: PASS.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/billing/entitlements.ts tests/unit/entitlements.test.ts src/lib/billing/plans.ts
git commit -m "feat(billing): entitlement resolver (features du palier ∪ modules add-on)"
```

---

## Task 4 — Account resolver

**Files:**
- Create: `src/lib/services/account/resolve.ts`

**Interfaces:**
- Consumes : `resolveUserTenant` (existant), `SupabaseClient`.
- Produces : `type ResolvedAccount = { accountId: string; plan: Plan; addonIds: string[] }` ; `resolveUserAccount(supabase, userId): Promise<ResolvedAccount | null>`.

- [ ] **Step 1 : Implémenter le resolver**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Plan } from "@/lib/billing/plans"
import { resolveUserTenant } from "@/lib/services/tenant/resolve"

export type ResolvedAccount = { accountId: string; plan: Plan; addonIds: string[] }

/**
 * Résout le compte d'un utilisateur : d'abord via accounts.owner_id (propriétaire),
 * sinon via la marque courante (tenants.account_id) pour les membres.
 */
export async function resolveUserAccount(
  supabase: SupabaseClient,
  userId: string
): Promise<ResolvedAccount | null> {
  const { data: own } = await supabase
    .from("accounts")
    .select("id, plan")
    .eq("owner_id", userId)
    .maybeSingle()

  let accountId = own?.id as string | undefined
  let plan = own?.plan as Plan | undefined

  if (!accountId) {
    const tenantId = await resolveUserTenant(supabase, userId)
    if (!tenantId) return null
    const { data: t } = await supabase
      .from("tenants").select("account_id").eq("id", tenantId).maybeSingle()
    if (!t?.account_id) return null
    const { data: a } = await supabase
      .from("accounts").select("id, plan").eq("id", t.account_id).maybeSingle()
    if (!a?.id) return null
    accountId = a.id as string
    plan = a.plan as Plan
  }

  const { data: addons } = await supabase
    .from("account_addons")
    .select("addon_id")
    .eq("account_id", accountId)
    .eq("status", "active")

  return {
    accountId,
    plan: plan ?? "free",
    addonIds: (addons ?? []).map((r) => r.addon_id as string),
  }
}
```

- [ ] **Step 2 : Typecheck**

Run: `npm run typecheck`
Expected: 0 erreur.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/services/account/resolve.ts
git commit -m "feat(billing): resolveUserAccount (compte + add-ons actifs depuis l'utilisateur)"
```

---

## Task 5 — Usage pool (générations + publications au niveau Compte)

**Files:**
- Modify: `src/lib/billing/usage.ts`
- Test: `tests/unit/usage.test.ts`

**Interfaces:**
- Consumes : `accounts`, `tenants` (Drizzle), helpers purs existants `shouldResetGenerations`, `effectiveGenerationCount`.
- Produces : `effectivePublicationCount(count, resetAt, now): number` ; `incrementAccountGeneration(accountId, tenantId): Promise<void>` ; `incrementAccountPublication(accountId, tenantId, by): Promise<void>`.

- [ ] **Step 1 : Tests purs publications**

Create/append `tests/unit/usage.test.ts` :

```typescript
import { effectivePublicationCount } from "@/lib/billing/usage"

describe("effectivePublicationCount", () => {
  const now = new Date("2026-06-22T00:00:00Z")
  it("période expirée → 0", () => {
    expect(effectivePublicationCount(20, new Date("2026-06-01T00:00:00Z"), now)).toBe(0)
  })
  it("période en cours → valeur stockée", () => {
    expect(effectivePublicationCount(20, new Date("2026-07-01T00:00:00Z"), now)).toBe(20)
  })
  it("resetAt null → valeur stockée", () => {
    expect(effectivePublicationCount(5, null, now)).toBe(5)
  })
})
```

- [ ] **Step 2 : Run → échec**

Run: `npx jest tests/unit/usage.test.ts`
Expected: FAIL (`effectivePublicationCount` non exporté).

- [ ] **Step 3 : Implémenter (réutilise la logique de reset)**

Dans `usage.ts`, ajouter (la logique de période est identique aux générations) :

```typescript
import { accounts } from "@/lib/db/schema"

/** Compteur publications effectif (0 si période expirée). PURE. */
export function effectivePublicationCount(count: number, resetAt: Date | null, now: Date): number {
  return shouldResetGenerations(resetAt, now) ? 0 : count
}

/** Incrémente le pool de générations du COMPTE + le suivi de la marque, atomique et reset-aware. */
export async function incrementAccountGeneration(accountId: string, tenantId: string): Promise<void> {
  await db.update(accounts).set({
    generation_count: sql`CASE WHEN ${accounts.generation_reset_at} IS NOT NULL AND ${accounts.generation_reset_at} < now() THEN 1 ELSE ${accounts.generation_count} + 1 END`,
    generation_reset_at: sql`CASE WHEN ${accounts.generation_reset_at} IS NULL OR ${accounts.generation_reset_at} < now() THEN now() + interval '30 days' ELSE ${accounts.generation_reset_at} END`,
    updated_at: new Date(),
  }).where(eq(accounts.id, accountId))
  // Suivi par marque (affichage de la répartition ; pas d'enforcement)
  await db.update(tenants).set({
    generation_count: sql`CASE WHEN ${tenants.generation_reset_at} IS NOT NULL AND ${tenants.generation_reset_at} < now() THEN 1 ELSE ${tenants.generation_count} + 1 END`,
    generation_reset_at: sql`CASE WHEN ${tenants.generation_reset_at} IS NULL OR ${tenants.generation_reset_at} < now() THEN now() + interval '30 days' ELSE ${tenants.generation_reset_at} END`,
    updated_at: new Date(),
  }).where(eq(tenants.id, tenantId))
}

/** Incrémente le pool de publications du COMPTE (+by) + le suivi de la marque. */
export async function incrementAccountPublication(accountId: string, tenantId: string, by: number): Promise<void> {
  await db.update(accounts).set({
    publication_count: sql`CASE WHEN ${accounts.publication_reset_at} IS NOT NULL AND ${accounts.publication_reset_at} < now() THEN ${by} ELSE ${accounts.publication_count} + ${by} END`,
    publication_reset_at: sql`CASE WHEN ${accounts.publication_reset_at} IS NULL OR ${accounts.publication_reset_at} < now() THEN now() + interval '30 days' ELSE ${accounts.publication_reset_at} END`,
    updated_at: new Date(),
  }).where(eq(accounts.id, accountId))
  await db.update(tenants).set({
    publication_count: sql`CASE WHEN ${tenants.publication_reset_at} IS NOT NULL AND ${tenants.publication_reset_at} < now() THEN ${by} ELSE ${tenants.publication_count} + ${by} END`,
    publication_reset_at: sql`CASE WHEN ${tenants.publication_reset_at} IS NULL OR ${tenants.publication_reset_at} < now() THEN now() + interval '30 days' ELSE ${tenants.publication_reset_at} END`,
    updated_at: new Date(),
  }).where(eq(tenants.id, tenantId))
}
```

> Note : `incrementGenerationCount(tenantId)` existant reste en place le temps du câblage (Task 7), puis est retiré une fois ses appelants migrés.

- [ ] **Step 4 : Run → succès** — `npx jest tests/unit/usage.test.ts` → PASS.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/billing/usage.ts tests/unit/usage.test.ts
git commit -m "feat(billing): pool générations + publications au niveau Compte (+ suivi par marque)"
```

---

## Task 6 — Guards : entitlements + quotas au niveau Compte

**Files:**
- Modify: `src/lib/billing/require-feature.ts`

**Interfaces:**
- Consumes : `resolveUserAccount`, `hasEntitlement`, `PLAN_GENERATION_QUOTAS`, `PLAN_PUBLICATION_QUOTAS`, `effectiveGenerationCount`, `effectivePublicationCount`.
- Produces : `requireFeature` (revue) ; `checkGenerationQuota()` (lit le pool compte) ; `checkPublicationQuota(): Promise<{ allowed: boolean; plan: Plan; count: number }>`.

- [ ] **Step 1 : Réécrire `getCurrentAccount` + guards**

Remplacer l'usage de `getCurrentTenantPlan` interne par une résolution Compte :

```typescript
import { resolveUserAccount } from "@/lib/services/account/resolve"
import { hasEntitlement } from "./entitlements"
import { PLAN_PUBLICATION_QUOTAS } from "./plans"
import { effectivePublicationCount } from "./usage"

type AccountData = { accountId: string; plan: Plan; addonIds: string[]; generation_count: number; publication_count: number }

export async function getCurrentAccount(): Promise<AccountData | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const acc = await resolveUserAccount(supabase, user.id)
  if (!acc) return null
  const { data: row } = await supabase
    .from("accounts")
    .select("generation_count, generation_reset_at, publication_count, publication_reset_at")
    .eq("id", acc.accountId)
    .single<{ generation_count: number; generation_reset_at: string | null; publication_count: number; publication_reset_at: string | null }>()
  const now = new Date()
  const genReset = row?.generation_reset_at ? new Date(row.generation_reset_at) : null
  const pubReset = row?.publication_reset_at ? new Date(row.publication_reset_at) : null
  return {
    accountId: acc.accountId,
    plan: acc.plan,
    addonIds: acc.addonIds,
    generation_count: effectiveGenerationCount(row?.generation_count ?? 0, genReset, now),
    publication_count: effectivePublicationCount(row?.publication_count ?? 0, pubReset, now),
  }
}

export async function requireFeature(feature: Feature): Promise<AccountData> {
  const data = await getCurrentAccount()
  if (!data) redirect("/login")
  if (!hasEntitlement(data.plan, data.addonIds, feature)) {
    redirect(`/pricing?upgrade=1&feature=${feature}`)
  }
  return data
}

export async function checkGenerationQuota(): Promise<{ allowed: boolean; plan: Plan; count: number }> {
  const data = await getCurrentAccount()
  if (!data) return { allowed: false, plan: "free", count: 0 }
  return { allowed: !isGenerationQuotaExceeded(data.plan, data.generation_count), plan: data.plan, count: data.generation_count }
}

export async function checkPublicationQuota(): Promise<{ allowed: boolean; plan: Plan; count: number }> {
  const data = await getCurrentAccount()
  if (!data) return { allowed: false, plan: "free", count: 0 }
  const quota = PLAN_PUBLICATION_QUOTAS[data.plan]
  const allowed = quota === -1 || data.publication_count < quota
  return { allowed, plan: data.plan, count: data.publication_count }
}
```

Conserver `getCurrentTenantPlan` comme **alias deprecated** délégant à `getCurrentAccount` (champ `generation_count`) pour ne pas casser d'éventuels appelants pendant la migration ; le retirer en fin de Task 7.

- [ ] **Step 2 : Typecheck + tous les tests**

Run: `npm run typecheck && npx jest`
Expected: 0 erreur TS, suites vertes.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/billing/require-feature.ts
git commit -m "feat(billing): guards features + quotas (générations & publications) au niveau Compte"
```

---

## Task 7 — Câbler les call-sites d'usage

**Files:**
- Modify: `src/lib/actions/visual.actions.ts:378` (incrément générations)
- Modify: `src/lib/actions/workflow.actions.ts:409` (incrément générations)
- Modify: `src/lib/queue/publish-worker.ts` (~183-197, incrément publications après succès réel)
- Modify: `src/lib/api/auth.ts:65` (entitlement `api_publique` via palier OU add-on)

**Interfaces:**
- Consumes : `incrementAccountGeneration`, `incrementAccountPublication`, `resolveUserAccount`/lecture `tenants.account_id`, `hasEntitlement`.

- [ ] **Step 1 : visual.actions & workflow.actions**

Aux deux call-sites de `incrementGenerationCount(tenantId)`, résoudre l'`account_id` du tenant puis appeler `incrementAccountGeneration(accountId, tenantId)`. Exemple (même patron aux deux endroits) :

```typescript
// avant: await incrementGenerationCount(tenantId)
const { data: tRow } = await supabase.from("tenants").select("account_id").eq("id", tenantId).single()
if (tRow?.account_id) await incrementAccountGeneration(tRow.account_id, tenantId)
```

Vérifier en amont que le check de quota lit bien `checkGenerationQuota()` (pool compte) — déjà le cas via Task 6.

- [ ] **Step 2 : publish-worker — incrément publications**

Dans `processPublishJob`, après le passage du statut à `published` (succès d'au moins une plateforme), incrémenter le pool publications du compte **du nombre de plateformes publiées avec succès** (1 publication = 1 post × 1 réseau) :

```typescript
// post.tenant_id connu ; compter les plateformes publiées avec succès
const successCount = Object.values(platformResults).filter((r) => r?.status === "published").length
if (successCount > 0) {
  const { data: tRow } = await supabaseAdmin.from("tenants").select("account_id").eq("id", post.tenant_id).single()
  if (tRow?.account_id) await incrementAccountPublication(tRow.account_id, post.tenant_id, successCount)
}
```

(Comptage **après** succès réel → pas de double-comptage ; cohérent avec le ratio 1 génération : N réseaux.)

- [ ] **Step 3 : api/auth — entitlement add-on**

Dans `src/lib/api/auth.ts`, remplacer le `hasFeatureAccess(tenant.plan, 'api_publique')` par une résolution Compte + `hasEntitlement` (pour autoriser les détenteurs de l'add-on `api_full`/`founder_os`), et restreindre les scopes effectifs à ceux accordés par l'add-on si le palier n'inclut pas l'API complète. Détail des scopes : intersecter les scopes de la clé avec ceux accordés par l'entitlement (palier `agency_plus`+ ⇒ tous ; add-on `founder_os` ⇒ `posts:write` ; add-on `api_full` ⇒ tous).

- [ ] **Step 4 : Retirer le code mort**

Supprimer `incrementGenerationCount` (ancien, par tenant) et l'alias `getCurrentTenantPlan` une fois confirmé qu'aucun appelant ne subsiste (`grep -rn "incrementGenerationCount\|getCurrentTenantPlan" src/`).

- [ ] **Step 5 : Gates complets**

Run: `npm run typecheck && npm run lint && npx jest`
Expected: 0 / 0 / vert.

- [ ] **Step 6 : Commit**

```bash
git add -A
git commit -m "feat(billing): câblage usage au niveau Compte (générations, publications, API entitlement)"
```

---

## Task 8 — Enforcement du quota de marques

**Files:**
- Create: `src/lib/services/tenant/create-guard.ts`
- Modify: les points de création de marque (onboarding + `provisionClientAction` admin — localiser via `grep -rn "from(\"tenants\").insert\|insert(tenants)" src/`)

**Interfaces:**
- Consumes : `resolveUserAccount`, `PLAN_TENANT_QUOTAS`.
- Produces : `canCreateBrand(supabase, userId): Promise<{ allowed: boolean; current: number; max: number }>`.

- [ ] **Step 1 : Implémenter le guard**

```typescript
import type { SupabaseClient } from "@supabase/supabase-js"
import { resolveUserAccount } from "@/lib/services/account/resolve"
import { PLAN_TENANT_QUOTAS } from "@/lib/billing/plans"

export async function canCreateBrand(
  supabase: SupabaseClient, userId: string
): Promise<{ allowed: boolean; current: number; max: number }> {
  const acc = await resolveUserAccount(supabase, userId)
  if (!acc) return { allowed: false, current: 0, max: 0 }
  const { count } = await supabase
    .from("tenants").select("id", { count: "exact", head: true })
    .eq("account_id", acc.accountId)
  const max = PLAN_TENANT_QUOTAS[acc.plan]
  const current = count ?? 0
  return { allowed: max === -1 || current < max, current, max }
}
```

- [ ] **Step 2 : Brancher à la création de marque**

Avant chaque `INSERT` de tenant déclenché par un utilisateur, appeler `canCreateBrand` ; si `!allowed`, retourner une erreur exploitable (`{ success: false, error: "brand_quota_reached" }`) plutôt que d'insérer. Rattacher le nouveau tenant à `account_id = acc.accountId`.

- [ ] **Step 3 : Gates + commit**

```bash
npm run typecheck && npm run lint && npx jest
git add -A
git commit -m "feat(billing): enforcement du quota de marques par compte"
```

---

## Self-Review (couverture du spec)

- Paliers révisés (prix/marques/gén/pub) → Task 2 ✓
- Quota publications (nouveau) → Task 1 (schéma) + Task 5 (compteur) + Task 6 (guard) + Task 7 (incrément réel) ✓
- Pool au niveau Compte → Task 1 (accounts) + Task 5/6 ✓
- Suivi par marque → Task 5 (compteurs tenants) ✓
- Modules add-on (registre + prix par palier + inclus-dès) → Task 2 ✓
- Entitlements palier ∪ add-ons (dont bundle + api_full/founder_os) → Task 3 ✓
- Connecteur Founder-OS / API complète en add-on → Task 2 (registre) + Task 7 step 3 (scopes API) ✓
- Enforcement nombre de marques → Task 8 ✓
- Migration + backfill (2 comptes) → Task 1 ✓
- Hors-scope explicite (LOTs suivants) : Stripe multi-items, UI `/pricing` & `/billing`, gating contextuel/nudges, suppression des 2 pages billing factices.

## Reste pour les LOTs suivants
- **LOT 1** — Stripe multi-items (abonnement palier + items add-on), webhook sync `account_addons`, achat/résiliation d'add-ons, application du `volume_pack`/`extra_brand` aux quotas.
- **LOT 2** — UI `/pricing` (2 axes), `/billing` réelle (modules actifs + pools + répartition par marque), badges quotas générations **et** publications, gating contextuel « activer le module » + nudges d'usage, **suppression des pages factices** `/settings/billing` (mock) et `/dashboard/invoices` (MOCK_INVOICES).
