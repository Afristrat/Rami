"use client"

import { Suspense, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Search, SlidersHorizontal } from "lucide-react"
import { KPICards } from "./kpi-cards"
import { EngagementChart } from "./engagement-chart"
import { PlatformDonutChart } from "./platform-donut-chart"
import { TopPostsTable } from "./top-posts-table"
import { AnalyticsFilters } from "./analytics-filters"
import { AiRecommendations } from "./ai-recommendations"
import { PerformanceScoreGauge } from "./performance-score-gauge"
import type { AnalyticsData, PeriodOption, AiRecommendation } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"

interface AnalyticsDashboardProps {
  data: AnalyticsData
  period: PeriodOption
  platforms: Platform[]
  recommendations: AiRecommendation[]
}

/**
 * Calcule un score de performance global (0-100) basé sur :
 * - Taux d'engagement (poids 40%)
 * - Croissance du reach (poids 30%)
 * - Régularité de publication (poids 30%)
 */
function computePerformanceScore(data: AnalyticsData): {
  score: number
  engagementScore: number
  reachScore: number
  consistencyScore: number
  label: string
} {
  // Engagement : normalisé 0-100 (un taux de 6%+ = excellent = 100)
  const engagementScore = Math.min(100, Math.round((data.kpis.engagementRate / 6) * 100))

  // Reach : basé sur le delta d'impressions (positif = bon)
  const reachScore = Math.min(100, Math.max(0, 50 + data.kpis.impressionsDelta))

  // Régularité : basé sur le nombre de jours avec des publications
  const daysWithPosts = data.dailyEngagement.filter((d) => {
    const total = Object.entries(d)
      .filter(([k]) => k !== "date")
      .reduce((sum, [, v]) => sum + (typeof v === "number" ? v : 0), 0)
    return total > 0
  }).length
  const totalDays = data.dailyEngagement.length || 1
  const consistencyScore = Math.min(100, Math.round((daysWithPosts / totalDays) * 100 * 1.5))

  const score = Math.round(
    engagementScore * 0.4 + reachScore * 0.3 + consistencyScore * 0.3
  )

  let label: string
  if (score >= 80) label = "excellent"
  else if (score >= 60) label = "good"
  else if (score >= 40) label = "average"
  else label = "weak"

  return { score, engagementScore, reachScore, consistencyScore, label }
}

/**
 * Calcule un score d'engagement individuel pour un post (0-100).
 */
export function computePostEngagementScore(engagementScore: number): number {
  // Normaliser autour de 500 (score moyen attendu)
  return Math.min(100, Math.round((engagementScore / 500) * 100))
}

export function AnalyticsDashboard({ data, period, platforms, recommendations }: AnalyticsDashboardProps) {
  const t = useTranslations("analytics")
  const perfScore = useMemo(() => computePerformanceScore(data), [data])

  return (
    <div className="space-y-8">
      {/* Row 0 : Filtres — période + plateformes + Export PDF */}
      <Suspense>
        <AnalyticsFilters currentPeriod={period} currentPlatforms={platforms} />
      </Suspense>

      {/* Performance Score */}
      <PerformanceScoreGauge
        score={perfScore.score}
        label={perfScore.label}
        engagementScore={perfScore.engagementScore}
        reachScore={perfScore.reachScore}
        consistencyScore={perfScore.consistencyScore}
      />

      {/* Row 1 : 5 KPI cards */}
      <KPICards kpis={data.kpis} />

      {/* Row 2 : Charts — Engagement bar chart (2/3) + Platform donut (1/3) */}
      <div className="grid gap-6 lg:grid-cols-10">
        {/* Engagement par plateforme — grouped bar chart */}
        <div className="lg:col-span-6 rounded-xl glass-card p-6">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-bold text-foreground">{t("engagementByPlatform")}</h3>
              <p className="text-xs text-muted-foreground">{t("weeklyOverview")}</p>
            </div>
          </div>
          <EngagementChart data={data.dailyEngagement} />
        </div>

        {/* Répartition par plateforme — donut chart */}
        <div className="lg:col-span-4 rounded-xl glass-card p-6 flex flex-col">
          <h3 className="text-base font-bold text-foreground mb-4">{t("platformDistribution")}</h3>
          <PlatformDonutChart data={data.dailyEngagement} />
        </div>
      </div>

      {/* Row 3 : Top 5 Posts table */}
      <div className="rounded-xl glass-card overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground">{t("topPublications")}</h3>
            {data.kpis.publishedCount > 5 && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {t("publishedOf", { count: data.kpis.publishedCount })}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors">
              <SlidersHorizontal className="size-4" />
            </button>
            <button className="flex size-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted/50 transition-colors">
              <Search className="size-4" />
            </button>
            <a
              href="#"
              className="ml-2 text-xs font-semibold text-primary hover:underline hidden sm:inline"
            >
              {t("viewFullReport")}
            </a>
          </div>
        </div>
        <TopPostsTable posts={data.topPosts} />
      </div>

      {/* Row 4 : AI Recommendations (attribution réelle) */}
      <AiRecommendations recommendations={recommendations} />
    </div>
  )
}
