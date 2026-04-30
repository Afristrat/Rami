'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Zap, X, Check, Loader2 } from 'lucide-react'
import { createCheckoutSessionAction } from '@/lib/billing/actions'
import { PLANS, getPlanConfig, getNextPlan } from '@/lib/billing/plans'
import type { Plan } from '@/lib/billing/plans'
import { cn } from '@/lib/utils'

interface UpgradeModalProps {
  currentPlan: Plan
  blockedFeature?: string
  reason?: string
  onClose: () => void
}

export function UpgradeModal({
  currentPlan,
  blockedFeature,
  reason,
  onClose,
}: UpgradeModalProps) {
  const router = useRouter()
  const t = useTranslations('pricing')
  const tb = useTranslations('billing')
  const [selectedPlan, setSelectedPlan] = useState<Plan>(
    getNextPlan(currentPlan) ?? 'pro'
  )
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const upgradePlans = PLANS.filter(
    p => p.id !== 'free' && p.id !== currentPlan && p.id !== 'enterprise'
  )

  function handleUpgrade() {
    setError(null)

    startTransition(async () => {
      const result = await createCheckoutSessionAction(selectedPlan)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.url) {
        router.push(result.url)
      }
    })
  }

  const currentConfig = getPlanConfig(currentPlan)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-2xl">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={t('close')}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 id="upgrade-modal-title" className="text-xl font-semibold text-foreground">
              {t('upgradeTitle')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {reason ?? t('planLimitReached', { plan: currentConfig.name })}
              {blockedFeature && (
                <> {t('unlockFeature', { feature: blockedFeature })}</>
              )}
            </p>
          </div>
        </div>

        {/* Plans disponibles */}
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          {upgradePlans.map(plan => (
            <button
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={cn(
                'relative rounded-xl border p-4 text-left transition-all',
                selectedPlan === plan.id
                  ? 'border-violet-500 bg-violet-950/20'
                  : 'border-border bg-card hover:border-foreground/20'
              )}
            >
              {plan.popular && (
                <span className="absolute right-3 top-3 rounded-full bg-violet-600/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">
                  {t('popular')}
                </span>
              )}

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-foreground">{plan.priceLabel}</span>
                <span className="text-xs text-muted-foreground">{t('perMonth')}</span>
              </div>
              <p className="mt-0.5 font-medium text-foreground">{plan.name}</p>

              <ul className="mt-3 space-y-1.5">
                {plan.highlights.slice(0, 3).map(h => (
                  <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 shrink-0 text-violet-400" />
                    {h}
                  </li>
                ))}
              </ul>

              {selectedPlan === plan.id && (
                <div className="absolute right-3 bottom-3 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            {t('later')}
          </button>
          <button
            onClick={handleUpgrade}
            disabled={isPending}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-blue-500 active:scale-[0.98] disabled:opacity-70"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('redirecting')}
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                {t('switchToPlan', { plan: getPlanConfig(selectedPlan).name })}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook pour afficher le modal upgrade.
 * Usage : const { showUpgrade, UpgradeModalContainer } = useUpgradeModal(plan)
 */
export function useUpgradeModal(currentPlan: Plan) {
  const [modalState, setModalState] = useState<{
    open: boolean
    feature?: string
    reason?: string
  }>({ open: false })

  function showUpgrade(feature?: string, reason?: string) {
    setModalState({ open: true, feature, reason })
  }

  function closeModal() {
    setModalState({ open: false })
  }

  const UpgradeModalContainer = modalState.open ? (
    <UpgradeModal
      currentPlan={currentPlan}
      blockedFeature={modalState.feature}
      reason={modalState.reason}
      onClose={closeModal}
    />
  ) : null

  return { showUpgrade, UpgradeModalContainer }
}
