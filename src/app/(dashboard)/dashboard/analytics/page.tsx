import type { Metadata } from "next"
import { Suspense } from "react"
import { BarChart3, TrendingUp } from "lucide-react"
import Link from "next/link"
import { getAnalyticsData } from "@/app/actions/analytics"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import type { PeriodOption } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"
import { ALL_PLATFORMS } from "@/lib/scheduler/platform-config"

export const metadata: Metadata = {
  title: "Analytics — RAMI",
  description: "Analysez les performances de vos publications sur toutes les plateformes sociales.",
}

interface PageProps {
  searchParams: Promise<{
    period?: string
    platforms?: string
  }>
}

function isValidPeriod(v: string | undefined): v is PeriodOption {
  return v === "7d" || v === "30d" || v === "90d"
}

async function AnalyticsContent({ searchParams }: PageProps) {
  const params = await searchParams
  const period: PeriodOption = isValidPeriod(params.period) ? params.period : "30d"

  const rawPlatforms = params.platforms?.split(",").filter(p =>
    ALL_PLATFORMS.includes(p as Platform)
  ) as Platform[] | undefined
  const platforms = rawPlatforms ?? []

  const result = await getAnalyticsData(period, platforms.length > 0 ? platforms : undefined)

  if (!result.success) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
        <BarChart3 className="size-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{result.error}</p>
      </div>
    )
  }

  // Empty state illustré — aucun post publié sur la période
  if (result.data.kpis.publishedCount === 0 && result.data.topPosts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        {/* Illustration SVG */}
        <div className="mb-6 flex size-24 items-center justify-center rounded-3xl bg-violet-500/10">
          <TrendingUp className="size-12 text-violet-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Pas encore de données</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Publiez vos premiers posts pour voir apparaître vos statistiques d&apos;engagement,
          de portée et de performance ici.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard/create"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Créer du contenu
          </Link>
          <Link
            href="/dashboard/calendar"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            Voir le calendrier
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AnalyticsDashboard
      data={result.data}
      period={period}
      platforms={platforms}
    />
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filtres skeleton */}
      <div className="flex gap-3">
        <div className="h-9 w-48 rounded-lg bg-white/[0.04]" />
        <div className="h-9 w-72 rounded-lg bg-white/[0.04]" />
      </div>
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-white/[0.04]" />
        ))}
      </div>
      {/* Charts skeleton */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-80 rounded-xl bg-white/[0.04] lg:col-span-2" />
        <div className="h-80 rounded-xl bg-white/[0.04]" />
      </div>
      {/* Top posts skeleton */}
      <div className="h-64 rounded-xl bg-white/[0.04]" />
    </div>
  )
}

export default function AnalyticsPage({ searchParams }: PageProps) {
  return (
    <div className="min-h-full p-6">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/10">
            <BarChart3 className="size-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">
              Performance de vos publications sur toutes les plateformes
            </p>
          </div>
        </div>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
