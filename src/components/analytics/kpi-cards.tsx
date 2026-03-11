"use client"

import { TrendingUp, TrendingDown, Minus, FileText, Eye, Heart, Trophy } from "lucide-react"
import { PLATFORM_CONFIG } from "@/lib/scheduler/platform-config"
import type { KPIData } from "@/app/actions/analytics"

interface KPICardProps {
  title: string
  value: string
  delta: number
  icon: React.ReactNode
  subtitle?: string
}

function KPICard({ title, value, delta, icon, subtitle }: KPICardProps) {
  const isPositive = delta > 0
  const isNeutral = delta === 0

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
            {icon}
          </div>
          <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
          isNeutral
            ? "bg-zinc-500/10 text-zinc-400"
            : isPositive
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
        }`}>
          {isNeutral ? (
            <Minus className="size-3" />
          ) : isPositive ? (
            <TrendingUp className="size-3" />
          ) : (
            <TrendingDown className="size-3" />
          )}
          <span>{isNeutral ? "—" : `${isPositive ? "+" : ""}${delta}%`}</span>
        </div>
      </div>
      <div className="mt-3">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

export function KPICards({ kpis }: { kpis: KPIData }) {
  const topPlatformLabel = kpis.topPlatform
    ? PLATFORM_CONFIG[kpis.topPlatform]?.label ?? kpis.topPlatform
    : "—"

  const formatReach = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    return n.toString()
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KPICard
        title="Posts publiés"
        value={kpis.publishedCount.toString()}
        delta={kpis.publishedDelta}
        icon={<FileText className="size-4" />}
        subtitle="sur la période sélectionnée"
      />
      <KPICard
        title="Reach total"
        value={formatReach(kpis.totalReach)}
        delta={kpis.reachDelta}
        icon={<Eye className="size-4" />}
        subtitle="impressions estimées"
      />
      <KPICard
        title="Engagement rate"
        value={`${kpis.engagementRate}%`}
        delta={kpis.engagementDelta}
        icon={<Heart className="size-4" />}
        subtitle="interactions / impressions"
      />
      <KPICard
        title="Top plateforme"
        value={topPlatformLabel}
        delta={0}
        icon={<Trophy className="size-4" />}
        subtitle={kpis.topPlatformCount > 0 ? `${kpis.topPlatformCount} posts publiés` : "Aucune donnée"}
      />
    </div>
  )
}
