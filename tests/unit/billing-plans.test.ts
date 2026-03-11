import {
  hasFeatureAccess,
  isGenerationQuotaExceeded,
  getNextPlan,
  getPlanConfig,
  PLANS,
  PLAN_GENERATION_QUOTAS,
  PLAN_TENANT_QUOTAS,
} from '@/lib/billing/plans'
import type { Plan, Feature } from '@/lib/billing/plans'

// ── hasFeatureAccess ─────────────────────────────────────────────────────────

describe('hasFeatureAccess', () => {
  // Plan Free
  test('free : accès social_workflow', () => {
    expect(hasFeatureAccess('free', 'social_workflow')).toBe(true)
  })

  test('free : accès visual_engine (avec watermark)', () => {
    expect(hasFeatureAccess('free', 'visual_engine')).toBe(true)
  })

  test('free : pas de visual_engine_no_watermark', () => {
    expect(hasFeatureAccess('free', 'visual_engine_no_watermark')).toBe(false)
  })

  test('free : pas de performance_loop', () => {
    expect(hasFeatureAccess('free', 'performance_loop')).toBe(false)
  })

  test('free : pas de billing_module', () => {
    expect(hasFeatureAccess('free', 'billing_module')).toBe(false)
  })

  test('free : pas de white_label', () => {
    expect(hasFeatureAccess('free', 'white_label')).toBe(false)
  })

  // Plan Solo
  test('solo : visual_engine_no_watermark activé', () => {
    expect(hasFeatureAccess('solo', 'visual_engine_no_watermark')).toBe(true)
  })

  test('solo : pas de performance_loop', () => {
    expect(hasFeatureAccess('solo', 'performance_loop')).toBe(false)
  })

  test('solo : pas de transcription', () => {
    expect(hasFeatureAccess('solo', 'transcription')).toBe(false)
  })

  // Plan Pro
  test('pro : performance_loop activé', () => {
    expect(hasFeatureAccess('pro', 'performance_loop')).toBe(true)
  })

  test('pro : transcription activé', () => {
    expect(hasFeatureAccess('pro', 'transcription')).toBe(true)
  })

  test('pro : pas de document_engine', () => {
    expect(hasFeatureAccess('pro', 'document_engine')).toBe(false)
  })

  test('pro : pas de lead_gen', () => {
    expect(hasFeatureAccess('pro', 'lead_gen')).toBe(false)
  })

  test('pro : pas de billing_module', () => {
    expect(hasFeatureAccess('pro', 'billing_module')).toBe(false)
  })

  // Plan Agency
  test('agency : billing_module activé', () => {
    expect(hasFeatureAccess('agency', 'billing_module')).toBe(true)
  })

  test('agency : document_engine activé', () => {
    expect(hasFeatureAccess('agency', 'document_engine')).toBe(true)
  })

  test('agency : lead_gen activé', () => {
    expect(hasFeatureAccess('agency', 'lead_gen')).toBe(true)
  })

  test('agency : pas de white_label', () => {
    expect(hasFeatureAccess('agency', 'white_label')).toBe(false)
  })

  test('agency : pas de api_publique', () => {
    expect(hasFeatureAccess('agency', 'api_publique')).toBe(false)
  })

  // Plan Agency+
  test('agency_plus : white_label activé', () => {
    expect(hasFeatureAccess('agency_plus', 'white_label')).toBe(true)
  })

  test('agency_plus : api_publique activé', () => {
    expect(hasFeatureAccess('agency_plus', 'api_publique')).toBe(true)
  })

  test('agency_plus : client_portal activé', () => {
    expect(hasFeatureAccess('agency_plus', 'client_portal')).toBe(true)
  })

  // Enterprise — tout activé
  test('enterprise : toutes les features activées', () => {
    const allFeatures: Feature[] = [
      'social_workflow', 'visual_engine', 'visual_engine_no_watermark',
      'performance_loop', 'transcription', 'document_engine', 'lead_gen',
      'billing_module', 'white_label', 'api_publique', 'client_portal',
    ]
    allFeatures.forEach(f => {
      expect(hasFeatureAccess('enterprise', f)).toBe(true)
    })
  })
})

// ── isGenerationQuotaExceeded ─────────────────────────────────────────────────

describe('isGenerationQuotaExceeded', () => {
  test('free : quota atteint à 10', () => {
    expect(isGenerationQuotaExceeded('free', 10)).toBe(true)
  })

  test('free : quota non atteint à 9', () => {
    expect(isGenerationQuotaExceeded('free', 9)).toBe(false)
  })

  test('free : quota non atteint à 0', () => {
    expect(isGenerationQuotaExceeded('free', 0)).toBe(false)
  })

  test('solo : quota atteint à 150', () => {
    expect(isGenerationQuotaExceeded('solo', 150)).toBe(true)
  })

  test('solo : quota non atteint à 149', () => {
    expect(isGenerationQuotaExceeded('solo', 149)).toBe(false)
  })

  test('pro : quota atteint à 500', () => {
    expect(isGenerationQuotaExceeded('pro', 500)).toBe(true)
  })

  test('agency : quota atteint à 2000', () => {
    expect(isGenerationQuotaExceeded('agency', 2000)).toBe(true)
  })

  test('agency_plus : jamais dépassé (illimité)', () => {
    expect(isGenerationQuotaExceeded('agency_plus', 999999)).toBe(false)
  })

  test('enterprise : jamais dépassé (illimité)', () => {
    expect(isGenerationQuotaExceeded('enterprise', 999999)).toBe(false)
  })
})

// ── getNextPlan ──────────────────────────────────────────────────────────────

describe('getNextPlan', () => {
  test('free → solo', () => {
    expect(getNextPlan('free')).toBe('solo')
  })

  test('solo → pro', () => {
    expect(getNextPlan('solo')).toBe('pro')
  })

  test('pro → agency', () => {
    expect(getNextPlan('pro')).toBe('agency')
  })

  test('agency → agency_plus', () => {
    expect(getNextPlan('agency')).toBe('agency_plus')
  })

  test('agency_plus → null (dernier plan)', () => {
    expect(getNextPlan('agency_plus')).toBeNull()
  })

  test('enterprise → null', () => {
    expect(getNextPlan('enterprise')).toBeNull()
  })
})

// ── getPlanConfig ────────────────────────────────────────────────────────────

describe('getPlanConfig', () => {
  test('free : prix $0', () => {
    expect(getPlanConfig('free').price).toBe(0)
  })

  test('solo : prix $59', () => {
    expect(getPlanConfig('solo').price).toBe(59)
  })

  test('pro : prix $149 et popular=true', () => {
    const cfg = getPlanConfig('pro')
    expect(cfg.price).toBe(149)
    expect(cfg.popular).toBe(true)
  })

  test('agency : prix $399', () => {
    expect(getPlanConfig('agency').price).toBe(399)
  })

  test('agency_plus : prix $699', () => {
    expect(getPlanConfig('agency_plus').price).toBe(699)
  })

  test('plan inconnu → retourne free par défaut', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(getPlanConfig('unknown' as Plan).id).toBe('free')
  })
})

// ── PLANS array ──────────────────────────────────────────────────────────────

describe('PLANS array', () => {
  test('contient exactement 5 plans (sans enterprise)', () => {
    expect(PLANS).toHaveLength(5)
  })

  test('chaque plan a un id unique', () => {
    const ids = PLANS.map(p => p.id)
    expect(new Set(ids).size).toBe(PLANS.length)
  })

  test('les highlights sont non-vides pour chaque plan', () => {
    PLANS.forEach(p => {
      expect(p.highlights.length).toBeGreaterThan(0)
    })
  })

  test('les prix sont croissants', () => {
    const prices = PLANS.map(p => p.price)
    for (let i = 1; i < prices.length; i++) {
      expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1])
    }
  })

  test('seul Pro a popular=true', () => {
    const popular = PLANS.filter(p => p.popular)
    expect(popular).toHaveLength(1)
    expect(popular[0].id).toBe('pro')
  })
})

// ── Quotas cohérence ─────────────────────────────────────────────────────────

describe('Cohérence quotas', () => {
  test('quotas générations croissants (hors illimité)', () => {
    const plans: Plan[] = ['free', 'solo', 'pro', 'agency']
    for (let i = 1; i < plans.length; i++) {
      const prev = PLAN_GENERATION_QUOTAS[plans[i - 1]]
      const curr = PLAN_GENERATION_QUOTAS[plans[i]]
      expect(curr).toBeGreaterThan(prev)
    }
  })

  test('agency_plus et enterprise ont quota illimité (-1)', () => {
    expect(PLAN_GENERATION_QUOTAS['agency_plus']).toBe(-1)
    expect(PLAN_GENERATION_QUOTAS['enterprise']).toBe(-1)
  })

  test('quotas tenants croissants pour les plans limités', () => {
    expect(PLAN_TENANT_QUOTAS['free']).toBe(1)
    expect(PLAN_TENANT_QUOTAS['solo']).toBe(3)
    expect(PLAN_TENANT_QUOTAS['pro']).toBe(10)
    expect(PLAN_TENANT_QUOTAS['agency']).toBe(-1)
  })
})
