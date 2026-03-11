"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useCallback } from "react"
import { PLATFORM_CONFIG, ALL_PLATFORMS } from "@/lib/scheduler/platform-config"
import type { PeriodOption } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "90d", label: "90 jours" },
]

interface AnalyticsFiltersProps {
  currentPeriod: PeriodOption
  currentPlatforms: Platform[]
}

export function AnalyticsFilters({ currentPeriod, currentPlatforms }: AnalyticsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const updateFilters = useCallback((period: PeriodOption, platforms: Platform[]) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", period)
    if (platforms.length > 0) {
      params.set("platforms", platforms.join(","))
    } else {
      params.delete("platforms")
    }
    startTransition(() => {
      router.replace(`/analytics?${params.toString()}`)
    })
  }, [router, searchParams])

  const togglePlatform = useCallback((platform: Platform) => {
    const next = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform]
    updateFilters(currentPeriod, next)
  }, [currentPeriod, currentPlatforms, updateFilters])

  return (
    <div className={`flex flex-wrap items-center gap-3 transition-opacity ${isPending ? "opacity-60" : ""}`}>
      {/* Sélecteur de période */}
      <div className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.03] p-1">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => updateFilters(opt.value, currentPlatforms)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              currentPeriod === opt.value
                ? "bg-violet-600 text-white shadow-sm"
                : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Filtres plateformes */}
      <div className="flex flex-wrap items-center gap-1">
        {ALL_PLATFORMS.map(platform => {
          const config = PLATFORM_CONFIG[platform]
          const isActive = currentPlatforms.includes(platform)
          return (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                isActive
                  ? "border-transparent text-white"
                  : "border-white/[0.08] bg-white/[0.02] text-muted-foreground hover:border-white/[0.15] hover:text-foreground"
              }`}
              style={isActive ? { backgroundColor: config.color } : {}}
              title={config.label}
            >
              <span>{config.icon}</span>
              <span className="hidden sm:inline">{config.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
