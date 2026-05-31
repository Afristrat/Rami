#!/usr/bin/env sh
# ============================================================
# RAMI — Tâche planifiée Coolify : réconciliation Stripe quotidienne
# Remplace le cron Vercel (vercel.json supprimé).
#
# Configuration dans Coolify :
#   Application RAMI → Scheduled Tasks → New
#     Command   : /app/scripts/cron-stripe-reconcile.sh
#                 (ou directement la ligne curl ci-dessous)
#     Frequency : 0 2 * * *        (tous les jours à 02h00 UTC)
#     Container  : le conteneur de l'app RAMI
#
# Variables requises (déjà dans l'env de l'app) :
#   NEXT_PUBLIC_APP_URL, STRIPE_RECONCILE_CRON_SECRET
# ============================================================
set -eu

: "${NEXT_PUBLIC_APP_URL:?NEXT_PUBLIC_APP_URL manquant}"
: "${STRIPE_RECONCILE_CRON_SECRET:?STRIPE_RECONCILE_CRON_SECRET manquant}"

curl -fsS \
  -H "Authorization: Bearer ${STRIPE_RECONCILE_CRON_SECRET}" \
  "${NEXT_PUBLIC_APP_URL%/}/api/cron/stripe-reconcile"
