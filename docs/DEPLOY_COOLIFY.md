# RAMI — Déploiement Coolify (serveur Ubuntu self-hosted)

> Remplace l'ancienne procédure Vercel. Hébergement : **Coolify** sur serveur Ubuntu,
> exposition publique via **cloudflared tunnel**, **Supabase auto-hébergé** sur le même serveur.

---

## Architecture cible

```
Internet
   │  HTTPS (TLS terminé par Cloudflare)
   ▼
Cloudflare  ──►  cloudflared tunnel "nahda" (~/.cloudflared/config-nahda.yml)
   │
   ├─►  rami.ai-mpower.com  → coolify-proxy (Traefik)  localhost:80  ──► conteneur RAMI :3000
   └─►  db.ai-mpower.com    → Supabase Kong            localhost:8200 → :8000  (PARTAGÉ)

Réseau Docker (serveur Ubuntu) :
   coolify-proxy (Traefik :80/:443) route par hostname vers les apps Coolify
   Supabase self-hosted PARTAGÉ : supabase-kong, supabase-db:5432, supabase-pooler:6543,
     supabase-auth / storage / rest / realtime / edge-functions
   app RAMI ──► supabase-db / pooler  +  MinIO (assets privés)
```

L'app n'est **jamais** exposée en direct : seul cloudflared publie les domaines (via le
reverse-proxy Traefik de Coolify sur :80). Cela masque l'IP du serveur et mutualise le TLS.
Supabase est une **instance unique partagée** entre les builders AI-MPower (URL `db.ai-mpower.com`).

---

## 1. Prérequis serveur

- Coolify installé et fonctionnel (cf. skill `coolify-manager`).
- Supabase self-hosted déployé (stack `supabase` : db, kong, auth, storage, rest, realtime,
  edge-functions). Noter le nom du service Postgres dans le réseau Docker (ex. `supabase-db`).
- `cloudflared` installé (service systemd `cloudflared-nahda`, config `~/.cloudflared/config-nahda.yml`).
  Supabase est **déjà** routé (`db.ai-mpower.com → localhost:8200`). Il reste à **ajouter RAMI** :
  ```yaml
  # ~/.cloudflared/config-nahda.yml  → bloc ingress, AVANT le catch-all "http_status:404"
    - hostname: rami.ai-mpower.com
      service: http://localhost:80      # coolify-proxy (Traefik) route ensuite par domaine
  ```
  Puis : DNS Cloudflare `rami.ai-mpower.com` CNAME → `<tunnel-id>.cfargotunnel.com` (proxied),
  `cloudflared tunnel ingress validate`, et `sudo systemctl restart cloudflared-nahda`.
  Dans Coolify, configurer le domaine de l'app RAMI sur `https://rami.ai-mpower.com`.
- Accès SSH au serveur (cf. directives globales : `ssh -i ~/.ssh/serveurai_mnemo serveurai@<IP>`).

---

## 2. Créer l'application dans Coolify

1. **New Resource → Application → Public/Private Git Repository** → pointer sur le repo RAMI,
   branche `main`.
2. **Build Pack : Dockerfile** (le `Dockerfile` à la racine est détecté automatiquement).
3. **Port exposé : 3000**.
4. **Network** : rattacher l'app au même réseau Docker que la stack Supabase (pour résoudre
   `supabase-db`, `kong`, MinIO par nom de service).
5. **Health Check** : `GET /api/health` (le Dockerfile déclare déjà un `HEALTHCHECK`).

---

## 3. Variables d'environnement (Coolify → Application → Environment Variables)

Renseigner **toutes** les variables du `.env.example`. Points critiques :

| Variable | Note |
|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://supabase.rami.ai-mpower.com` — **cocher « Available at buildtime »** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | depuis le `.env` Supabase self-hosted — **buildtime** |
| `NEXT_PUBLIC_APP_URL` | `https://rami.ai-mpower.com` — **buildtime** |
| `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | **buildtime** |
| `SUPABASE_SERVICE_ROLE_KEY` | runtime, jamais exposé |
| `SUPABASE_DB_URL` / `SUPABASE_DB_POOLER_URL` | `postgresql://postgres:<pwd>@supabase-db:5432/postgres` (nom de service interne) |
| `OAUTH_TOKEN_ENCRYPTION_KEY` | `openssl rand -hex 32` |
| `STRIPE_*` + `STRIPE_PRICE_*` | clés **live** + Price IDs live |
| `STRIPE_RECONCILE_CRON_SECRET` | `openssl rand -hex 32` |
| `MINIO_*` | endpoint du MinIO self-hosté |

> ⚠️ Les `NEXT_PUBLIC_*` sont **inlinées au build**. Si elles ne sont pas marquées
> « Available at buildtime », l'app buildée pointera vers des valeurs vides. Le `Dockerfile`
> déclare les `ARG` correspondants.

---

## 4. Migrations Supabase (avant le premier déploiement)

Appliquer les 34 migrations sur le Postgres self-hosted, **dans l'ordre** :

```bash
# Via SSH sur le serveur, en pipant les fichiers dans psql du conteneur Postgres
ssh -i ~/.ssh/serveurai_mnemo serveurai@<IP>
for f in $(ls -1 supabase/migrations/*.sql | sort); do
  echo ">> $f"
  docker exec -i supabase-db psql -U postgres -d postgres < "$f" || break
done
```

Puis **vérifier que la RLS est active sur toutes les tables** :

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname='public' AND rowsecurity=false;
-- Doit retourner 0 ligne (sauf table système rate_limits, volontairement sans RLS).
```

Déployer aussi les Edge Functions Supabase (`stripe-reconcile`, etc.) :
`supabase functions deploy` (ou copie manuelle dans le conteneur edge-functions).

---

## 5. Déclencher le déploiement

- **Auto-deploy** (recommandé) : activer « Auto Deploy » sur la branche `main` dans Coolify.
  Chaque push → build Docker + redéploiement.
- **Manuel** : `npm run deploy` (nécessite `COOLIFY_DEPLOY_WEBHOOK`) ou bouton « Deploy » Coolify.
- **CI GitHub** : le job `deploy` de `.github/workflows/ci.yml` appelle le webhook
  `COOLIFY_DEPLOY_WEBHOOK` (secret GitHub) puis lance les smoke tests sur `vars.PRODUCTION_URL`.

---

## 6. Tâche planifiée — réconciliation Stripe (remplace le cron Vercel)

Coolify → Application RAMI → **Scheduled Tasks → New** :

- **Command** : `/app/scripts/cron-stripe-reconcile.sh`
- **Frequency** : `0 2 * * *` (quotidien, 02h00 UTC)
- **Container** : conteneur de l'app RAMI

Le script appelle `GET /api/cron/stripe-reconcile` avec le `STRIPE_RECONCILE_CRON_SECRET`.

---

## 7. pg-boss (worker de publication)

`src/instrumentation.ts` démarre pg-boss au boot du serveur Next. En standalone self-hosted,
**aucun worker séparé n'est nécessaire** (contrairement à Vercel où le serverless l'interdisait) :
le conteneur app long-running héberge le worker. S'assurer que `SUPABASE_DB_URL` est joignable
depuis le conteneur.

---

## 8. Webhook Stripe

Stripe Dashboard → Developers → Webhooks → endpoint :
`https://rami.ai-mpower.com/api/webhooks/stripe` → événements abonnement/paiement.
Récupérer le `STRIPE_WEBHOOK_SECRET` (live) et le mettre dans l'env Coolify.

---

## 9. Checklist post-déploiement

```
[ ] https://rami.ai-mpower.com/api/health  → 200 OK
[ ] Login / signup fonctionnels (Supabase Auth self-hosted)
[ ] Upload logo Brand DNA → MinIO OK
[ ] Génération visuelle (Fal.ai) → image rendue (CSP autorise le CDN)
[ ] Création post + scheduling → pg-boss prend le job
[ ] Webhook Stripe → événement test reçu (200)
[ ] Tâche planifiée Stripe reconcile → exécution manuelle OK
[ ] Sentry reçoit les erreurs ; PostHog reçoit les events
[ ] RLS : un tenant A ne voit pas les données du tenant B
```

---

## Rollback

Coolify conserve l'historique des déploiements : **Application → Deployments → Redeploy** sur
un build antérieur. Pour la DB, restaurer un dump Postgres :
`docker exec -i supabase-db psql -U postgres -d postgres < backup.sql`.
