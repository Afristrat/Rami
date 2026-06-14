"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useCallback } from "react"
import { useTranslations } from "next-intl"
import { PLATFORM_CONFIG, ALL_PLATFORMS } from "@/lib/scheduler/platform-config"
import type { PeriodOption } from "@/app/actions/analytics"
import type { Platform } from "@/lib/scheduler/platform-config"
import { cn } from "@/lib/utils"

type ExtendedPeriod = PeriodOption | "12m"

const PERIOD_OPTIONS: { value: ExtendedPeriod; label: string }[] = [
  { value: "7d", label: "7J" },
  { value: "30d", label: "30J" },
  { value: "90d", label: "90J" },
  { value: "12m", label: "12M" },
]

/** Couleurs fixes par plateforme pour les pastilles */
const PLATFORM_BADGE_COLORS: Partial<Record<Platform, { bg: string; text: string; letter: string }>> = {
  linkedin:  { bg: "bg-blue-600", text: "text-white", letter: "L" },
  instagram: { bg: "bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600", text: "text-white", letter: "I" },
  twitter:   { bg: "bg-slate-600 dark:bg-slate-700", text: "text-white", letter: "X" },
  facebook:  { bg: "bg-blue-700", text: "text-white", letter: "F" },
}

interface AnalyticsFiltersProps {
  currentPeriod: PeriodOption
  currentPlatforms: Platform[]
}

export function AnalyticsFilters({ currentPeriod, currentPlatforms }: AnalyticsFiltersProps) {
  const t = useTranslations("analytics")
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
      router.replace(`/dashboard/analytics?${params.toString()}`)
    })
  }, [router, searchParams])

  const togglePlatform = useCallback((platform: Platform) => {
    const next = currentPlatforms.includes(platform)
      ? currentPlatforms.filter(p => p !== platform)
      : [...currentPlatforms, platform]
    updateFilters(currentPeriod, next)
  }, [currentPeriod, currentPlatforms, updateFilters])

  const handlePeriodChange = useCallback((period: ExtendedPeriod) => {
    // 12m maps to 90d for now (until server action supports it)
    const serverPeriod: PeriodOption = period === "12m" ? "90d" : period
    updateFilters(serverPeriod, currentPlatforms)
  }, [currentPlatforms, updateFilters])

  const effectivePeriod: ExtendedPeriod = currentPeriod

  return (
    <div className={cn(
      "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center transition-opacity",
      isPending && "opacity-60"
    )}>
      {/* Période toggle */}
      <div className="flex items-center gap-0.5 rounded-lg bg-background border border-border p-1">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={cn(
              "rounded-md px-4 py-1.5 text-xs font-semibold transition-colors",
              effectivePeriod === opt.value
                ? "bg-muted dark:bg-white/10 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Plateformes chips avec pastilles colorées */}
      <div className="flex items-center gap-2 rounded-lg bg-background border border-border px-4 py-2 cursor-pointer hover:border-primary/50 transition-all">
        <span className="text-xs font-semibold text-muted-foreground">{t("platformsLabel")}</span>
        <div className="flex -space-x-1.5">
          {ALL_PLATFORMS.slice(0, 4).map(platform => {
            const badge = PLATFORM_BADGE_COLORS[platform]
            const isActive = currentPlatforms.length === 0 || currentPlatforms.includes(platform)
            if (!badge) return null
            return (
              <button
                key={platform}
                onClick={() => togglePlatform(platform)}
                className={cn(
                  "flex size-5 items-center justify-center rounded-full ring-2 ring-white dark:ring-background text-[8px] font-bold transition-opacity",
                  badge.bg,
                  badge.text,
                  !isActive && "opacity-30"
                )}
                title={PLATFORM_CONFIG[platform].label}
              >
                {badge.letter}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}
