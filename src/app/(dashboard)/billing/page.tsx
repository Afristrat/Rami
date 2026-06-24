import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getBillingDataAction } from '@/lib/billing/actions'
import { BillingDashboard } from '@/components/billing/billing-dashboard'

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("billing"),
    description: t("billingDescription"),
  }
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; plan?: string }>
}) {
  // Gérer son propre abonnement (plan courant, paiement, factures, upgrade) doit
  // être accessible à TOUT tenant authentifié — pas réservé à un plan. L'auth est
  // assurée par getBillingDataAction (null → /login). (Le module de FACTURATION
  // client, lui, reste gaté `billing_module` côté /dashboard si besoin.)
  const t = await getTranslations('billing')
  const params = await searchParams
  const data = await getBillingDataAction()

  if (!data) {
    redirect('/login')
  }

  const { tenant, invoices } = data

  return (
    <div className="w-full px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <BillingDashboard
        tenant={tenant}
        invoices={invoices}
        successPlan={params.success === '1' ? (params.plan ?? null) : null}
      />
    </div>
  )
}
