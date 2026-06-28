# Intégration Studio Mishkāt — Section « Création vidéo » de RAMI

> **For Claude:** REQUIRED SUB-SKILL: utilise `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Pour chaque tâche : TDD d'abord (test rouge → impl minimale → vert), commits fréquents. En cas de bug : `superpowers:systematic-debugging`.

**Goal:** Permettre à un tenant de lancer, depuis la section vidéo de RAMI, une production vidéo bilingue FR·AR (4 MP4 : FR·AR × 16:9·9:16) rendue par le studio Mishkāt avec ses images de marque en fond, puis de retrouver ses productions archivées dans sa bibliothèque d'assets.

**Architecture:** Intégration **par API** (pas de fusion de code). Mishkāt reste le moteur headless souverain (`https://mishkat.ai-mpower.com`, auth Bearer). RAMI agit en **proxy serveur** : il lit le tenant authentifié + son Brand DNA, construit un `brief` + des `BrandTokens` inline (avec `media.backgrounds` = URLs signées des assets du tenant), appelle Mishkāt, relaie le polling au front, puis **archive** les MP4 dans la bibliothèque du tenant (credentials RAMI). La clé `MISHKAT_API_KEY` ne transite **jamais** côté client.

**Tech Stack:** Next.js 15 (App Router, Server Actions + Route Handlers), TypeScript strict, Zod, Supabase (Auth + Postgres + Storage), Drizzle (schéma), Jest (unit), Playwright (e2e). Déploiement Coolify (app `rami`, `rami.ai-mpower.com`) — **jamais de dev local/localhost** (cf. mémoire projet).

**Décisions produit (validées) :**
1. **Phasage** : Phase 1 = flux **v1 « pool »** (images sélectionnées en bibliothèque → `brand.media.backgrounds` → un seul `POST /v1/productions`). Phase 2 = flux **v2 « contextuel par scène »** (storyboard → 1 image générée par scène → `POST /v1/productions` avec `storyboard` + `sceneImages`).
2. **Cohabitation** : Mishkāt = **nouveau mode** « Studio de marque » à côté du générateur Veo existant dans `/create/video` (sélecteur de mode, l'existant reste intact).

**Contrat Mishkāt (vérifié en live le 2026-06-26, `GET /v1/brands → {"brands":["rami"]}`) :**
- `POST /v1/productions` body `{ brief, brand? }` → `202 { id, status }`
- `GET /v1/productions/:id` → `{ status: queued|generating|rendering|done|error, storyboard?, variants?: [{lang,format,gatePassed,url}], error? }`
- `GET /v1/productions/:id/variants/:key` → stream MP4 (ex. `fr-16x9.mp4`)
- `POST /v1/storyboards` body `{ brief, brand }` → `202 { id }`, puis `GET /v1/productions/:id` jusqu'à `done` → `storyboard.scenes[]` (chaque scène porte `image_prompt`)
- `GET /v1/brands`, `GET /v1/journal` — annexes.

**Schéma de brief réel (source : `mishkat/schemas/brief.schema.json`) — ATTENTION, diffère de l'énoncé initial :**
```
required: brand_id, intent, audience, channel_format, language, tone, duration_s, objective
- intent        : string 10..1000 (langage naturel, pas un objet)
- audience      : enum  etudiant | institution | investisseur | grand_public | pairs_tech | interne
- channel_format: array de { channel: linkedin|reels|tiktok|whatsapp_status|youtube|presentation|instagram_feed, aspect: 16:9|9:16|1:1 }
- language      : { primary: fr|ar|darija|en, secondary?: …, rtl?: bool }
- tone          : enum  premium | insolent | cinematic | pedagogique | urgence | default
- duration_s    : int 10..180
- proof?        : enum  none | data | testimonial | live_demo | logo_wall  (def none)
- sound?        : { music?: bool=true, voiceover?: bool=false, captions_burned?: bool=true }
- sovereignty?  : public | sensitive (def public)
- objective     : enum  awareness | acquisition | proof | wrapped_shareable | demo_day
- title?        : string ≤120
```

**BrandTokens (source : `mishkat/brand/rami.json`) + extension `media` :**
```jsonc
{
  "brand_id": "rami",
  "palette":  { "primary": "#7c3bed", "secondary": "#2563eb", "accent": "#10b981", "bg": "#f7f6f8", "text": "#0a0a0f" },
  "typography": {
    "display": { "family": "Geist",      "url": "…woff2", "weight": 700 },
    "body":    { "family": "Geist Mono", "url": "…woff2", "weight": 400 }
  },
  "logo_url": "",                                  // URL (signée) ou "" → fallback mesh souverain
  "media":    { "backgrounds": ["https://…signed1.jpg", "https://…signed2.jpg"] }  // v1 pool
}
```
> Les URLs `media.backgrounds` doivent être **publiquement accessibles au rendu** → URL publique du bucket MinIO `media` (repli URL signée MinIO TTL 7 j). Sans elles → fond mesh souverain Mishkāt (acceptable, non bloquant). _(cf. MISE À JOUR 2026-06-28 ci-dessous, qui fait foi.)_

> ## ⚠️ MISE À JOUR 2026-06-28 — STOCKAGE 100 % MinIO + CONTRAT VIDÉO RÉVISÉ (CE BLOC FAIT FOI)
> Supabase Storage a été **entièrement retiré** du produit (jamais fonctionnel : aucun bucket n'existait en base). Tout le stockage média passe par **MinIO** (`src/lib/services/storage/client.ts`, bucket public `media`).
> 1. **Stockage média = MinIO** (`uploadToStorage`/`deleteFromStorage`/`createSignedUrl` MinIO). Le bucket `rami-media` Supabase n'existe pas et n'est plus référencé.
> 2. **Table de la bibliothèque = `media_assets`** (le pgTable `media`, orphelin, a été supprimé). `getMediaAssetsAction({fileType})` lit `media_assets` → les vidéos y apparaissent.
> 3. `detectFileType` accepte `video/mp4` ; `MAX_FILE_SIZE = 50 MB`.
> 4. **Fonds (`media.backgrounds`)** : on renvoie l'URL publique MinIO de l'asset (repli URL signée MinIO `createSignedUrl(storage_path, SIGNED_URL_TTL.long)`). Logo hébergé sur MinIO.
> 5. **Archivage** : Mishkāt **archive lui-même** → `GET /v1/productions/:id` renvoie `variants[].url` = **URL MinIO publique permanente**. On la persiste telle quelle (`toPermanentVariants`), **plus de re-download**. `archiveProductionIfNeeded` (copie de redondance MinIO) est optionnel, derrière `MISHKAT_ARCHIVE_REDUNDANT_COPY=true`.
> 6. **`duration_s ≥ 18`** (reading-floor storyboard 4 scènes ≈ 17 s FR / 14,5 s AR ; valeur < 18 rejetée par Mishkāt).
> 7. Typo : `dna.typography?.heading?.family` / `dna.typography?.body?.family`. `getBrandDnaAction()` → `{ data: BrandDnaFormData | null } | { error }` (jamais throw).

**Carte du code RAMI existant (référence, ne pas redécouvrir) :**
| Rôle | Fichier | Signature clé |
|---|---|---|
| Page vidéo | `src/app/(dashboard)/create/video/page.tsx` | `export default function VideoPage()` → `<VideoGeneratorClient/>` |
| Form Veo existant | `src/components/visual/VideoGeneratorClient.tsx` | `export function VideoGeneratorClient()` |
| Brand DNA (lecture) | `src/lib/actions/brand-dna.actions.ts` | `getBrandDnaAction(): Promise<{data: BrandDnaFormData|null}|{error}>` |
| Normalisation DNA | `src/lib/services/brand-dna/normalize.ts` | `normalizeBrandDNA(raw): BrandDNA`, `causseColorToHex(v): string|null` |
| Schéma DNA | `src/lib/schemas/brand-dna.schema.ts` | `brandDnaFormSchema`, `BrandDnaFormData` (colorPrimary/Secondary/Accent = ID Causse ou HEX ; `logoDataUrl`; `typography?`) |
| Bibliothèque assets | `src/lib/actions/library.actions.ts` | `getMediaAssetsAction({fileType,search,limit,offset}): Promise<{data: MediaAsset[]; total}|{error}>` |
| Assets de marque | `src/lib/actions/brand-dna.actions.ts` | `getBrandAssetsAction(category?): Promise<…>` |
| Storage (signed URL) | `src/lib/services/storage/client.ts` | `createSignedUrl(bucket, path, expiresIn=SIGNED_URL_TTL): Promise<string>`, `BUCKETS`, `SIGNED_URL_TTL=604800` |
| Upload (images) | `src/lib/services/storage/index.ts` | `uploadAsset(params: StorageUploadParams): Promise<StorageUploadResult>` ⚠️ orienté images (resize + MIME image) — **inadapté tel quel pour MP4** |
| Tenant courant | `src/lib/services/tenant/resolve.ts` | `resolveUserTenant(supabase, userId): Promise<string|null>` |
| DB schéma | `src/lib/db/schema.ts` | `media`, `generated_videos`, `tenants` … (Drizzle pgTable) |
| Migrations | `supabase/migrations/AAAAMMJJ_*.sql` | + RLS + index |
| Génération image | `src/lib/services/image-generation/index.ts` | `generateImage(req: GenerationRequest): Promise<GenerationResult>` (chaîne LiteLLM→Fal→Imagen…) |
| Pattern route API | `src/app/api/brand-dna/ai-assist/route.ts` | auth `getUser()` → `resolveUserTenant` → Zod → logique |

---

## Phase 0 — Préparation

### Task 0.1 : Branche + variable d'environnement Coolify

**Step 1.** Créer la branche depuis `main` (cf. SOP-001) :
```bash
cd "C:/Users/amans/OneDrive/Projets/Social_Media/Rami/Rami"
git checkout -b feature/mishkat-video
```

**Step 2.** Ajouter `MISHKAT_API_KEY` (au coffre, 43 car.) côté **serveur** RAMI sur Coolify (app `rami`) — **pas** de préfixe `NEXT_PUBLIC_`. Ajouter aussi `MISHKAT_API_BASE_URL=https://mishkat.ai-mpower.com` (override testable). Documenter dans `.env.example` :
```bash
# === Studio vidéo Mishkāt (serveur uniquement, JAMAIS NEXT_PUBLIC) ===
MISHKAT_API_KEY=
MISHKAT_API_BASE_URL=https://mishkat.ai-mpower.com
```
> Vérification : la clé doit apparaître dans la config Coolify de l'app `rami`, jamais dans le bundle client. Contrôle final en Task 1.8 (`grep` anti-leak).

**Step 3.** Commit :
```bash
git add .env.example
git commit -m "chore(video): scaffold branche + env Mishkāt (.env.example)"
```

---

## Phase 1 — Flux v1 « pool » (livre la Definition of Done)

### Task 1.1 : Client Mishkāt typé (wrapper serveur)

**Files:**
- Create: `src/lib/services/mishkat/types.ts`
- Create: `src/lib/services/mishkat/client.ts`
- Test: `src/lib/services/mishkat/client.test.ts`

**Step 1 — Types (`types.ts`).** Refléter le contrat live. Pas de `any`, enums en `as const`.
```ts
// src/lib/services/mishkat/types.ts
export const MISHKAT_AUDIENCES = ['etudiant', 'institution', 'investisseur', 'grand_public', 'pairs_tech', 'interne'] as const
export type MishkatAudience = (typeof MISHKAT_AUDIENCES)[number]

export const MISHKAT_TONES = ['premium', 'insolent', 'cinematic', 'pedagogique', 'urgence', 'default'] as const
export type MishkatTone = (typeof MISHKAT_TONES)[number]

export const MISHKAT_OBJECTIVES = ['awareness', 'acquisition', 'proof', 'wrapped_shareable', 'demo_day'] as const
export type MishkatObjective = (typeof MISHKAT_OBJECTIVES)[number]

export const MISHKAT_CHANNELS = ['linkedin', 'reels', 'tiktok', 'whatsapp_status', 'youtube', 'presentation', 'instagram_feed'] as const
export type MishkatChannel = (typeof MISHKAT_CHANNELS)[number]

export const MISHKAT_ASPECTS = ['16:9', '9:16', '1:1'] as const
export type MishkatAspect = (typeof MISHKAT_ASPECTS)[number]

export const MISHKAT_LANGS = ['fr', 'ar', 'darija', 'en'] as const
export type MishkatLang = (typeof MISHKAT_LANGS)[number]

export interface MishkatBrief {
  brand_id: string
  intent: string
  audience: MishkatAudience
  channel_format: Array<{ channel: MishkatChannel; aspect: MishkatAspect }>
  language: { primary: MishkatLang; secondary?: MishkatLang; rtl?: boolean }
  tone: MishkatTone
  duration_s: number
  objective: MishkatObjective
  proof?: 'none' | 'data' | 'testimonial' | 'live_demo' | 'logo_wall'
  sound?: { music?: boolean; voiceover?: boolean; captions_burned?: boolean }
  sovereignty?: 'public' | 'sensitive'
  title?: string
}

export interface BrandTokens {
  brand_id: string
  palette: { primary: string; secondary: string; accent: string; bg: string; text: string }
  typography: {
    display: { family: string; url?: string; weight?: number }
    body: { family: string; url?: string; weight?: number }
  }
  logo_url: string
  media?: { backgrounds: string[] }
}

export type MishkatStatus = 'queued' | 'generating' | 'rendering' | 'done' | 'error'

export interface MishkatVariant { lang: string; format: string; gatePassed: boolean; url: string }

export interface MishkatScene { id: string; image_prompt?: string; [k: string]: unknown }
export interface MishkatStoryboard { scenes: MishkatScene[]; [k: string]: unknown }

export interface MishkatProduction {
  id?: string
  status: MishkatStatus
  storyboard?: MishkatStoryboard
  variants?: MishkatVariant[]
  error?: string
}

export interface MishkatCreateResponse { id: string; status: MishkatStatus }
```

**Step 2 — Test rouge (`client.test.ts`).** Mocker `fetch` global. Vérifier : header `Authorization: Bearer <key>`, base URL, parse de `202 {id,status}`, et erreur si clé absente.
```ts
// src/lib/services/mishkat/client.test.ts
import { createProduction, getProduction, MishkatConfigError } from './client'

const originalEnv = process.env
beforeEach(() => { process.env = { ...originalEnv, MISHKAT_API_KEY: 'test-key', MISHKAT_API_BASE_URL: 'https://m.test' } })
afterEach(() => { process.env = originalEnv; jest.restoreAllMocks() })

test('createProduction envoie le Bearer et parse 202', async () => {
  const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ id: 'job-1', status: 'queued' }), { status: 202 })
  )
  const res = await createProduction({ brief: { brand_id: 'rami' } as never })
  expect(res).toEqual({ id: 'job-1', status: 'queued' })
  const [url, init] = fetchMock.mock.calls[0]
  expect(url).toBe('https://m.test/v1/productions')
  expect((init?.headers as Record<string, string>).Authorization).toBe('Bearer test-key')
})

test('createProduction throw MishkatConfigError sans clé', async () => {
  delete process.env.MISHKAT_API_KEY
  await expect(createProduction({ brief: {} as never })).rejects.toBeInstanceOf(MishkatConfigError)
})

test('getProduction relaie le statut', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ status: 'done', variants: [] }), { status: 200 })
  )
  const p = await getProduction('job-1')
  expect(p.status).toBe('done')
})
```
Run: `npm test -- src/lib/services/mishkat/client.test.ts` → **FAIL** (module absent).

**Step 3 — Impl (`client.ts`).**
```ts
// src/lib/services/mishkat/client.ts
import 'server-only'
import type { MishkatBrief, BrandTokens, MishkatProduction, MishkatCreateResponse } from './types'

export class MishkatConfigError extends Error {}
export class MishkatApiError extends Error {
  constructor(message: string, readonly status: number) { super(message) }
}

function cfg(): { key: string; base: string } {
  const key = process.env.MISHKAT_API_KEY
  if (!key) throw new MishkatConfigError('MISHKAT_API_KEY non configurée')
  const base = process.env.MISHKAT_API_BASE_URL ?? 'https://mishkat.ai-mpower.com'
  return { key, base }
}

async function call<T>(path: string, init: RequestInit): Promise<T> {
  const { key, base } = cfg()
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    cache: 'no-store',
  })
  if (!res.ok) throw new MishkatApiError(`Mishkāt ${path} → HTTP ${res.status}`, res.status)
  return (await res.json()) as T
}

export function createProduction(body: { brief: MishkatBrief; brand?: BrandTokens; storyboard?: unknown; sceneImages?: Record<string, string> }): Promise<MishkatCreateResponse> {
  return call<MishkatCreateResponse>('/v1/productions', { method: 'POST', body: JSON.stringify(body) })
}
export function createStoryboard(body: { brief: MishkatBrief; brand?: BrandTokens }): Promise<{ id: string }> {
  return call<{ id: string }>('/v1/storyboards', { method: 'POST', body: JSON.stringify(body) })
}
export function getProduction(id: string): Promise<MishkatProduction> {
  return call<MishkatProduction>(`/v1/productions/${encodeURIComponent(id)}`, { method: 'GET' })
}
/** Stream brut d'une variante MP4 (pour archivage serveur). */
export async function fetchVariant(id: string, key: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const { key: apiKey, base } = cfg()
  const res = await fetch(`${base}/v1/productions/${encodeURIComponent(id)}/variants/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${apiKey}` }, cache: 'no-store',
  })
  if (!res.ok) throw new MishkatApiError(`Mishkāt variant ${key} → HTTP ${res.status}`, res.status)
  const arr = new Uint8Array(await res.arrayBuffer())
  return { buffer: Buffer.from(arr), mimeType: res.headers.get('content-type') ?? 'video/mp4' }
}
```
Run le test → **PASS**.

**Step 4 — Commit :** `git commit -am "feat(video): client Mishkāt typé + types contrat"`

---

### Task 1.2 : Construction `BrandTokens` depuis le Brand DNA (pur, TDD)

**Files:**
- Create: `src/lib/services/mishkat/brand-tokens.ts`
- Test: `src/lib/services/mishkat/brand-tokens.test.ts`

**But:** transformer `BrandDnaFormData` (couleurs en IDs Causse ou HEX, logo base64) → `BrandTokens` (HEX résolus). Fonction **pure** (URLs `media.backgrounds` et `logo_url` signées injectées par l'appelant — pas d'I/O ici).

**Step 1 — Test rouge.**
```ts
// src/lib/services/mishkat/brand-tokens.test.ts
import { buildBrandTokens } from './brand-tokens'
import type { BrandDnaFormData } from '@/lib/schemas/brand-dna.schema'

const dna = {
  brandName: 'Rami', sector: 'tech', positioning: 'x'.repeat(20), audienceDescription: 'y'.repeat(25),
  colorPrimary: 'violet_creatif', colorSecondary: '#2563eb', colorAccent: 'vert_emeraude', voiceTone: 'premium',
} as unknown as BrandDnaFormData

test('résout les IDs Causse en HEX et passe les HEX bruts', () => {
  const t = buildBrandTokens('rami', dna, { backgrounds: ['https://x/1.jpg'], logoUrl: '' })
  expect(t.brand_id).toBe('rami')
  expect(t.palette.primary.toLowerCase()).toBe('#7c3aed') // violet_creatif
  expect(t.palette.secondary).toBe('#2563eb')             // HEX brut conservé
  expect(t.palette.accent.toLowerCase()).toBe('#059669')  // vert_emeraude
  expect(t.media?.backgrounds).toEqual(['https://x/1.jpg'])
})

test('fallback couleurs sûres si DNA incomplet', () => {
  const t = buildBrandTokens('rami', {} as BrandDnaFormData, { backgrounds: [], logoUrl: '' })
  expect(t.palette.primary).toMatch(/^#[0-9a-fA-F]{6}$/)
  expect(t.media).toBeUndefined() // pas de backgrounds → pas de clé media
})
```
Run → **FAIL**.

**Step 2 — Impl.**
```ts
// src/lib/services/mishkat/brand-tokens.ts
import { causseColorToHex } from '@/lib/services/brand-dna/normalize'
import type { BrandDnaFormData } from '@/lib/schemas/brand-dna.schema'
import type { BrandTokens } from './types'

const FALLBACK = { primary: '#1E3A5F', secondary: '#4E45D5', accent: '#10B981', bg: '#F7F6F8', text: '#0A0A0F' } as const

function hex(value: string | undefined, fallback: string): string {
  return (value && causseColorToHex(value)) || fallback
}

export function buildBrandTokens(
  brandId: string,
  dna: BrandDnaFormData | null,
  extra: { backgrounds: string[]; logoUrl: string },
): BrandTokens {
  const tokens: BrandTokens = {
    brand_id: brandId,
    palette: {
      primary: hex(dna?.colorPrimary, FALLBACK.primary),
      secondary: hex(dna?.colorSecondary, FALLBACK.secondary),
      accent: hex(dna?.colorAccent, FALLBACK.accent),
      bg: FALLBACK.bg,
      text: FALLBACK.text,
    },
    typography: {
      display: { family: dna?.typography?.headingFamily ?? 'Geist', weight: 700 },
      body: { family: dna?.typography?.bodyFamily ?? 'Geist', weight: 400 },
    },
    logo_url: extra.logoUrl,
  }
  if (extra.backgrounds.length > 0) tokens.media = { backgrounds: extra.backgrounds }
  return tokens
}
```
> ⚠️ Vérifier le nom réel des champs typo dans `typographySchema` (`src/lib/schemas/brand-dna.schema.ts`) ; adapter `headingFamily`/`bodyFamily` si différent. Si `typography` absent du schéma, retomber sur `'Geist'`.

Run → **PASS**. **Commit :** `git commit -am "feat(video): buildBrandTokens (Brand DNA → BrandTokens HEX)"`

---

### Task 1.3 : Schéma Zod du brief côté RAMI (entrée UI, TDD)

**Files:**
- Create: `src/lib/schemas/mishkat-video.schema.ts`
- Test: `src/lib/schemas/mishkat-video.schema.test.ts`

**But:** valider l'entrée du formulaire RAMI (sous-ensemble simplifié exposé à l'utilisateur) + un builder `toMishkatBrief()` qui dérive `channel_format` (16:9 + 9:16) et `language` (primary + secondary) pour produire les 4 variantes.

**Step 1 — Test rouge.**
```ts
// src/lib/schemas/mishkat-video.schema.test.ts
import { MishkatVideoInputSchema, toMishkatBrief } from './mishkat-video.schema'

const valid = {
  intent: 'Annoncer le lancement de Rami aux pairs techniques et montrer le gain de temps.',
  audience: 'pairs_tech', tone: 'premium', objective: 'awareness',
  duration_s: 30, primaryLang: 'fr', secondaryLang: 'ar',
  music: true, voiceover: false, captionsBurned: true,
  assetIds: ['a1', 'a2'],
}

test('valide un brief correct', () => {
  expect(MishkatVideoInputSchema.safeParse(valid).success).toBe(true)
})
test('rejette intent trop court', () => {
  expect(MishkatVideoInputSchema.safeParse({ ...valid, intent: 'court' }).success).toBe(false)
})
test('toMishkatBrief produit 16:9 + 9:16 et bilingue', () => {
  const brief = toMishkatBrief('rami', MishkatVideoInputSchema.parse(valid))
  const aspects = brief.channel_format.map((c) => c.aspect).sort()
  expect(aspects).toEqual(['16:9', '9:16'])
  expect(brief.language).toEqual({ primary: 'fr', secondary: 'ar', rtl: false })
})
```
Run → **FAIL**.

**Step 2 — Impl.**
```ts
// src/lib/schemas/mishkat-video.schema.ts
import { z } from 'zod'
import { MISHKAT_AUDIENCES, MISHKAT_TONES, MISHKAT_OBJECTIVES, MISHKAT_LANGS, type MishkatBrief } from '@/lib/services/mishkat/types'

export const MishkatVideoInputSchema = z.object({
  intent: z.string().min(10).max(1000).trim(),
  audience: z.enum(MISHKAT_AUDIENCES),
  tone: z.enum(MISHKAT_TONES),
  objective: z.enum(MISHKAT_OBJECTIVES),
  duration_s: z.number().int().min(10).max(180),
  primaryLang: z.enum(MISHKAT_LANGS).default('fr'),
  secondaryLang: z.enum(MISHKAT_LANGS).optional(),
  music: z.boolean().default(true),
  voiceover: z.boolean().default(false),
  captionsBurned: z.boolean().default(true),
  assetIds: z.array(z.string().uuid()).max(8).default([]), // images bibliothèque (pool v1)
  title: z.string().max(120).optional(),
})
export type MishkatVideoInput = z.infer<typeof MishkatVideoInputSchema>

export function toMishkatBrief(brandId: string, input: MishkatVideoInput): MishkatBrief {
  const rtl = input.primaryLang === 'ar' || input.primaryLang === 'darija'
  return {
    brand_id: brandId,
    intent: input.intent,
    audience: input.audience,
    channel_format: [
      { channel: 'youtube', aspect: '16:9' },
      { channel: 'reels', aspect: '9:16' },
    ],
    language: { primary: input.primaryLang, ...(input.secondaryLang ? { secondary: input.secondaryLang } : {}), rtl },
    tone: input.tone,
    duration_s: input.duration_s,
    objective: input.objective,
    sound: { music: input.music, voiceover: input.voiceover, captions_burned: input.captionsBurned },
    ...(input.title ? { title: input.title } : {}),
  }
}
```
Run → **PASS**. **Commit :** `git commit -am "feat(video): schéma Zod brief Mishkāt + toMishkatBrief"`

---

### Task 1.4 : Table `video_productions` + migration + Drizzle

**Files:**
- Create: `supabase/migrations/20260626000001_mishkat_video_productions.sql`
- Modify: `src/lib/db/schema.ts` (ajouter la table Drizzle)

**Step 1 — Migration SQL (RLS obligatoire, cf. règle absolue n°4).** Reprendre le pattern RLS de `generated_videos`.
```sql
-- supabase/migrations/20260626000001_mishkat_video_productions.sql
CREATE TABLE IF NOT EXISTS video_productions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  mishkat_job_id  TEXT NOT NULL,
  mode            VARCHAR(16) NOT NULL DEFAULT 'v1_pool',   -- v1_pool | v2_scene
  status          VARCHAR(16) NOT NULL DEFAULT 'queued',    -- queued|generating|rendering|done|error
  brief           JSONB NOT NULL,
  brand_snapshot  JSONB,
  storyboard      JSONB,
  variants        JSONB NOT NULL DEFAULT '[]'::jsonb,        -- [{lang,format,gatePassed,url,media_id}]
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE video_productions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_video_productions" ON video_productions
  FOR ALL USING (
    tenant_id IN (
      SELECT t.id FROM tenants t
      INNER JOIN tenant_members tm ON tm.tenant_id = t.id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE INDEX idx_video_productions_tenant ON video_productions (tenant_id, created_at DESC);
CREATE UNIQUE INDEX idx_video_productions_job ON video_productions (mishkat_job_id);
```
> ⚠️ Vérifier la forme exacte de la policy `generated_videos` dans `supabase/migrations/` et **copier la même** (jointure `tenant_members`) pour rester cohérent.

**Step 2 — Drizzle (`src/lib/db/schema.ts`).** Ajouter, à côté de `generated_videos` :
```ts
export const video_productions = pgTable('video_productions', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenant_id: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  mishkat_job_id: text('mishkat_job_id').notNull(),
  mode: varchar('mode', { length: 16 }).notNull().default('v1_pool'),
  status: varchar('status', { length: 16 }).notNull().default('queued'),
  brief: jsonb('brief').notNull(),
  brand_snapshot: jsonb('brand_snapshot'),
  storyboard: jsonb('storyboard'),
  variants: jsonb('variants').notNull().default([]),
  error_message: text('error_message'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
```

**Step 3 — Appliquer la migration sur Supabase self-hosted RAMI** (db-rami.ai-mpower.com — cf. mémoire `reference_rami_infra_prod`), pas en local. Via la CLI Supabase pointée sur la DB prod/staging, ou le SQL editor du Studio self-hosted. Vérifier : `SELECT to_regclass('public.video_productions');` ≠ NULL et `rowsecurity = true`.

**Step 4 — Commit :** `git commit -am "feat(video): table video_productions + RLS + Drizzle"`

---

### Task 1.5 : Helpers serveur — résolution backgrounds signés + persistance

**Files:**
- Create: `src/lib/services/mishkat/backgrounds.ts`
- Test: `src/lib/services/mishkat/backgrounds.test.ts`

**But:** depuis `assetIds[]`, charger les `media` du tenant, vérifier qu'ils lui appartiennent (RLS le garantit mais double-check), produire des **URLs signées** (`createSignedUrl`). Logo : si un asset logo existe → URL signée, sinon `''`.

**Step 1 — Test rouge** (mock `getMediaAssetsAction` + `createSignedUrl`) : vérifier qu'on ne signe que les `image/*` et qu'on conserve l'ordre des `assetIds`.

**Step 2 — Impl** : `resolveBackgroundUrls(assetIds, tenantId): Promise<string[]>` — filtrer `fileType==='image'`, mapper `storagePath`→`createSignedUrl(bucket, path)`. Ignorer silencieusement un asset introuvable (log structuré `logger`), ne jamais throw pour un fond manquant (non bloquant → fallback mesh).

**Step 3 — Commit.**

---

### Task 1.6 : Route proxy `POST /api/video/create`

**Files:**
- Create: `src/app/api/video/create/route.ts`
- Test: `tests/e2e/mishkat-video.spec.ts` (squelette, complété en 1.9)

**Logique** (pattern `src/app/api/brand-dna/ai-assist/route.ts`) :
```ts
// src/app/api/video/create/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { getBrandDnaAction } from '@/lib/actions/brand-dna.actions'
import { MishkatVideoInputSchema, toMishkatBrief } from '@/lib/schemas/mishkat-video.schema'
import { buildBrandTokens } from '@/lib/services/mishkat/brand-tokens'
import { resolveBackgroundUrls, resolveLogoUrl } from '@/lib/services/mishkat/backgrounds'
import { createProduction } from '@/lib/services/mishkat/client'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable.' }, { status: 404 })

  let raw: unknown
  try { raw = await req.json() } catch { return NextResponse.json({ error: 'Corps invalide.' }, { status: 400 }) }
  const parsed = MishkatVideoInputSchema.safeParse(raw)
  if (!parsed.success) return NextResponse.json({ error: 'Paramètres invalides.', details: parsed.error.issues }, { status: 400 })

  // slug tenant pour brand_id
  const { data: tenantRow } = await supabase.from('tenants').select('slug').eq('id', tenantId).single()
  const brandId = tenantRow?.slug ?? tenantId

  const dnaResult = await getBrandDnaAction()
  const dna = 'data' in dnaResult ? dnaResult.data : null

  const backgrounds = await resolveBackgroundUrls(parsed.data.assetIds, tenantId)
  const logoUrl = await resolveLogoUrl(tenantId, dna)
  const brief = toMishkatBrief(brandId, parsed.data)
  const brand = buildBrandTokens(brandId, dna, { backgrounds, logoUrl })

  try {
    const { id, status } = await createProduction({ brief, brand })
    await supabase.from('video_productions').insert({
      tenant_id: tenantId, mishkat_job_id: id, mode: 'v1_pool', status,
      brief, brand_snapshot: brand,
    })
    return NextResponse.json({ id, status }, { status: 202 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur Mishkāt'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
```
> Rate-limit : réutiliser `checkRateLimit` si présent (cf. ai-assist) sous une clé `video_create` (cf. CLAUDE.md `generate_visual: 20/h`). Audit log `video.production_created` (table `audit_logs`).

**Commit :** `git commit -am "feat(video): route proxy POST /api/video/create (Mishkāt)"`

---

### Task 1.7 : Route miroir `GET /api/video/[id]` (polling + archivage)

**Files:**
- Create: `src/app/api/video/[id]/route.ts`
- Create: `src/lib/services/mishkat/archive.ts`
- Test: `src/lib/services/mishkat/archive.test.ts`

**Comportement** : relaie `getProduction(id)`. Quand `status === 'done'` et que les variantes ne sont **pas encore archivées**, déclencher l'archivage (idempotent), mettre à jour `video_productions` (status + variants enrichies de `media_id` + URLs RAMI), et renvoyer au front les URLs **archivées RAMI** (souverain).

**Archivage (`archive.ts`)** — chemin **vidéo-safe** (ne pas passer par `uploadAsset` qui resize les images) :
1. Pour chaque variante : dériver la `key` (`<lang>-<format>.mp4`, ex. `fr-16x9.mp4`) depuis `{lang,format}` (mapper `16:9`→`16x9`, `9:16`→`9x16`).
2. `fetchVariant(jobId, key)` → buffer MP4.
3. ~~Upload direct Supabase Storage~~ **[SUPERSÉDÉ 2026-06-28]** : plus de re-upload — Mishkāt renvoie `variants[].url` = URL MinIO publique permanente, persistée telle quelle (`toPermanentVariants`). Copie de redondance MinIO optionnelle (`archiveProductionIfNeeded`, `MISHKAT_ARCHIVE_REDUNDANT_COPY=true`) via `uploadToStorage({ bucket: BUCKETS.media })`.
4. Insert `media` (tenant_id, filename, mime_type `video/mp4`, size_bytes, storage_path, public_url/signed).
5. Retourner `media_id` + URL pour enrichir `variants`.

**Test (`archive.test.ts`)** : mocker `fetchVariant` + storage ; vérifier la dérivation de clé (`{lang:'fr',format:'16:9'}` → `fr-16x9.mp4`) et l'idempotence (2ᵉ appel ne re-télécharge pas si `media_id` déjà présent).

**Route** :
```ts
// src/app/api/video/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { getProduction } from '@/lib/services/mishkat/client'
import { archiveProductionIfNeeded } from '@/lib/services/mishkat/archive'

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await ctx.params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return NextResponse.json({ error: 'Tenant introuvable.' }, { status: 404 })

  // garde-fou : la prod doit appartenir au tenant (RLS)
  const { data: prod } = await supabase
    .from('video_productions').select('id, status, variants')
    .eq('mishkat_job_id', id).eq('tenant_id', tenantId).single()
  if (!prod) return NextResponse.json({ error: 'Production introuvable.' }, { status: 404 })

  const live = await getProduction(id)
  if (live.status === 'done') {
    const archived = await archiveProductionIfNeeded(supabase, tenantId, id, live.variants ?? [], prod.variants)
    return NextResponse.json({ status: 'done', variants: archived })
  }
  await supabase.from('video_productions').update({ status: live.status, error_message: live.error ?? null, updated_at: new Date().toISOString() }).eq('mishkat_job_id', id)
  return NextResponse.json({ status: live.status, error: live.error })
}
```
> Note : pas de proxy de stream direct au MVP — on sert les URLs RAMI archivées (souverain, DoD « source des archives »). Garder `fetchVariant` côté serveur uniquement.

**Commit :** `git commit -am "feat(video): GET /api/video/[id] + archivage MP4 vers bibliothèque tenant"`

---

### Task 1.8 : UI — sélecteur de mode + formulaire Studio Mishkāt

**Files:**
- Create: `src/components/visual/MishkatStudioClient.tsx`
- Create: `src/components/visual/VideoModeSwitch.tsx` (ou état local dans la page)
- Modify: `src/app/(dashboard)/create/video/page.tsx` (rendre un wrapper à 2 modes)
- Modify: `src/components/layout/nav-config.ts` (label inchangé, badge `new`)
- Modify: `messages/fr.json`, `messages/ar.json`, et les autres locales (clés i18n)

**Comportement UI (mode « Studio de marque ») :**
1. Champs : `intent` (textarea), `audience` (select), `tone` (select), `objective` (select), `duration_s` (slider/options 10–180), langues `primaryLang`/`secondaryLang` (défaut fr + ar), toggles son (`music`, `voiceover`, `captionsBurned`).
2. **Sélecteur d'images depuis la bibliothèque** : charger `getMediaAssetsAction({ fileType: 'image' })`, grille sélectionnable (multi, max 8) → `assetIds`. Réutiliser les composants `src/components/library/*` (`media-card`). Si 0 image sélectionnée → message « fond mesh souverain Mishkāt sera utilisé » (non bloquant).
3. Submit → `fetch('/api/video/create', { method:'POST', body: JSON })` → `{id}`.
4. **Polling** `GET /api/video/${id}` toutes les ~4 s (afficher l'état `queued→generating→rendering→done`), arrêt sur `done`/`error`/timeout (~6 min).
5. À `done` : afficher les **4 MP4** (FR·AR × 16:9·9:16) avec `<video controls>` (URLs archivées RAMI) + boutons **Télécharger** chacun + lien « Voir dans la bibliothèque ».

**Page à 2 modes** :
```tsx
// src/app/(dashboard)/create/video/page.tsx  (devient client wrapper ou garde RSC + composant switch client)
import { VideoWorkspace } from '@/components/visual/VideoWorkspace'
export default function VideoPage() { return <VideoWorkspace /> }
```
`VideoWorkspace` (client) : onglets « Studio de marque (Mishkāt) » | « Génération rapide (Veo) » → rend `MishkatStudioClient` ou `VideoGeneratorClient`.

**Anti-leak (Règle absolue 4.7) — contrôle obligatoire avant commit :**
```bash
# Aucune ref à la clé côté client/bundle :
grep -rn "MISHKAT_API_KEY" src/components src/app/\(dashboard\) || echo "OK: clé absente du front"
grep -rn "NEXT_PUBLIC_MISHKAT" src || echo "OK: pas de NEXT_PUBLIC_MISHKAT"
```

**Commit :** `git commit -am "feat(video): UI Studio Mishkāt (form brief + picker biblio + polling + 4 MP4)"`

---

### Task 1.9 : Qualité, e2e, déploiement Coolify, browser-verify

**Step 1 — Dette zéro (Règle absolue 3) :**
```bash
npm run typecheck   # 0 erreur
npm run lint        # 0 erreur
npm test            # tous verts (units Mishkāt + existants)
```

**Step 2 — e2e Playwright (`tests/e2e/mishkat-video.spec.ts`)** — contre **staging Coolify** (jamais localhost). Parcours :
- login → `/create/video` → onglet « Studio de marque » visible.
- brief minimal + sélection ≥1 image → submit → état de génération affiché.
- (mock réseau OU vrai job court) → 4 lecteurs vidéo présents à `done` + boutons télécharger.
- garde sécurité : `POST /api/video/create` sans session → 401.

**Step 3 — Déploiement Coolify (cf. mémoire `feedback_jamais_dev_local_coolify_only`) :**
```bash
git push -u origin feature/mishkat-video
npm run deploy   # webhook Coolify (ou merge → auto-deploy selon config app rami)
```

**Step 4 — Browser-verify sur l'URL prod/staging Coolify** (claude-in-chrome ou Playwright) :
- Lancer une vraie production courte (durée 10 s) avec 1 image de marque.
- Confirmer la DoD : **4 MP4** lisibles, fonds = image sélectionnée, et les MP4 **présents dans la bibliothèque** du tenant après `done`.
- Confirmer (DevTools → Network/Sources) que `MISHKAT_API_KEY` n'apparaît **jamais** côté client.

**Step 5 — Definition of Done v1 — cocher :**
- [ ] Tenant lance une vidéo depuis RAMI → reçoit 4 MP4 (FR·AR × 16:9·9:16) avec ses images de marque en fond.
- [ ] `MISHKAT_API_KEY` ne transite jamais côté client (proxy serveur uniquement).
- [ ] Fonds = bibliothèque d'assets du tenant (URLs signées Supabase), pas de stock externe.
- [ ] Brand DNA résolu inline (couleurs HEX via `causseColorToHex`, typo, logo) dans le body `POST /v1/productions`.
- [ ] Productions archivées dans la bibliothèque (table `media`), retrouvables par le tenant.
- [ ] `typecheck`/`lint`/`test` à zéro ; e2e parcours critique vert ; browser-verify sur Coolify OK.

**Commit final phase 1 :** `git commit -am "test(video): e2e Mishkāt + checklist DoD v1"`

---

## Phase 2 — Flux v2 « contextuel par scène »

> Pré-requis : Phase 1 livrée et vérifiée. Ajoute un sous-mode « Images contextuelles (par scène) » dans `MishkatStudioClient`.

### Task 2.1 : Proxy storyboard `POST /api/video/storyboard`
- Route serveur : `createStoryboard({ brief, brand })` → `{id}` ; poller `getProduction(id)` jusqu'à `done` → renvoyer `storyboard.scenes[]` (avec `image_prompt`). Persister `storyboard` dans `video_productions` (mode `v2_scene`).

### Task 2.2 : Génération d'une image par scène (moteur RAMI)
**Files:** `src/lib/services/mishkat/scene-images.ts` (+ test)
- Pour chaque `scene.image_prompt` : `generateImage({ prompt: image_prompt, width, height })` (dimensions selon aspect dominant), stocker dans la bibliothèque du tenant (`storeVisual`/`uploadAsset` image), construire `sceneImages = { "<sceneId>": "<signedUrl>" }`.
- Paralléliser (borné) ; en cas d'échec d'une scène → fallback (réutiliser une image du pool ou laisser Mishkāt gérer la scène sans image).

### Task 2.3 : Production finale avec storyboard réutilisé
- `createProduction({ brief, brand, storyboard, sceneImages })` (le storyboard fourni est **réutilisé tel quel** — le studio n'est PAS rappelé). Polling + archivage identiques à 1.7.

### Task 2.4 : UI sous-mode v2 + e2e + déploiement + browser-verify
- Toggle « Pool (rapide) » vs « Par scène (contextuel) » ; afficher l'aperçu storyboard (scènes + image générée) avant rendu final.
- Quality gate + Coolify deploy + browser-verify (mêmes exigences que 1.9).

---

## Notes transverses (à respecter à chaque tâche)
- **Aucun `any`** non justifié (cf. `~/.claude/rules/typescript.md`) ; types de retour explicites sur tout export.
- **`server-only`** sur tout module touchant `MISHKAT_API_KEY` / `fetchVariant`.
- **RLS** sur `video_productions` (déjà) ; toute requête filtre `tenant_id`.
- **Logger structuré** (`src/lib/utils/logger.ts`) — pas de `console.log` en prod.
- **i18n** : toute chaîne UI passe par `messages/*.json` (fr + ar + autres locales présentes), pas de littéral en dur.
- **Vérification = preuve système** (Règle absolue 4) : ne cocher la DoD qu'après browser-verify réel sur Coolify, jamais « probablement OK ».
- **PASSATION.md** : journaliser la livraison (US, fichiers, état) à la fin de chaque phase.
