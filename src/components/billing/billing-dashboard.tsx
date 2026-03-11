'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
  const map: Record<string, { label: string; className: string }> = {
    active:   { label: 'Actif',        className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    past_due: { label: 'Paiement dû',  className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    canceled: { label: 'Annulé',       className: 'bg-red-500/10 text-red-400 border-red-500/20' },
    trialing: { label: 'Essai',        className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    inactive: { label: 'Inactif',      className: 'bg-white/[0.05] text-white/40 border-white/[0.08]' },
  }

  const s = map[status ?? 'inactive'] ?? map.inactive

  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', s.className)}>
      {s.label}
    </span>
  )
}

function GenerationBar({ plan, count }: { plan: Plan; count: number }) {
  const quota = PLAN_GENERATION_QUOTAS[plan]

  if (quota === -1) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/60">
        <BarChart3 className="h-4 w-4 text-violet-400" />
        Générations illimitées
      </div>
    )
  }

  const percent = Math.min(100, Math.round((count / quota) * 100))
  const isWarning = percent >= 80
  const isCritical = percent >= 95

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-white/60">Générations ce mois</span>
        <span className={cn(
          'font-medium',
          isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white/80'
        )}>
          {count} / {quota}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-violet-500'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {isCritical && (
        <p className="mt-1.5 text-xs text-red-400">
          Quota presque épuisé — passez au plan supérieur pour continuer.
        </p>
      )}
    </div>
  )
}

export function BillingDashboard({ tenant, invoices, successPlan }: BillingDashboardProps) {
  const router = useRouter()
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
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.url) router.push(result.url)
    })
  }

  function upgradeToNext() {
    if (!nextPlan) return
    setError(null)
    startUpgradeTransition(async () => {
      const result = await createCheckoutSessionAction(nextPlan)
      if (result.error) {
        setError(result.error)
        return
      }
      if (result.url) router.push(result.url)
    })
  }

  return (
    <div className="space-y-6">
      {/* Success banner */}
      {successPlan && (
        <div className="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
          <p className="text-sm text-green-300">
            Bravo ! Votre passage au plan <strong>{getPlanConfig(successPlan as Plan).name}</strong> est confirmé.
          </p>
        </div>
      )}

      {/* Plan actuel */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Votre plan</h2>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{planConfig.name}</span>
              <span className="text-white/40">·</span>
              <span className="text-lg font-medium text-white/70">{planConfig.priceLabel}/mois</span>
              <StatusBadge status={tenant.subscription_status} />
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {tenant.stripe_customer_id && (
              <button
                onClick={openPortal}
                disabled={portalPending}
                className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.10] disabled:opacity-60"
              >
                {portalPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Gérer l&apos;abonnement
              </button>
            )}

            {nextPlanConfig && (
              <button
                onClick={upgradeToNext}
                disabled={upgradePending}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-blue-500 disabled:opacity-60"
              >
                {upgradePending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                Passer à {nextPlanConfig.name}
              </button>
            )}
          </div>
        </div>

        {/* Quota générations */}
        <GenerationBar plan={currentPlan} count={tenant.generation_count} />

        {tenant.generation_reset_at && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
            <Clock className="h-3 w-3" />
            Remise à zéro le{' '}
            {new Date(tenant.generation_reset_at).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Voir tous les plans */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-white">Comparer tous les plans</h3>
            <p className="mt-0.5 text-sm text-white/50">
              Découvrez toutes les fonctionnalités disponibles.
            </p>
          </div>
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.10]"
          >
            <ExternalLink className="h-4 w-4" />
            Voir les plans
          </Link>
        </div>
      </div>

      {/* Historique des factures */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <div className="border-b border-white/[0.06] px-6 py-4">
          <h2 className="font-semibold text-white">Historique des factures</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <CreditCard className="h-10 w-10 text-white/20" />
            <p className="text-sm text-white/40">Aucune facture pour le moment.</p>
            {currentPlan === 'free' && (
              <p className="text-xs text-white/30">
                Les factures apparaîtront ici dès votre premier paiement.
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.05]">
                    <CreditCard className="h-4 w-4 text-white/40" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {inv.number ?? 'Facture'}
                    </p>
                    <p className="text-xs text-white/50">
                      {new Date(inv.date * 1000).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-white">
                    {inv.amount.toFixed(2)} {inv.currency}
                  </span>
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-medium',
                    inv.status === 'paid'
                      ? 'bg-green-500/10 text-green-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  )}>
                    {inv.status === 'paid' ? 'Payée' : inv.status}
                  </span>

                  {inv.pdf && (
                    <a
                      href={inv.pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-xs text-white/60 transition hover:border-white/[0.15] hover:text-white"
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
