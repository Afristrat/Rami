"use client"

import { useTranslations } from "next-intl"
import { Trophy, TrendingUp, Eye, CalendarCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface PerformanceScoreGaugeProps {
  score: number
  label: string
  engagementScore: number
  reachScore: number
  consistencyScore: number
}

const LABEL_STYLES: Record<string, { text: string; ring: string; gauge: string }> = {
  excellent: {
    text: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    gauge: "text-emerald-500",
  },
  good: {
    text: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-500/20",
    gauge: "text-blue-500",
  },
  average: {
    text: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/20",
    gauge: "text-amber-500",
  },
  weak: {
    text: "text-red-600 dark:text-red-400",
    ring: "ring-red-500/20",
    gauge: "text-red-500",
  },
}

function ScoreCircle({ score, size = 96, strokeWidth = 8, className }: {
  score: number
  size?: number
  strokeWidth?: number
  className?: string
}) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30 dark:text-white/5"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={className}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-black text-foreground">
        {score}
      </span>
    </div>
  )
}

function SubScore({ icon, label, score }: {
  icon: React.ReactNode
  label: string
  score: number
}) {
  const barColor =
    score >= 80
      ? "bg-emerald-500"
      : score >= 50
      ? "bg-amber-500"
      : "bg-red-500"

  return (
    <div className="flex items-center gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 dark:bg-white/5 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-xs font-bold text-foreground">{score}/100</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted/40 dark:bg-white/5 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", barColor)}
            style={{ width: `${Math.min(100, score)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export function PerformanceScoreGauge({
  score,
  label,
  engagementScore,
  reachScore,
  consistencyScore,
}: PerformanceScoreGaugeProps) {
  const t = useTranslations("analytics")
  const style = LABEL_STYLES[label] ?? LABEL_STYLES.average

  return (
    <div className={cn("rounded-xl glass-card p-6", `ring-1 ${style.ring}`)}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Gauge circulaire */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <ScoreCircle score={score} className={style.gauge} />
          <div className="flex items-center gap-1.5">
            <Trophy className={cn("size-3.5", style.text)} />
            <span className={cn("text-xs font-bold uppercase tracking-wider", style.text)}>
              {t(`performanceLabel_${label}`)}
            </span>
          </div>
        </div>

        {/* Sous-scores */}
        <div className="flex-1 space-y-3">
          <div className="mb-3">
            <h3 className="text-base font-bold text-foreground">{t("performanceScore")}</h3>
            <p className="text-xs text-muted-foreground">{t("performanceScoreDesc")}</p>
          </div>
          <SubScore
            icon={<TrendingUp className="size-4" />}
            label={t("engagementSubScore")}
            score={engagementScore}
          />
          <SubScore
            icon={<Eye className="size-4" />}
            label={t("reachSubScore")}
            score={reachScore}
          />
          <SubScore
            icon={<CalendarCheck className="size-4" />}
            label={t("consistencySubScore")}
            score={consistencyScore}
          />
        </div>
      </div>
    </div>
  )
}
