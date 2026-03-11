/**
 * Webhook Stripe — sync abonnements en base de données.
 * POST /api/webhooks/stripe
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/billing/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Plan } from '@/lib/billing/plans'

// Mapping Stripe status → subscription_status interne
function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':   return 'active'
    case 'past_due': return 'past_due'
    case 'canceled': return 'canceled'
    case 'unpaid':   return 'unpaid'
    case 'trialing': return 'trialing'
    default:         return 'inactive'
  }
}

// Mapping Price ID → Plan
function getPlanFromPriceId(priceId: string): Plan {
  const mapping: Record<string, Plan> = {
    [process.env.STRIPE_PRICE_SOLO        ?? '']: 'solo',
    [process.env.STRIPE_PRICE_PRO          ?? '']: 'pro',
    [process.env.STRIPE_PRICE_AGENCY       ?? '']: 'agency',
    [process.env.STRIPE_PRICE_AGENCY_PLUS  ?? '']: 'agency_plus',
  }
  return mapping[priceId] ?? 'free'
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const supabase = createAdminClient()

  const tenantId = subscription.metadata?.tenant_id
  if (!tenantId) {
    console.error('[Stripe webhook] tenant_id manquant dans les métadonnées de l\'abonnement', subscription.id)
    return
  }

  const priceId = subscription.items.data[0]?.price?.id ?? ''
  const plan = getPlanFromPriceId(priceId)
  const status = mapStripeStatus(subscription.status)

  // Si annulé → retour au plan free
  const effectivePlan: Plan = status === 'canceled' ? 'free' : plan

  const { error } = await supabase
    .from('tenants')
    .update({
      plan: effectivePlan,
      stripe_subscription_id: subscription.id,
      subscription_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tenantId)

  if (error) {
    console.error('[Stripe webhook] Erreur mise à jour tenant:', error)
    throw new Error(`Erreur DB: ${error.message}`)
  }

  console.info(`[Stripe webhook] Tenant ${tenantId} → plan ${effectivePlan} (${status})`)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const supabase = createAdminClient()

  const tenantId = session.metadata?.tenant_id
  if (!tenantId) return

  // Récupérer l'abonnement créé
  if (session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      typeof session.subscription === 'string' ? session.subscription : session.subscription.id
    )
    await syncSubscription(subscription)
  }

  // Mettre à jour le stripe_customer_id si besoin
  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id

  if (customerId) {
    await supabase
      .from('tenants')
      .update({ stripe_customer_id: customerId })
      .eq('id', tenantId)
  }
}

export async function POST(request: NextRequest) {
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'STRIPE_WEBHOOK_SECRET non configuré' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const sig  = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide'
    console.error('[Stripe webhook] Signature invalide:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed': {
        // Accès au subscription ID via la propriété parente
        const invoiceObj = event.data.object as Stripe.Invoice & {
          subscription?: string | { id: string } | null
        }
        const rawSub = invoiceObj.subscription
        const subscriptionId = typeof rawSub === 'string'
          ? rawSub
          : (rawSub as { id: string } | null | undefined)?.id
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          await syncSubscription(subscription)
        }
        break
      }

      default:
        // Événement non géré — ignorer
        break
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue'
    console.error('[Stripe webhook] Erreur traitement:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
