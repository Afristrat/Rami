/**
 * Définition des plans RAMI — source de vérité unique.
 * Feature flags vérifiés CÔTÉ SERVEUR uniquement.
 */

export type Plan = 'free' | 'solo' | 'pro' | 'agency' | 'agency_plus' | 'enterprise'

export type Feature =
  | 'social_workflow'
  | 'visual_engine'
  | 'visual_engine_no_watermark'
  | 'performance_loop'
  | 'transcription'
  | 'document_engine'
  | 'lead_gen'
  | 'billing_module'
  | 'white_label'
  | 'api_publique'
  | 'client_portal'

// Plans Stripe (Price IDs à configurer dans Stripe Dashboard)
export const STRIPE_PRICE_IDS: Partial<Record<Plan, string>> = {
  solo:        process.env.STRIPE_PRICE_SOLO        ?? '',
  pro:         process.env.STRIPE_PRICE_PRO          ?? '',
  agency:      process.env.STRIPE_PRICE_AGENCY       ?? '',
  agency_plus: process.env.STRIPE_PRICE_AGENCY_PLUS  ?? '',
}

// Feature flags par plan
const PLAN_FEATURES: Record<Plan, Set<Feature>> = {
  free: new Set<Feature>([
    'social_workflow',
    'visual_engine',
  ]),
  solo: new Set<Feature>([
    'social_workflow',
    'visual_engine',
    'visual_engine_no_watermark',
  ]),
  pro: new Set<Feature>([
    'social_workflow',
    'visual_engine',
    'visual_engine_no_watermark',
    'performance_loop',
    'transcription',
  ]),
  agency: new Set<Feature>([
    'social_workflow',
    'visual_engine',
    'visual_engine_no_watermark',
    'performance_loop',
    'transcription',
    'document_engine',
    'lead_gen',
    'billing_module',
  ]),
  agency_plus: new Set<Feature>([
    'social_workflow',
    'visual_engine',
    'visual_engine_no_watermark',
    'performance_loop',
    'transcription',
    'document_engine',
    'lead_gen',
    'billing_module',
    'white_label',
    'api_publique',
    'client_portal',
  ]),
  enterprise: new Set<Feature>([
    'social_workflow',
    'visual_engine',
    'visual_engine_no_watermark',
    'performance_loop',
    'transcription',
    'document_engine',
    'lead_gen',
    'billing_module',
    'white_label',
    'api_publique',
    'client_portal',
  ]),
}

// Quotas de générations par mois (-1 = illimité)
export const PLAN_GENERATION_QUOTAS: Record<Plan, number> = {
  free:        10,
  solo:        150,
  pro:         500,
  agency:      2000,
  agency_plus: -1,
  enterprise:  -1,
}

// Quotas de tenants/marques (-1 = illimité)
export const PLAN_TENANT_QUOTAS: Record<Plan, number> = {
  free:        1,
  solo:        3,
  pro:         10,
  agency:      -1,
  agency_plus: -1,
  enterprise:  -1,
}

export interface PlanConfig {
  id: Plan
  name: string
  price: number            // USD/mois
  priceLabel: string
  description: string
  highlights: string[]
  features: Feature[]
  generationsPerMonth: number
  tenantsAllowed: number
  popular?: boolean
  contactSales?: boolean
}

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceLabel: '$0',
    description: 'Pour découvrir RAMI sans engagement.',
    highlights: [
      '1 marque',
      '10 générations / mois',
      'Visuels avec watermark',
      'Workflow Social',
    ],
    features: ['social_workflow', 'visual_engine'],
    generationsPerMonth: 10,
    tenantsAllowed: 1,
  },
  {
    id: 'solo',
    name: 'Solo',
    price: 59,
    priceLabel: '$59',
    description: 'Pour les solo-préneurs et freelances.',
    highlights: [
      '3 marques',
      '150 générations / mois',
      'Sans watermark + export ZIP',
      'Workflow Social complet',
    ],
    features: ['social_workflow', 'visual_engine', 'visual_engine_no_watermark'],
    generationsPerMonth: 150,
    tenantsAllowed: 3,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 149,
    priceLabel: '$149',
    description: 'Pour les consultants marketing B2B.',
    highlights: [
      '10 marques',
      '500 générations / mois',
      'Transcription réunions',
      'Analytics & Performance Loop',
    ],
    features: ['social_workflow', 'visual_engine', 'visual_engine_no_watermark', 'performance_loop', 'transcription'],
    generationsPerMonth: 500,
    tenantsAllowed: 10,
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 399,
    priceLabel: '$399',
    description: 'Pour les agences digitales en croissance.',
    highlights: [
      'Marques illimitées',
      '2 000 générations / mois',
      'Document Engine + Lead Gen',
      'Module facturation clients',
    ],
    features: [
      'social_workflow', 'visual_engine', 'visual_engine_no_watermark',
      'performance_loop', 'transcription', 'document_engine', 'lead_gen', 'billing_module',
    ],
    generationsPerMonth: 2000,
    tenantsAllowed: -1,
  },
  {
    id: 'agency_plus',
    name: 'Agency+',
    price: 699,
    priceLabel: '$699',
    description: 'Pour les grandes agences et équipes internes.',
    highlights: [
      'Marques illimitées',
      'Générations illimitées',
      'White-label + API publique',
      'Portail client dédié',
    ],
    features: [
      'social_workflow', 'visual_engine', 'visual_engine_no_watermark',
      'performance_loop', 'transcription', 'document_engine', 'lead_gen', 'billing_module',
      'white_label', 'api_publique', 'client_portal',
    ],
    generationsPerMonth: -1,
    tenantsAllowed: -1,
  },
]

/**
 * Vérifie si un plan a accès à une feature.
 * À utiliser CÔTÉ SERVEUR uniquement.
 */
export function hasFeatureAccess(plan: Plan, feature: Feature): boolean {
  return PLAN_FEATURES[plan]?.has(feature) ?? false
}

/**
 * Vérifie si un tenant a dépassé son quota de générations.
 */
export function isGenerationQuotaExceeded(plan: Plan, generationCount: number): boolean {
  const quota = PLAN_GENERATION_QUOTAS[plan]
  if (quota === -1) return false
  return generationCount >= quota
}

/**
 * Retourne le plan suivant (upgrade).
 */
export function getNextPlan(current: Plan): Plan | null {
  const order: Plan[] = ['free', 'solo', 'pro', 'agency', 'agency_plus']
  const idx = order.indexOf(current)
  if (idx === -1 || idx >= order.length - 1) return null
  return order[idx + 1]
}

/**
 * Retourne la config d'un plan par ID.
 */
export function getPlanConfig(plan: Plan): PlanConfig {
  return PLANS.find(p => p.id === plan) ?? PLANS[0]
}
