/**
 * Client Stripe côté serveur.
 * Ne jamais importer ce fichier côté client.
 *
 * Lazy initialization : l'instance n'est créée qu'au premier appel effectif,
 * ce qui évite l'échec au build-time SSG (next build) quand STRIPE_SECRET_KEY
 * est absent de l'environnement de build.
 */

import Stripe from 'stripe'

let _stripe: Stripe | null = null

function getStripeInstance(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY manquant dans les variables d\'environnement')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    const instance = getStripeInstance()
    const value = Reflect.get(instance as unknown as Record<string | symbol, unknown>, prop)
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(instance)
      : value
  },
})

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''
