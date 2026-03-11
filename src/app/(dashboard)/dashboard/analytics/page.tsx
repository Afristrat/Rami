import { Suspense } from "react"
import { BarChart3 } from "lucide-react"
import { getAnalyticsData } from "@/app/actions/analytics"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import type { PeriodOption } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"
import { ALL_PLATFORMS } from "@/lib/scheduler/platform-config"

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
