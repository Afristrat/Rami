'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  CreditCard, ExternalLink, Download, CheckCircle2,
  AlertCircle, Clock, Loader2, Zap, BarChart3
} from 'lucide-react'
import { createBillingPortalAction, createCheckoutSessionAction } from '@/lib/billing/actions'
import {
  PLAN_GENERATION_QUOTAS, getPlanConfig, getNextPlan
} from '@/lib/billing/plans'
import type { Plan } from '@/lib/billing/plans'
import { cn } from '@/lib/utils'
import { useIntlLocale } from '@/lib/utils/format-locale'
import Link from 'next/link'

interface Invoice {
  id: string
  number: string | null
  amount: number
  currency: string
  status: string | null
  date: number
  pdf: string | null
}

interface Tenant {
  id: string
  name: string
  plan: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: string | null
  generation_count: number
  generation_reset_at: string | null
}

interface BillingDashboardProps {
  tenant: Tenant
  invoices: Invoice[]
  successPlan?: string | null
}

function StatusBadge({ status }: { status: string | null }) {
  const t = useTranslations('billing')

  const map: Record<string, { label: string; className: string }> = {
    active:   { label: t('statusActive'),    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
    past_due: { label: t('statusPastDue'),   className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },
    canceled: { label: t('statusCanceled'),  className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
    trialing: { label: t('statusTrialing'),  className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    inactive: { label: t('statusInactive'),  className: 'bg-muted/40 text-muted-foreground border-border' },
  }

  const s = map[status ?? 'inactive'] ?? map.inactive

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', s.className)}>
      {s.label}
    </span>
  )
}

function GenerationBar({ plan, count }: { plan: Plan; count: number }) {
  const t = useTranslations('billing')
  const quota = PLAN_GENERATION_QUOTAS[plan]

  if (quota === -1) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <BarChart3 className="h-4 w-4 text-violet-500" />
        {t('unlimitedGenerations')}
      </div>
    )
  }

  const percent = Math.min(100, Math.round((count / quota) * 100))
  const isWarning = percent >= 80
  const isCritical = percent >= 95

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t('generationsThisMonth')}</span>
        <span className={cn(
          'font-medium',
          isCritical ? 'text-red-500' : isWarning ? 'text-yellow-500' : 'text-foreground'
        )}>
          {count} / {quota}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-violet-500'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isCritical && (
        <p className="mt-1.5 text-xs text-red-500">
          {t('quotaAlmostExhausted')}
        </p>
      )}
    </div>
  )
}

export function BillingDashboard({ tenant, invoices, successPlan }: BillingDashboardProps) {
  const router = useRouter()
  const t = useTranslations('billing')
  const intlLocale = useIntlLocale()
  const [portalPending, startPortalTransition] = useTransition()
  const [upgradePending, startUpgradeTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const currentPlan = tenant.plan as Plan
  const planConfig = getPlanConfig(currentPlan)
  const nextPlan = getNextPlan(currentPlan)
  const nextPlanConfig = nextPlan ? getPlanConfig(nextPlan) : null

  function openPortal() {
    setError(null)
    startPortalTransition(async () => {
      const result = await createBillingPortalAction()
      if (result.error) { setError(result.error); return }
      if (result.url) router.push(result.url)
    })
  }

  function upgradeToNext() {
    if (!nextPlan) return
    setError(null)
    startUpgradeTransition(async () => {
      const result = await createCheckoutSessionAction(nextPlan)
      if (result.error) { setError(result.error); return }
      if (result.url) router.push(result.url)
    })
  }

  return (
    <div className="space-y-4 max-w-3xl">
      {/* Success banner */}
      {successPlan && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
          <p className="text-sm text-green-700 dark:text-green-300">
            {t('successMessage', { plan: getPlanConfig(successPlan as Plan).name })}
          </p>
        </div>
      )}

      {/* Plan actuel */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{t('yourPlan')}</h2>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <span className="text-2xl font-bold text-foreground">{planConfig.name}</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-lg font-medium text-muted-foreground">{planConfig.priceLabel}{t('perMonth')}</span>
              <StatusBadge status={tenant.subscription_status} />
            </div>
          </div>

          <div className="flex shrink-0 gap-2 flex-wrap">
            {tenant.stripe_customer_id && (
              <button
                onClick={openPortal}
                disabled={portalPending}
                className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-60"
              >
                {portalPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                {t('manageSubscription')}
              </button>
            )}

            {nextPlanConfig && (
              <button
                onClick={upgradeToNext}
                disabled={upgradePending}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-blue-500 disabled:opacity-60"
              >
                {upgradePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {t('upgradeTo', { plan: nextPlanConfig.name })}
              </button>
            )}
          </div>
        </div>

        {/* Quota générations */}
        <GenerationBar plan={currentPlan} count={tenant.generation_count} />

        {tenant.generation_reset_at && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t('resetOn', {
              date: new Date(tenant.generation_reset_at).toLocaleDateString(intlLocale, {
                day: 'numeric', month: 'long', year: 'numeric',
              })
            })}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Voir tous les plans */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="font-medium text-foreground">{t('compareAllPlans')}</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {t('discoverFeatures')}
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted shrink-0"
          >
            <ExternalLink className="h-4 w-4" />
            {t('viewPlans')}
          </Link>
        </div>
      </div>

      {/* Historique des factures */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">{t('invoiceHistory')}</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">{t('noInvoicesYet')}</p>
            {currentPlan === 'free' && (
              <p className="text-xs text-muted-foreground/70">
                {t('invoicesAppearAfterPayment')}
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-3.5 flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {inv.number ?? t('invoice')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.date * 1000).toLocaleDateString(intlLocale, {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-foreground">
                    {inv.amount.toFixed(2)} {inv.currency}
                  </span>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    inv.status === 'paid'
                      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                      : 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                  )}>
                    {inv.status === 'paid' ? t('paidFem') : inv.status}
                  </span>

                  {inv.pdf && (
                    <a
                      href={inv.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:border-foreground/30 hover:text-foreground"
                    >
                      <Download className="h-3 w-3" />
                      PDF
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
