# RAMI — Deploy Checklist

## Pre-deploy
- [ ] `npm run lint` — zéro erreur
- [ ] `npm run typecheck` — zéro erreur TypeScript
- [ ] `npm audit --audit-level=critical` — zéro vulnérabilité critique
- [ ] `npm test` — tous les tests unitaires passent
- [ ] Variables d'environnement vérifiées (voir .env.example)

## Supabase
- [ ] Migrations appliquées sur staging: `supabase db push --db-url $STAGING_DB_URL`
- [ ] RLS policies vérifiées sur toutes les tables
- [ ] Backup de la DB production créé avant migration
- [ ] Migrations appliquées en production: `supabase db push --db-url $PROD_DB_URL`

## Vercel (Frontend)
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Build de production réussi: `npm run build`
- [ ] Deploy: `vercel deploy --prod`
- [ ] DNS rami.ai-mpower.com → Vercel

## Railway (Workers + MinIO)
- [ ] Variables d'environnement configurées sur Railway
- [ ] MinIO bucket `rami-assets` créé
- [ ] pg-boss worker démarré

## Monitoring
- [ ] Sentry DSN configuré et actif
- [ ] PostHog key configuré
- [ ] Stripe webhook secret configuré
- [ ] Alertes Sentry configurées (error rate > 1%)

## Post-deploy
- [ ] Smoke test: login → dashboard → create visual → publish
- [ ] Vérifier les webhooks Stripe
- [ ] Vérifier Sentry reçoit les erreurs (trigger un test error)
- [ ] Vérifier PostHog reçoit les events
- [ ] Surveiller pendant 24h
