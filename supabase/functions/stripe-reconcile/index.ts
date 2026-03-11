/**
 * Supabase Edge Function — Réconciliation quotidienne Stripe
 *
 * Cette fonction synchronise l'état des abonnements Stripe avec la base de données.
 * Elle est conçue pour être appelée via un cron Supabase ou manuellement.
 *
 * Cas couverts :
 * - Webhooks manqués (paiement échoué non reçu)
 * - Abonnements annulés non synchronisés
 * - Remise à zéro des compteurs mensuels (si generation_reset_at dépassé)
 *
 * Déclencheur : POST /functions/v1/stripe-reconcile
 * Auth : Bearer SUPABASE_SERVICE_ROLE_KEY ou cron interne
 *
 * Déploiement :
 *   supabase functions deploy stripe-reconcile
 * Cron (via Supabase Dashboard → Cron) :
 *   0 2 * * * → tous les jours à 2h00 UTC
 */

import Stripe from 'npm:stripe@20.4.1'
import { createClient } from 'npm:@supabase/supabase-js@2'

const PLAN_FROM_PRICE: Record<string, string> = {
  // À remplir avec les vrais Price IDs Stripe
  [Deno.env.get('STRIPE_PRICE_SOLO')         ?? '']: 'solo',
  [Deno.env.get('STRIPE_PRICE_PRO')           ?? '']: 'pro',
  [Deno.env.get('STRIPE_PRICE_AGENCY')        ?? '']: 'agency',
  [Deno.env.get('STRIPE_PRICE_AGENCY_PLUS')   ?? '']: 'agency_plus',
}

function mapStripeStatus(status: string): string {
  const mapping: Record<string, string> = {
    active:    'active',
    past_due:  'past_due',
    canceled:  'canceled',
    unpaid:    'unpaid',
    trialing:  'trialing',
  }
  return mapping[status] ?? 'inactive'
}

Deno.serve(async (req: Request) => {
  // Vérifier la méthode
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  // Vérification auth — cron interne ou service role
  const authHeader = req.headers.get('Authorization')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const cronSecret = Deno.env.get('STRIPE_RECONCILE_CRON_SECRET') ?? ''

  const isAuthorized =
    authHeader === `Bearer ${serviceKey}` ||
    authHeader === `Bearer ${cronSecret}`

  if (!isAuthorized) {
    return new Response('Unauthorized', { status: 401 })
  }

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    return new Response('STRIPE_SECRET_KEY manquant', { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    serviceKey,
    { auth: { persistSession: false } }
  )

  const results = {
    subscriptions_checked: 0,
    tenants_updated: 0,
    quotas_reset: 0,
    errors: [] as string[],
  }

  try {
    // ── 1. Récupérer tous les tenants avec un stripe_subscription_id ──────────
    const { data: tenants, error: dbError } = await supabase
      .from('tenants')
      .select('id, plan, stripe_subscription_id, subscription_status, generation_count, generation_reset_at')
      .not('stripe_subscription_id', 'is', null)

    if (dbError) throw new Error(`DB error: ${dbError.message}`)

    for (const tenant of tenants ?? []) {
      results.subscriptions_checked++

      try {
        // ── 2. Vérifier l'abonnement Stripe ────────────────────────────────────
        const subscription = await stripe.subscriptions.retrieve(tenant.stripe_subscription_id)

        const priceId = subscription.items.data[0]?.price?.id ?? ''
        const stripePlan = PLAN_FROM_PRICE[priceId] ?? 'free'
        const stripeStatus = mapStripeStatus(subscription.status)

        // Détecter si la DB est désynchronisée
        const planMismatch   = tenant.plan !== stripePlan && stripeStatus === 'active'
        const statusMismatch = tenant.subscription_status !== stripeStatus

        if (planMismatch || statusMismatch) {
          const updates: Record<string, string> = {
            plan: stripeStatus === 'canceled' ? 'free' : stripePlan,
            subscription_status: stripeStatus,
            updated_at: new Date().toISOString(),
          }

          await supabase
            .from('tenants')
            .update(updates)
            .eq('id', tenant.id)

          results.tenants_updated++
          console.log(`[Reconcile] Tenant ${tenant.id}: ${tenant.plan} → ${updates.plan} (${stripeStatus})`)
        }
      } catch (err) {
        // Abonnement Stripe introuvable ou supprimé
        const message = err instanceof Error ? err.message : String(err)

        if (message.includes('No such subscription')) {
          // Downgrade vers free
          await supabase
            .from('tenants')
            .update({
              plan: 'free',
              stripe_subscription_id: null,
              subscription_status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('id', tenant.id)

          results.tenants_updated++
          console.log(`[Reconcile] Tenant ${tenant.id}: abonnement Stripe introuvable → downgrade free`)
        } else {
          results.errors.push(`Tenant ${tenant.id}: ${message}`)
        }
      }
    }

    // ── 3. Réinitialiser les compteurs mensuels expirés ───────────────────────
    const { data: resetNeeded, error: resetError } = await supabase
      .from('tenants')
      .select('id, generation_count')
      .lt('generation_reset_at', new Date().toISOString())
      .gt('generation_count', 0)

    if (!resetError && resetNeeded) {
      for (const tenant of resetNeeded) {
        await supabase
          .from('tenants')
          .update({
            generation_count: 0,
            generation_reset_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenant.id)

        results.quotas_reset++
      }

      console.log(`[Reconcile] ${results.quotas_reset} quotas mensuels réinitialisés`)
    }

    return new Response(JSON.stringify({
      ok: true,
      ...results,
      timestamp: new Date().toISOString(),
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Reconcile] Erreur fatale:', message)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
