'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Sparkles } from 'lucide-react'
import { createCheckoutSessionAction } from '@/lib/billing/actions'
import type { PlanConfig } from '@/lib/billing/plans'
import { cn } from '@/lib/utils'

interface PricingCardProps {
  plan: PlanConfig
  isCurrentPlan?: boolean
}

export function PricingCard({ plan, isCurrentPlan = false }: PricingCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleSubscribe() {
    setError(null)

    if (plan.id === 'free') {
      router.push('/dashboard')
      return
    }

    if (plan.id === 'enterprise') {
      router.push('mailto:amine@ai-mpower.com?subject=RAMI Enterprise')
      return
    }

    startTransition(async () => {
      const result = await createCheckoutSessionAction(plan.id)

      if (result.error) {
        setError(result.error)
        return
      }

      if (result.url) {
        router.push(result.url)
      }
    })
  }

  const buttonLabel = isCurrentPlan
    ? 'Plan actuel'
    : plan.id === 'free'
      ? 'Commencer gratuitement'
      : plan.id === 'enterprise'
        ? 'Nous contacter'
        : `Passer au plan ${plan.name}`

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border p-6 transition-all',
        plan.popular
          ? 'border-violet-500 bg-violet-950/20 shadow-lg shadow-violet-500/10 scale-105'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15]'
      )}
    >
      {plan.popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-1 text-xs font-semibold text-white">
            <Sparkles className="h-3 w-3" />
            Recommandé
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
        <p className="mt-1 text-sm text-white/60">{plan.description}</p>
      </div>

      {/* Prix */}
      <div className="mb-6">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-white">{plan.priceLabel}</span>
          {plan.price > 0 && (
            <span className="text-sm text-white/50">/mois</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-2.5">
        {plan.highlights.map(highlight => (
          <li key={highlight} className="flex items-start gap-2.5 text-sm text-white/80">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
            {highlight}
          </li>
        ))}
      </ul>

      {/* Error */}
      {error && (
        <p className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={handleSubscribe}
        disabled={isCurrentPlan || isPending}
        className={cn(
          'relative flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all',
          isCurrentPlan
            ? 'cursor-default bg-white/[0.08] text-white/40'
            : plan.popular
              ? 'bg-gradient-to-r from-violet-600 to-blue-600 text-white hover:from-violet-500 hover:to-blue-500 active:scale-[0.98]'
              : 'border border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.10]',
          (isPending) && 'opacity-70'
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Redirection…
          </>
        ) : (
          buttonLabel
        )}
      </button>
    </div>
  )
}
