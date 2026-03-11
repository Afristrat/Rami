import { redirect } from 'next/navigation'
import { getBillingDataAction } from '@/lib/billing/actions'
import { requireFeature } from '@/lib/billing/require-feature'
import { BillingDashboard } from '@/components/billing/billing-dashboard'

export const metadata = {
  title: 'Facturation — RAMI',
  description: 'Gérez votre abonnement et consultez vos factures.',
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; plan?: string }>
}) {
  // Vérification feature flag côté serveur — Agency ou supérieur
  await requireFeature('billing_module')

  const params = await searchParams
  const data = await getBillingDataAction()

  if (!data) {
    redirect('/login')
  }

  const { tenant, invoices } = data

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Facturation</h1>
          <p className="mt-1 text-sm text-white/50">
            Gérez votre abonnement, consultez vos factures et modifiez votre plan.
          </p>
        </div>

        <BillingDashboard
          tenant={tenant}
          invoices={invoices}
          successPlan={params.success === '1' ? (params.plan ?? null) : null}
        />
      </div>
    </div>
  )
}
