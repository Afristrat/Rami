import { Suspense } from "react"
import { BarChart3 } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { getAnalyticsData } from "@/app/actions/analytics"
import { AnalyticsEmptyState } from "./empty-state"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"
import type { PeriodOption } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"
import { ALL_PLATFORMS } from "@/lib/scheduler/platform-config"

export async function generateMetadata() {
  const t = await getTranslations("metadata")
  return {
    title: t("analytics"),
    description: t("analyticsDescription"),
  }
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

  // Empty state
  if (result.data.kpis.publishedCount === 0 && result.data.topPosts.length === 0) {
    return <AnalyticsEmptyState />
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
      <div className="flex gap-3">
        <div className="h-9 w-48 rounded-lg bg-muted/40 dark:bg-white/[0.04]" />
        <div className="h-9 w-72 rounded-lg bg-muted/40 dark:bg-white/[0.04]" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted/40 dark:bg-white/[0.04]" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-10">
        <div className="h-80 rounded-xl bg-muted/40 dark:bg-white/[0.04] lg:col-span-6" />
        <div className="h-80 rounded-xl bg-muted/40 dark:bg-white/[0.04] lg:col-span-4" />
      </div>
      <div className="h-64 rounded-xl bg-muted/40 dark:bg-white/[0.04]" />
    </div>
  )
}

export default function AnalyticsPage({ searchParams }: PageProps) {
  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Analytics</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="font-medium text-foreground">Performance</span>
        </div>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}
