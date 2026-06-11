'use server'

import { createClient } from '@/lib/supabase/server'
import { stripe } from './stripe'
import { STRIPE_PRICE_IDS, type Plan } from './plans'
import { headers } from 'next/headers'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'

/**
 * Crée ou récupère le customer Stripe pour le tenant courant.
 */
async function getOrCreateStripeCustomer(
  tenantId: string,
  tenantName: string,
  userEmail: string,
  currentStripeCustomerId: string | null
): Promise<string> {
  if (currentStripeCustomerId) return currentStripeCustomerId

  const customer = await stripe.customers.create({
    email: userEmail,
    name: tenantName,
    metadata: { tenant_id: tenantId },
  })

  const supabase = await createClient()
  await supabase
    .from('tenants')
    .update({ stripe_customer_id: customer.id })
    .eq('id', tenantId)

  return customer.id
}

/**
 * Crée une Checkout Session Stripe.
 * Retourne l'URL de redirection.
 */
export async function createCheckoutSessionAction(
  plan: Plan
): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { url: null, error: 'Non authentifié' }

  const tenantId = await resolveUserTenant(supabase, user.id)
  if (!tenantId) return { url: null, error: 'Tenant introuvable' }

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, stripe_customer_id, plan')
    .eq('id', tenantId)
    .single<{ id: string; name: string; stripe_customer_id: string | null; plan: string }>()

  if (!tenant) return { url: null, error: 'Tenant introuvable' }

  const priceId = STRIPE_PRICE_IDS[plan]
  if (!priceId) return { url: null, error: `Plan ${plan} non disponible` }

  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const customerId = await getOrCreateStripeCustomer(
    tenant.id,
    tenant.name,
    user.email ?? '',
    tenant.stripe_customer_id
  )

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/billing?success=1&plan=${plan}`,
    cancel_url:  `${origin}/pricing?canceled=1`,
    metadata: {
      tenant_id: tenant.id,
      plan,
    },
    subscription_data: {
      metadata: { tenant_id: tenant.id, plan },
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
  })

  return { url: session.url }
}

/**
 * Crée une session Portail Client Stripe.
 */
export async function createBillingPortalAction(): Promise<{ url: string | null; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { url: null, error: 'Non authentifié' }

  const tenantId2 = await resolveUserTenant(supabase, user.id)
  const { data: tenant } = !tenantId2 ? { data: null } : await supabase
    .from('tenants')
    .select('id, stripe_customer_id')
    .eq('id', tenantId2)
    .single<{ id: string; stripe_customer_id: string | null }>()

  if (!tenant?.stripe_customer_id) {
    return { url: null, error: "Aucun abonnement actif. Souscrivez d'abord à un plan payant." }
  }

  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripe_customer_id,
    return_url: `${origin}/billing`,
  })

  return { url: session.url }
}

/**
 * Récupère les données de facturation du tenant courant.
 */
export async function getBillingDataAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const tenantId3 = await resolveUserTenant(supabase, user.id)
  const { data: tenant } = !tenantId3 ? { data: null } : await supabase
    .from('tenants')
    .select('id, name, plan, stripe_customer_id, stripe_subscription_id, subscription_status, generation_count, generation_reset_at')
    .eq('id', tenantId3)
    .single<{
      id: string
      name: string
      plan: string
      stripe_customer_id: string | null
      stripe_subscription_id: string | null
      subscription_status: string | null
      generation_count: number
      generation_reset_at: string | null
    }>()

  if (!tenant) return null

  // Récupérer les dernières factures Stripe si customer_id existe
  let invoices: Array<{
    id: string
    number: string | null
    amount: number
    currency: string
    status: string | null
    date: number
    pdf: string | null
  }> = []

  if (tenant.stripe_customer_id) {
    try {
      const stripeInvoices = await stripe.invoices.list({
        customer: tenant.stripe_customer_id,
        limit: 10,
      })

      invoices = stripeInvoices.data.map(inv => ({
        id: inv.id,
        number: inv.number ?? null,
        amount: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        status: inv.status ?? null,
        date: inv.created,
        pdf: inv.invoice_pdf ?? null,
      }))
    } catch {
      // Stripe non configuré ou pas de factures — on continue
    }
  }

  return { tenant, invoices }
}
