# Ralph Progress — RAMI Complétion

## Codebase Patterns (à suivre)
- **Stack** : Next.js 16 (App Router, Turbopack), React 19 (React Compiler), TS strict, Tailwind v4, shadcn base-nova (@base-ui/react), Zod v4.
- **Proxy middleware** : `src/proxy.ts` (export `proxy()`), pas `middleware.ts`.
- **Supabase** : clients `src/lib/supabase/{server,client}.ts` ; service role `src/lib/supabase/service.ts` (bypass RLS). Auth SSR.
- **DB** : Drizzle (`packages/db/schema/*` ou `src/lib/db/`), migrations SQL `supabase/migrations/` (préfixe timestamp `2026...000NNN_`). Instance dédiée `supabase-db-szn6rjsrqig7n4oerw27egwr` (db-rami.ai-mpower.com).
- **RLS** : OBLIGATOIRE sur chaque table. `get_current_tenant_id()` lit `public.users.tenant_id`. Policy type `tenant_id = get_current_tenant_id()`.
- **Tenant resolution** : `resolveUserTenant(supabase, userId)` (tenants.owner_id → tenant_members → users.tenant_id).
- **LLM** : via proxy LiteLLM (`OPENAI_BASE_URL=https://proxy.ai-mpower.com/v1`, `OPENAI_API_KEY`). Texte = `deepseek-v4-flash` (`LLM_TEXT_MODEL`), vision = `moonshot-v1-8k-vision-preview` (`VISION_MODEL`, BASE64 only). Provider "openai" route vers le proxy. Config par cas d'usage : `src/lib/services/ai/prompt-config.ts` (DB `ai_prompts_config` + fallback).
- **Crawl4AI** : `CRAWL4AI_BASE_URL=https://crawl4ai.ai-mpower.com`, `POST /md {url, filter:"fit"}` → markdown.
- **Abstractions** : `PublishingProvider`, `ImageProvider` (5 providers fallback), `MetricsProvider` (à créer). OAuth refresh : `getValidToken()`.
- **Queue** : pg-boss connecté (schéma `pgboss`), jobs enregistrés dans `src/instrumentation.ts`.
- **Storage** : MinIO (privé) + R2 (CDN). `src/lib/services/storage/`.
- **Crypto** : OAuth tokens AES-256-GCM (`OAUTH_TOKEN_ENCRYPTION_KEY`).
- **Conventions** : français accentué (commentaires/UI), `useWatch()` (pas `watch()`), Zod v4 `defaultValues` dans useForm (pas `.default()` avec zodResolver), `useCallback` retiré si React Compiler le gère, pas de composant créé en render.

## Pièges connus
- `output: "standalone"` conditionnel `BUILD_STANDALONE` (sinon casse `next start` Nixpacks).
- Moonshot vision : base64 inline uniquement (fetch+encode les URLs).
- deepseek : pas via `/v1/messages` (Anthropic) — uniquement `/v1/chat/completions`.
- Un compte créé hors onboarding n'a pas de tenant → 404 (créer tenants + users row).

## Déploiement
- Coolify app `rami` (uuid ry8ytnene4czxdhsoes0z56y), Nixpacks, auto-deploy sur push. API Coolify : token coffre.
- cloudflared tunnel nahda ; DNS via `cloudflared tunnel route dns --overwrite-dns 7156c3f9-... <host>`.

## Log itérations
<!-- (date | story | fichiers | learnings) -->
