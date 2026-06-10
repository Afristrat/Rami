# REQUIREMENTS API — Provisioning Amine (2026-06-10)

> Liste exhaustive et priorisée de ce qu'Amine doit produire (clés, apps développeur,
> routes proxy) pour que RAMI soit 100 % fonctionnel. Chaque item indique : quoi créer,
> où, quelle variable poser, et quelles US ça débloque.
>
> **Convention** : toutes les variables se posent dans **Coolify → app `rami` → Environment
> Variables** (cocher *Available at buildtime* UNIQUEMENT pour les `NEXT_PUBLIC_*`),
> puis **Redeploy**. Doubler chaque secret dans le coffre DPAPI local.

---

## P0 — Débloque des modules entiers (à faire en premier)

### 1. Route `whisper-1` sur le proxy LiteLLM ⭐ (débloque US-022 → 023 → 024, chaîne Transcription)
**Option A (recommandée — cohérente avec ta stratégie proxy)** : ajouter sur `proxy.ai-mpower.com`
un déploiement LiteLLM :
```yaml
- model_name: whisper-1
  litellm_params:
    model: openai/whisper-1
    api_key: <vraie clé OpenAI api.openai.com>
```
puis autoriser `whisper-1` pour la clé virtuelle `rami-app`.
Variables Coolify : `WHISPER_BASE_URL=https://proxy.ai-mpower.com/v1` (la clé existante `OPENAI_API_KEY` suffira).
**Option B** : poser directement `WHISPER_API_KEY=<sk-... OpenAI réelle>` (le défaut
`WHISPER_BASE_URL=https://api.openai.com/v1` s'applique).
> Limite Whisper API : 25 Mo/fichier. Coût ≈ $0.006/min.

### 2. Stripe LIVE (débloque US-018, US-019, et la page invoices réelle Z5)
Dans le dashboard Stripe (compte existant), en mode **live** :
1. Créer 4 produits récurrents mensuels : Solo $59 · Pro $149 · Agency $399 · Agency+ $699
2. Récupérer les 4 Price IDs (`price_...`)
3. Créer le webhook endpoint : `https://rami.ai-mpower.com/api/webhooks/stripe`
   (événements : `checkout.session.completed`, `customer.subscription.*`, `invoice.*`)
   → récupérer `whsec_...`
Variables : `STRIPE_SECRET_KEY=sk_live_...`, `STRIPE_WEBHOOK_SECRET=whsec_...`,
`STRIPE_PRICE_SOLO`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_AGENCY`, `STRIPE_PRICE_AGENCY_PLUS`.

### 3. Apps développeur OAuth réseaux sociaux ⭐⭐ (LE plus gros manque — le publishing
est 100 % codé mais MORT : 0 connexion sociale possible en prod)
Redirect URI commun : `https://rami.ai-mpower.com/api/oauth/<platform>/callback`

| Plateforme | Où créer | Scopes à demander | Variables Coolify |
|---|---|---|---|
| **X (Twitter)** | developer.twitter.com → app OAuth 2.0 (type Web App, PKCE) | `tweet.read tweet.write users.read offline.access` | `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET` |
| **LinkedIn** | linkedin.com/developers → app + produit « Share on LinkedIn » + « Sign In w/ LinkedIn (OpenID) » | `openid profile email w_member_social` (+ « Community Management API » si pages entreprises → `w_organization_social rw_organization_admin`) | `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET` |
| **Meta (FB+IG)** | developers.facebook.com → app Business, Graph v21 | `pages_show_list pages_manage_posts pages_read_engagement instagram_basic instagram_content_publish business_management` | `META_APP_ID`, `META_APP_SECRET` |
| **Pinterest** | developers.pinterest.com → app (trial access suffit pour démarrer) | `boards:read pins:read pins:write user_accounts:read` | `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET` |

> Notes terrain (héritées de l'analyse Social Engine Pro) :
> - LinkedIn : tokens 60 j sans refresh → l'app devra notifier à J-7 (déjà prévu PRD).
> - Instagram : exige une **URL d'image publique** → MinIO public URL déjà câblée ✓.
> - Meta : l'app démarre en mode Development (testeurs seulement) → prévoir App Review
>   pour la prod multi-clients ; en attendant, ton compte + comptes testeurs suffisent.

---

## P1 — Fiabilise l'existant (résilience + observabilité)

### 4. Fallbacks image (chaînes 4-5 actuellement mortes)
- `REPLICATE_API_TOKEN=r8_...` → replicate.com/account/api-tokens
- `TOGETHER_API_KEY=...` → api.together.xyz/settings/api-keys (FLUX schnell Free = $0)

### 5. Monitoring (actuellement ÉTEINT en prod)
- Sentry : créer projet Next.js sur sentry.io → `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN`
  (même DSN, la 2ᵉ en buildtime) — débloque aussi US-035 (alertes).
- PostHog : récupérer la clé projet → `NEXT_PUBLIC_POSTHOG_KEY=phc_...` (buildtime).
  (`NEXT_PUBLIC_POSTHOG_HOST` déjà posée.)

### 6. Resend (emails transactionnels — US-047/048/049)
resend.com → vérifier le domaine `ai-mpower.com` (DNS SPF/DKIM) → `RESEND_API_KEY=re_...`
(`EMAIL_FROM=rami@ai-mpower.com` déjà posée). Tier gratuit 100 mails/jour OK pour démarrer.

---

## P2 — Nouveaux modules (décisions produit incluses)

### 7. TTS voix-off (US-037) — DÉCISION REQUISE
Recommandation : **ElevenLabs** (qualité multilingue ar/fr/darija via `eleven_v3`/multilingual).
Option proxy-first : router `tts-1` (OpenAI) via LiteLLM comme pour whisper.
→ `ELEVENLABS_API_KEY` (ou route proxy + modèle TTS au choix).

### 8. Vidéo (US-039) — facultatif au départ
Veo (déjà couvert par `GOOGLE_AI_API_KEY` ✓) + Wan via Fal (✓) suffisent pour lancer.
Si tu veux les chaînes complètes : `RUNWAY_API_KEY`, `KLING_API_KEY`, `LUMA_API_KEY`.

### 9. Plateformes sociales V2 (US-044/045/046)
- **YouTube** : console.cloud.google.com → OAuth client (YouTube Data API v3, scope
  `youtube.upload`) → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- **Mastodon** : créer l'app sur l'instance choisie → `MASTODON_INSTANCE_URL`,
  `MASTODON_CLIENT_ID`, `MASTODON_CLIENT_SECRET`
- **TikTok** : developers.tiktok.com → demander l'accès **Content Posting API**
  (validation TikTok requise, délai) → vars à définir à l'implémentation

---

## Récapitulatif variables à poser (checklist Coolify)

```
# P0
WHISPER_BASE_URL=https://proxy.ai-mpower.com/v1        # (option A) ou WHISPER_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SOLO=price_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_AGENCY=price_...
STRIPE_PRICE_AGENCY_PLUS=price_...
TWITTER_CLIENT_ID=... / TWITTER_CLIENT_SECRET=...
LINKEDIN_CLIENT_ID=... / LINKEDIN_CLIENT_SECRET=...
META_APP_ID=... / META_APP_SECRET=...
PINTEREST_APP_ID=... / PINTEREST_APP_SECRET=...
# P1
REPLICATE_API_TOKEN=r8_...
TOGETHER_API_KEY=...
SENTRY_DSN=... / NEXT_PUBLIC_SENTRY_DSN=...            # buildtime pour la 2e
NEXT_PUBLIC_POSTHOG_KEY=phc_...                        # buildtime
RESEND_API_KEY=re_...
# P2 (selon décisions)
ELEVENLABS_API_KEY=...                                  # ou route TTS proxy
RUNWAY_API_KEY=... / KLING_API_KEY=... / LUMA_API_KEY=...
GOOGLE_CLIENT_ID=... / GOOGLE_CLIENT_SECRET=...
MASTODON_INSTANCE_URL=... / MASTODON_CLIENT_ID=... / MASTODON_CLIENT_SECRET=...
```

> ⚠️ Après ajout de variables `NEXT_PUBLIC_*` : **rebuild obligatoire** (injectées au build).
> Pour les autres : restart suffit. Toujours passer par Coolify (jamais de secret dans le chat).
