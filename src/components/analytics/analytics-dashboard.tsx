"use client"

import { Suspense } from "react"
import { KPICards } from "./kpi-cards"
import { EngagementChart } from "./engagement-chart"
import { PostsStatusChart } from "./posts-status-chart"
import { TopPostsTable } from "./top-posts-table"
import { AnalyticsFilters } from "./analytics-filters"
import type { AnalyticsData, PeriodOption } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"

interface AnalyticsDashboardProps {
  data: AnalyticsData
  period: PeriodOption
  platforms: Platform[]
}

export function AnalyticsDashboard({ data, period, platforms }: AnalyticsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Suspense>
        <AnalyticsFilters currentPeriod={period} currentPlatforms={platforms} />
      </Suspense>

      {/* KPIs */}
      <KPICards kpis={data.kpis} />

      {/* Graphiques */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Engagement par plateforme — 2/3 de largeur */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Engagement par plateforme</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Interactions quotidiennes sur les {period === "7d" ? "7" : period === "30d" ? "30" : "90"} derniers jours
            </p>
          </div>
          <EngagementChart data={data.dailyEngagement} />
        </div>

        {/* Répartition des posts par statut — 1/3 */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold">Statut des posts</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Tous vos posts, toutes périodes</p>
          </div>
          <PostsStatusChart data={data.postsByStatus} />
        </div>
      </div>

      {/* Top 5 posts */}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Top 5 posts par engagement</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Posts les plus performants sur la période
            </p>
          </div>
          {data.kpis.publishedCount > 5 && (
            <span className="text-xs text-muted-foreground/60">
              sur {data.kpis.publishedCount} publiés
            </span>
          )}
        </div>
        <TopPostsTable posts={data.topPosts} />
      </div>

      {/* Ayrshare notice */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
        <p className="text-xs text-violet-300/80">
          <span className="font-semibold text-violet-300">Phase 2 — Données réelles :</span>{" "}
          Les métriques d&apos;engagement (impressions, likes, partages, clics) seront synchronisées
          automatiquement via l&apos;API Ayrshare. Les données actuelles sont des estimations simulées.
        </p>
      </div>
    </div>
  )
}
