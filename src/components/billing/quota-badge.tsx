/**
 * QuotaBadge — Composant serveur.
 * Affiche la consommation de génération mensuelle dans le header.
 * Se charge silencieusement (null si erreur ou quota illimité).
 */

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { getCurrentTenantPlan } from '@/lib/billing/require-feature'
import { PLAN_GENERATION_QUOTAS, getPlanConfig } from '@/lib/billing/plans'
import { cn } from '@/lib/utils'

export async function QuotaBadge() {
  try {
    const data = await getCurrentTenantPlan()
    if (!data) return null

    const quota = PLAN_GENERATION_QUOTAS[data.plan]

    // Plan illimité → ne pas afficher la barre
    if (quota === -1) return null

    const percent = Math.min(100, Math.round((data.generation_count / quota) * 100))
    const isCritical = percent >= 95
    const isWarning  = percent >= 80

    const planConfig = getPlanConfig(data.plan)

    return (
      <Link
        href="/dashboard/billing"
        className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-background/50 px-3 py-1.5 text-xs transition-colors hover:border-border/80 hover:bg-accent"
        title={`${data.generation_count}/${quota} générations ce mois — Plan ${planConfig.name}`}
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
            {data.generation_count}
          </span>
          <span className="text-foreground/30">/</span>
          <span className="text-foreground/50">{quota}</span>
        </div>

        {/* Mini barre de progression */}
        <div className="hidden lg:block w-16 h-1.5 overflow-hidden rounded-full bg-border">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-violet-500'
            )}
            style={{ width: `${percent}%` }}
          />
        </div>

        {isCritical && (
          <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">
            Quota !
          </span>
        )}
      </Link>
    )
  } catch {
    // Fail silently — ne pas casser le layout
    return null
  }
}
