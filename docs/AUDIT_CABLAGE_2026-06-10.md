# AUDIT DE CÂBLAGE — RAMI (2026-06-10)

> Audit exhaustif code ↔ env prod ↔ services externes. Trois sources croisées :
> matrice de câblage du code (`src/`), inventaire env réel du conteneur prod
> (`ry8ytnene4czxdhsoes0z56y-*`), tests runtime live (proxy, Crawl4AI, Whisper, DB).
> Gates au moment de l'audit : TypeScript 0 · ESLint 0/0 · Jest 261/261 · npm audit 0.

---

## 1. Synthèse exécutive

| Domaine | Code | Env prod | Verdict |
|---|---|---|---|
| LLM texte (deepseek via proxy) | ✅ réel | ✅ posé | **OPÉRATIONNEL** (testé live) |
| Vision (moonshot via proxy) | ✅ réel | ✅ posé | **OPÉRATIONNEL** |
| Image gen chaîne 1-3 (NanoBanana, Fal, Imagen) | ✅ réel | ✅ posé | **OPÉRATIONNEL** |
| Image gen chaîne 4-5 (Replicate, Together) | ✅ réel | ❌ clés absentes | **CHAÎNE MORTE** (fallback throw) |
| Vidéo Veo + Wan | ✅ réel | ✅ couvert (Google AI + Fal) | OPÉRATIONNEL (UI encore mock) |
| Vidéo Runway/Kling/Luma | ✅ réel | ❌ clés absentes | CHAÎNES MORTES |
| Publishing X/LinkedIn/Meta/Pinterest | ✅ réel (OAuth+publish+metrics) | ❌ **AUCUN client id/secret** | **MORT EN PROD** — 0 connexion sociale possible |
| Whisper transcription | ✅ réel | ❌ pas de clé, proxy ne route pas whisper-1 | **BLOQUÉ** (US-022/023/024) |
| Enrichissement leads (5 providers) | ✅ réel | ✅ Apollo env + Hunter BYOK DB | OPÉRATIONNEL |
| Crawl4AI | ✅ réel | ✅ posé | **OPÉRATIONNEL** (health 200, v0.8.6) |
| MinIO storage | ✅ réel | ✅ posé | OPÉRATIONNEL |
| Stripe billing | ✅ réel | ❌ **aucune clé dans le conteneur** | **MORT EN PROD** (US-018/019) |
| Resend emails | ❌ **non implémenté** | EMAIL_FROM orphelin posé | À CODER (US-047) |
| Sentry | ✅ réel (no-op sans DSN) | ❌ DSN absent | **MONITORING ÉTEINT** |
| PostHog | ✅ réel (no-op sans clé) | ❌ NEXT_PUBLIC_POSTHOG_KEY absente (host seul) | **ANALYTICS ÉTEINT** |
| YouTube/Mastodon/TikTok | ❌ non implémentés | ❌ | À CODER (US-044/045/046) |
| Cloudflare R2 | ❌ non implémenté (vars fantômes .env.example) | ❌ | Décision : implémenter ou purger doc |
| Ayrshare | ❌ non implémenté (var fantôme) | ❌ | Décision US-031 : fallback ou purge |

**Donnée d'usage prod** : 2 tenants, 2 users, **0 posts, 0 social_accounts, 0 visual_sessions,
0 post_metrics, 0 leads, 0 transcriptions, 0 invoices**. La plateforme n'a jamais été exercée
en réel — conséquence directe des chaînes mortes ci-dessus (OAuth social impossible sans apps).

---

## 2. Proxy LiteLLM — inventaire réel (clé rami-app, testé 2026-06-10)

Modèles routés : `cheap`, `medium`, `pro`, `opus`, `claude-haiku-4-5`, `claude-sonnet-4-6`,
`claude-opus-4-7`, `deepseek-chat`, `deepseek-v4-flash`, `deepseek-v4-pro`, `kimi-k2.5`,
`kimi-k2.6`, `kimi-k2-*-preview`, `moonshot-v1-8k/32k/128k`, `moonshot-v1-8k-vision-preview`,
`gemini/gemini-embedding-001/2/2-preview`.

**Absents du proxy** : `whisper-1` (→ US-022 bloquée, HTTP 400 confirmé), tout modèle TTS
(→ US-037), tout modèle image/vidéo (sans impact : les générateurs appellent en direct).

---

## 3. Dettes de câblage CODE découvertes (au-delà du prd.json)

Violations DEFCON 1 (données inventées) et références mortes — à corriger en priorité :

| # | Fichier | Problème | Gravité |
|---|---|---|---|
| Z1 | `src/lib/actions/workflow.actions.ts:275,320` | `brandDnaScore: 0.75 + Math.random()*0.2` — score INVENTÉ au lieu du VisionScorer | **DEFCON 1** |
| Z2 | `src/lib/actions/workflow.actions.ts:342-348` | Fallback échec providers = images `picsum.photos` (placeholder mensonger) | **DEFCON 1** |
| Z3 | `src/lib/actions/workflow.actions.ts:315-318` | Path image legacy dupliqué + URLs `/api/replicate/poll?id=...` → **route inexistante** | Haute |
| Z4 | `src/components/library/media-card.tsx:69-71` | `getDnaScore()` simulé côté UI (`Math.random`) | **DEFCON 1** |
| Z5 | `src/app/(dashboard)/dashboard/invoices/page.tsx:33` | `MOCK_INVOICES` — aucune lecture Stripe réelle | Haute (dépend US-018) |
| Z6 | `src/app/(dashboard)/dashboard/tenants/page.tsx:40` | `MOCK_TENANTS` page admin | Haute |
| Z7 | `src/components/layout/tenant-switcher.tsx:15` | `MOCK_TENANTS` switcher | Haute |
| Z8 | `src/components/approvals/approval-board.tsx:16-134` | `MOCK_ITEMS` board approbations | = US-032 |
| Z9 | `src/app/(dashboard)/dashboard/documents/page.tsx:18-84` | `MOCK_DOCUMENTS` fallback | = US-025/026 |
| Z10 | `src/components/transcriptions/TranscriptionResult.tsx:20-170` | `MOCK_SPEAKERS` fallback | = US-023 |
| Z11 | `src/components/dashboard/calendar-strip.tsx:52-76` | `MOCK_EVENTS` semaine courante | Moyenne |
| Z12 | `src/app/(dashboard)/dashboard/dashboard/page.tsx:141-163` | Lignes d'activité mock si 0 post (état vide non honnête) | Moyenne |
| Z13 | `src/app/(dashboard)/dashboard/video/page.tsx:48-64` | Pipeline vidéo 100 % statique | = US-036→040 |

## 4. Dettes de DOCUMENTATION env (`.env.example` désynchronisé)

**Consommées par le code mais absentes de .env.example** : `OPENAI_BASE_URL` (critique proxy),
`VISION_MODEL`, `LLM_TEXT_MODEL`, `SUPABASE_DB_POOLER_URL`.

**Documentées mais jamais consommées (fantômes)** : `CLOUDFLARE_R2_*` (×4), `AYRSHARE_API_KEY`,
`RESEND_API_KEY`/`EMAIL_FROM` (en attendant US-047), `STRIPE_PUBLISHABLE_KEY`,
`IMAGE_PROVIDER_PRIMARY` (ordre hardcodé dans `image-generation/index.ts`), `SENTRY_ORG/PROJECT/AUTH_TOKEN` (CI only).

**Fragilités** : doublon `FAL_KEY`/`FAL_API_KEY` (deux modules, deux noms — même valeur requise) ;
alias `GEMINI_API_KEY`/`GOOGLE_AI_API_KEY` (couvert par `??` dans le code, mais confusion possible).

---

## 5. Env prod posées (conteneur, noms + longueurs — vérité terrain)

ANTHROPIC_API_KEY(25→proxy) · ANTHROPIC_BASE_URL · APOLLO_API_KEY · CRAWL4AI_BASE_URL ·
EMAIL_FROM(orphelin) · FAL_API_KEY · FAL_KEY · GOOGLE_AI_API_KEY · IMAGE_PROVIDER_PRIMARY(non lue) ·
LEADS_ENRICHMENT_PROVIDER=hunter · LLM_TEXT_MODEL · MINIO_×5 · MOONSHOT_API_KEY ·
NEXT_PUBLIC_APP_URL · NEXT_PUBLIC_POSTHOG_HOST(sans clé!) · NEXT_PUBLIC_SUPABASE_ANON_KEY ·
NEXT_PUBLIC_SUPABASE_URL · OAUTH_TOKEN_ENCRYPTION_KEY · OPENAI_API_KEY(25→proxy) ·
OPENAI_BASE_URL · PERPLEXITY_API_KEY · STRIPE_RECONCILE_CRON_SECRET · SUPABASE_DB_PASSWORD ·
SUPABASE_DB_POOLER_URL · SUPABASE_DB_URL · SUPABASE_SERVICE_ROLE_KEY · VISION_MODEL

**Manquantes en prod (consommées par le code)** : REPLICATE_API_TOKEN, TOGETHER_API_KEY,
RUNWAY_API_KEY, KLING_API_KEY, LUMA_API_KEY, WHISPER_API_KEY, WHISPER_BASE_URL,
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_×4, TWITTER_CLIENT_ID/SECRET,
LINKEDIN_CLIENT_ID/SECRET, META_APP_ID/SECRET, PINTEREST_APP_ID/SECRET,
NEXT_PUBLIC_POSTHOG_KEY, SENTRY_DSN, NEXT_PUBLIC_SENTRY_DSN, OPENROUTER_API_KEY(opt), MISTRAL_API_KEY(opt).

---

## 6. Actions correctives

→ Voir `docs/API_REQUIREMENTS_AMINE.md` (provisioning par Amine) et
`docs/PRD_RAMI_FINITION_L99.md` (plan d'exécution code, Epic Z zéro-dette inclus).
