import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/billing/plans'
import type { Plan } from '@/lib/billing/plans'
import { PricingCard } from '@/components/billing/pricing-card'
import { Check } from 'lucide-react'

async function getCurrentPlan(): Promise<Plan | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: tenant } = await supabase
      .from('tenants')
      .select('plan')
      .eq('owner_id', user.id)
      .single()

    return (tenant?.plan as Plan) ?? null
  } catch {
    return null
  }
}

const FEATURE_COMPARISON = [
  { label: 'Marques / clients',       free: '1',         solo: '3',          pro: '10',          agency: 'Illimité',   agency_plus: 'Illimité' },
  { label: 'Générations / mois',      free: '10',        solo: '150',        pro: '500',         agency: '2 000',      agency_plus: 'Illimité' },
  { label: 'Visuels sans watermark',  free: false,       solo: true,         pro: true,          agency: true,         agency_plus: true },
  { label: 'Export ZIP',              free: false,       solo: true,         pro: true,          agency: true,         agency_plus: true },
  { label: 'Analytics & Perf Loop',  free: false,       solo: false,        pro: true,          agency: true,         agency_plus: true },
  { label: 'Transcription réunions', free: false,       solo: false,        pro: true,          agency: true,         agency_plus: true },
  { label: 'Document Engine',        free: false,       solo: false,        pro: false,         agency: true,         agency_plus: true },
  { label: 'Lead Gen Apollo',        free: false,       solo: false,        pro: false,         agency: true,         agency_plus: true },
  { label: 'Facturation clients',    free: false,       solo: false,        pro: false,         agency: true,         agency_plus: true },
  { label: 'White-label',            free: false,       solo: false,        pro: false,         agency: false,        agency_plus: true },
  { label: 'API publique',           free: false,       solo: false,        pro: false,         agency: false,        agency_plus: true },
  { label: 'Portail client dédié',   free: false,       solo: false,        pro: false,         agency: false,        agency_plus: true },
]

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === 'boolean') {
    return value
      ? <Check className="mx-auto h-4 w-4 text-violet-400" />
      : <span className="text-white/20">—</span>
  }
  return <span className="text-sm text-white/80">{value}</span>
}

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ canceled?: string }>
}) {
  const params = await searchParams
  const currentPlan = await getCurrentPlan()

  return (
    <div className="min-h-screen bg-[#0A0A0F]">
      {/* Blobs décoratifs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-600/6 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        {/* Canceled banner */}
        {params.canceled && (
          <div className="mb-8 rounded-xl border border-yellow-500/20 bg-yellow-500/10 px-4 py-3 text-center text-sm text-yellow-300">
            Paiement annulé. Aucun montant n&apos;a été débité.
          </div>
        )}

        {/* Hero */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-violet-400">
            Tarifs
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Un prix pour chaque ambition
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            De la découverte à l&apos;agence à grande échelle — RAMI évolue avec vous.
            Sans contrat, sans surprise.
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
        <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-center">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-white/60">
                    Fonctionnalités
                  </th>
                  {PLANS.map(plan => (
                    <th key={plan.id} className={`px-4 py-4 text-sm font-semibold ${
                      plan.popular ? 'text-violet-400' : 'text-white/80'
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
                    className={`border-b border-white/[0.06] ${
                      i % 2 === 0 ? 'bg-white/[0.01]' : ''
                    }`}
                  >
                    <td className="px-6 py-3 text-left text-sm text-white/70">
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
          {[
            {
              q: 'Puis-je changer de plan à tout moment ?',
              a: 'Oui. Les upgrades sont immédiats, les downgrades prennent effet à la fin de la période de facturation.',
            },
            {
              q: 'Y a-t-il un engagement de durée ?',
              a: 'Non. Tous les plans sont mensuels, sans engagement. Annulez quand vous le souhaitez.',
            },
            {
              q: 'Que se passe-t-il si j\'atteins mon quota ?',
              a: 'Vos contenus existants restent accessibles. Seule la génération de nouveaux visuels est bloquée jusqu\'au renouvellement.',
            },
            {
              q: 'Les données sont-elles sécurisées ?',
              a: 'Oui. Stockage chiffré AES-256, HTTPS partout, RLS Supabase sur toutes les tables. Conformité CNDP (Maroc) + RGPD.',
            },
            {
              q: 'Proposez-vous un plan Enterprise ?',
              a: 'Oui, sur devis. SLA 99,9 %, onboarding dédié, formation équipe. Contactez-nous à amine@ai-mpower.com.',
            },
            {
              q: 'Quels moyens de paiement acceptez-vous ?',
              a: 'Toutes les cartes bancaires via Stripe (Visa, Mastercard, Amex). PayPal et virement sur demande.',
            },
          ].map(item => (
            <div
              key={item.q}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5"
            >
              <h3 className="mb-2 font-semibold text-white">{item.q}</h3>
              <p className="text-sm leading-relaxed text-white/60">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
