"use client"

import { useTranslations } from "next-intl"
import { TrendingUp, TrendingDown, Minus, Eye, BarChart3, MousePointerClick, ThumbsUp, Activity } from "lucide-react"
import { useIntlLocale } from "@/lib/utils/format-locale"
import type { KPIData } from "@/app/actions/analytics"
import { cn } from "@/lib/utils"

interface KPICardData {
  label: string
  value: string
  delta: number
  icon: React.ReactNode
  badge?: { text: string; variant: "excellent" | "bon" | "faible" }
  highlight?: boolean
}

function formatCompact(n: number, locale: string): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString(locale)
}

function getEngagementBadge(rate: number): { text: string; variant: "excellent" | "bon" | "faible" } {
  if (rate >= 4) return { text: "EXCELLENT", variant: "excellent" }
  if (rate >= 2) return { text: "BON", variant: "bon" }
  return { text: "FAIBLE", variant: "faible" }
}

const BADGE_CLASSES: Record<string, { dark: string; light: string }> = {
  excellent: {
    dark: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    light: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
  bon: {
    dark: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    light: "bg-amber-50 text-amber-600 border-amber-200",
  },
  faible: {
    dark: "bg-red-500/10 text-red-400 border-red-500/20",
    light: "bg-red-50 text-red-600 border-red-200",
  },
}

function KPICard({ label, value, delta, icon, badge, highlight }: KPICardData) {
  const isPositive = delta > 0
  const isNeutral = delta === 0

  return (
    <div className={cn(
      "rounded-xl p-5 transition-all glass-card",
      "hover:border-gray-300 dark:hover:border-white/20",
      highlight && "ring-1 ring-emerald-500/20"
    )}>
      <p className="text-xs font-medium text-muted-foreground mb-3">{label}</p>
      <div className="flex items-end justify-between">
        <div>
          <h3 className={cn(
            "text-2xl font-bold tracking-tight",
            highlight ? "text-emerald-500 dark:text-emerald-400" : "text-foreground"
          )}>
            {value}
          </h3>
          {badge ? (
            <div className="mt-1.5">
              <span className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                BADGE_CLASSES[badge.variant]?.light,
                `dark:${BADGE_CLASSES[badge.variant]?.dark}`
              )}>
                {badge.text}
              </span>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-1">
              {isNeutral ? (
                <>
                  <Minus className="size-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">&mdash;</span>
                </>
              ) : isPositive ? (
                <>
                  <TrendingUp className="size-3 text-emerald-500 dark:text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">+{delta}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="size-3 text-red-500 dark:text-red-400" />
                  <span className="text-xs font-semibold text-red-500 dark:text-red-400">{delta}%</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      </div>
    </div>
  )
}

export function KPICards({ kpis }: { kpis: KPIData }) {
  const t = useTranslations("analytics")
  const intlLocale = useIntlLocale()
  // Données 100 % réelles issues de post_metrics (US-012). Une absence vaut 0.

  const cards: KPICardData[] = [
    {
      label: t("impressions"),
      value: formatCompact(kpis.impressions, intlLocale),
      delta: kpis.impressionsDelta,
      icon: <Eye className="size-4" />,
    },
    {
      label: t("engagement"),
      value: formatCompact(kpis.interactions, intlLocale),
      delta: kpis.interactionsDelta,
      icon: <Activity className="size-4" />,
    },
    {
      label: t("engagementRate"),
      value: `${kpis.engagementRate}%`,
      delta: kpis.engagementDelta,
      icon: <BarChart3 className="size-4" />,
      badge: getEngagementBadge(kpis.engagementRate),
    },
    {
      label: t("clicks"),
      value: formatCompact(kpis.clicks, intlLocale),
      delta: kpis.clicksDelta,
      icon: <MousePointerClick className="size-4" />,
    },
    {
      label: t("likes"),
      value: formatCompact(kpis.likes, intlLocale),
      delta: kpis.likesDelta,
      icon: <ThumbsUp className="size-4" />,
      highlight: true,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => (
        <KPICard key={card.label} {...card} />
      ))}
    </div>
  )
}
