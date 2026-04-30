import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/billing/plans'
import type { Plan } from '@/lib/billing/plans'
import { PricingCard } from '@/components/billing/pricing-card'
import { Check } from 'lucide-react'
import { resolveUserTenant } from '@/lib/services/tenant/resolve'
import { getTranslations } from 'next-intl/server'

async function getCurrentPlan(): Promise<Plan | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const tenantId = await resolveUserTenant(supabase, user.id)
    if (!tenantId) return null

    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan')
      .eq('id', tenantId)
      .single()

    return (tenant?.plan as Plan) ?? null
  } catch {
    return null
  }
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="mx-auto h-4 w-4 text-violet-500 dark:text-violet-400" />
      : <span className="text-gray-300 dark:text-white/20">—</span>
  }
  return <span className="text-sm text-gray-700 dark:text-white/80">{value}</span>
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>
}) {
  const params = await searchParams
  const currentPlan = await getCurrentPlan()
  const t = await getTranslations('pricing')
  const tf = await getTranslations('pricing.features')
  const tfaq = await getTranslations('pricing.faq')

  const FEATURE_COMPARISON = [
    { label: tf('brands'),        free: '1',         solo: '3',          pro: '10',          agency: t('unlimited'),   agency_plus: t('unlimited') },
    { label: tf('generations'),   free: '10',        solo: '150',        pro: '500',         agency: '2 000',      agency_plus: t('unlimited') },
    { label: tf('noWatermark'),   free: false,       solo: true,         pro: true,          agency: true,         agency_plus: true },
    { label: tf('exportZip'),     free: false,       solo: true,         pro: true,          agency: true,         agency_plus: true },
    { label: tf('analytics'),     free: false,       solo: false,        pro: true,          agency: true,         agency_plus: true },
    { label: tf('transcription'), free: false,       solo: false,        pro: true,          agency: true,         agency_plus: true },
    { label: tf('documentEngine'),free: false,       solo: false,        pro: false,         agency: true,         agency_plus: true },
    { label: tf('leadGen'),       free: false,       solo: false,        pro: false,         agency: true,         agency_plus: true },
    { label: tf('clientBilling'), free: false,       solo: false,        pro: false,         agency: true,         agency_plus: true },
    { label: tf('whiteLabel'),    free: false,       solo: false,        pro: false,         agency: false,        agency_plus: true },
    { label: tf('publicApi'),     free: false,       solo: false,        pro: false,         agency: false,        agency_plus: true },
    { label: tf('clientPortal'),  free: false,       solo: false,        pro: false,         agency: false,        agency_plus: true },
  ]

  const FAQ_ITEMS = [
    { q: tfaq('pq1'), a: tfaq('pa1') },
    { q: tfaq('pq2'), a: tfaq('pa2') },
    { q: tfaq('pq3'), a: tfaq('pa3') },
    { q: tfaq('pq4'), a: tfaq('pa4') },
    { q: tfaq('pq5'), a: tfaq('pa5') },
    { q: tfaq('pq6'), a: tfaq('pa6') },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Blobs décoratifs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="rami-blob absolute -top-40 left-1/4 h-[600px] w-[600px] bg-[#7c3bed]" />
        <div className="rami-blob absolute top-1/3 right-1/4 h-[400px] w-[400px] bg-[#2563eb]" />
      </div>
      <div className="fixed inset-0 rami-grid-pattern pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Canceled banner */}
        {params.canceled && (
          <div className="mb-8 rounded-xl border border-yellow-400/30 bg-yellow-50 dark:border-yellow-500/20 dark:bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-700 dark:text-yellow-300">
            {t('cancelledBanner')}
          </div>
        )}

        {/* Hero */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-violet-200 bg-violet-50 dark:border-violet-500/20 dark:bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-600 dark:text-violet-400">
            {t('badge')}
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t('title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>

        {/* Grille des plans */}
        <div className="mb-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {PLANS.map(plan => (
            <PricingCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={currentPlan === plan.id}
            />
          ))}
        </div>

        {/* Tableau comparatif */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-center">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    {t('featuresComparison')}
                  </th>
                  {PLANS.map(plan => (
                    <th key={plan.id} className={`px-4 py-4 text-sm font-semibold ${
                      plan.popular ? 'text-violet-600 dark:text-violet-400' : 'text-foreground/80'
                    }`}>
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON.map((row, i) => (
                  <tr
                    key={row.label}
                    className={`border-b border-gray-100 dark:border-white/[0.06] ${
                      i % 2 === 0 ? 'bg-gray-50/50 dark:bg-white/[0.01]' : ''
                    }`}
                  >
                    <td className="px-6 py-3 text-left text-sm text-muted-foreground">
                      {row.label}
                    </td>
                    <td className="px-4 py-3">
                      <FeatureValue value={row.free} />
                    </td>
                    <td className="px-4 py-3">
                      <FeatureValue value={row.solo} />
                    </td>
                    <td className="px-4 py-3">
                      <FeatureValue value={row.pro} />
                    </td>
                    <td className="px-4 py-3">
                      <FeatureValue value={row.agency} />
                    </td>
                    <td className="px-4 py-3">
                      <FeatureValue value={row.agency_plus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ rapide */}
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FAQ_ITEMS.map(item => (
            <div
              key={item.q}
              className="rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] p-5"
            >
              <h3 className="mb-2 font-semibold text-foreground">{item.q}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
