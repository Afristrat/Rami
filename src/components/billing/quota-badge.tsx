/**
 * QuotaBadge — Composant serveur.
 * Affiche la consommation de génération mensuelle dans le header.
 * Charge les données silencieusement (null si erreur ou quota illimité).
 */

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { getCurrentTenantPlan } from '@/lib/billing/require-feature'
import { PLAN_GENERATION_QUOTAS, getPlanConfig } from '@/lib/billing/plans'
import { cn } from '@/lib/utils'

/**
 * Charge les données de quota — retourne null en cas d'erreur.
 * Séparé du rendu pour éviter JSX dans un try/catch.
 */
async function loadQuotaData() {
  try {
    const data = await getCurrentTenantPlan()
    if (!data) return null

    const quota = PLAN_GENERATION_QUOTAS[data.plan]
    if (quota === -1) return null  // Plan illimité → pas d'affichage

    return {
      count: data.generation_count,
      quota,
      plan: data.plan,
      planName: getPlanConfig(data.plan).name,
      percent: Math.min(100, Math.round((data.generation_count / quota) * 100)),
    }
  } catch {
    return null
  }
}

export async function QuotaBadge() {
  const data = await loadQuotaData()

  if (!data) return null

  const t = await getTranslations('quota')
  const isCritical = data.percent >= 95
  const isWarning  = data.percent >= 80

  return (
    <Link
      href="/billing"
      className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs transition-colors hover:border-border/80 hover:bg-accent"
      title={`${data.count}/${data.quota} ${t('generations')} — Plan ${data.planName}`}
    >
      <Zap className={cn(
        'h-3 w-3 shrink-0',
        isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-violet-400'
      )} />

      <div className="flex items-center gap-1.5">
        <span className={cn(
          'font-medium tabular-nums',
          isCritical ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-foreground/70'
        )}>
          {data.count}
        </span>
        <span className="text-foreground/30">/</span>
        <span className="text-foreground/50">{data.quota}</span>
      </div>

      {/* Mini barre de progression */}
      <div className="hidden lg:block w-16 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-violet-500'
          )}
          style={{ width: `${data.percent}%` }}
        />
      </div>

      {isCritical && (
        <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
          {t('limitReached')}
        </span>
      )}
    </Link>
  )
}
